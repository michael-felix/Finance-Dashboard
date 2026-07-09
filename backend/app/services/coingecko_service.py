"""Fetches cryptocurrency quotes and historical prices from the CoinGecko public API."""
from datetime import UTC, datetime

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from app.schemas.common import PricePoint
from app.schemas.crypto import CryptoHistoryResponse, CryptoQuote
from app.utils.cache import market_data_cache
from app.utils.logger import get_logger

logger = get_logger(__name__)

COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"

# CoinGecko days-back parameter for each supported chart range.
_RANGE_TO_DAYS: dict[str, int] = {"1D": 1, "1W": 7, "1M": 30, "3M": 90}


class CoinNotFoundError(Exception):
    """Raised when CoinGecko has no data for the requested coin id."""


class UpstreamAPIError(Exception):
    """Raised when the upstream provider fails after retries."""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4), reraise=True)
def _get(url: str, params: dict) -> dict:
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def get_crypto_quotes(coin_ids: list[str]) -> list[CryptoQuote]:
    """Fetch live price, market cap, and 24h/7d change for a batch of coins, priced in AUD."""

    def _build() -> list[CryptoQuote]:
        try:
            data = _get(
                f"{COINGECKO_BASE_URL}/coins/markets",
                params={
                    "vs_currency": "aud",
                    "ids": ",".join(coin_ids),
                    "sparkline": "true",
                    "price_change_percentage": "24h,7d",
                },
            )
        except requests.RequestException as exc:
            logger.error("Failed to fetch crypto quotes from CoinGecko: %s", exc)
            raise UpstreamAPIError("CoinGecko request failed") from exc

        quotes = []
        for coin in data:
            sparkline_prices = coin.get("sparkline_in_7d", {}).get("price", [])
            quotes.append(
                CryptoQuote(
                    id=coin["id"],
                    symbol=coin["symbol"].upper(),
                    name=coin["name"],
                    price_aud=coin.get("current_price", 0.0),
                    market_cap_aud=coin.get("market_cap"),
                    volume_24h_aud=coin.get("total_volume"),
                    change_24h_pct=coin.get("price_change_percentage_24h_in_currency")
                    or coin.get("price_change_percentage_24h"),
                    change_7d_pct=coin.get("price_change_percentage_7d_in_currency"),
                    sparkline=[
                        PricePoint(timestamp=str(i), value=round(price, 4))
                        for i, price in enumerate(sparkline_prices[-48:])
                    ],
                    updated_at=datetime.now(UTC).isoformat(),
                )
            )
        return quotes

    cache_key = f"crypto_quotes:{','.join(sorted(coin_ids))}"
    return market_data_cache.get_or_set(cache_key, _build, ttl_seconds=60)


def get_crypto_quote(coin_id: str) -> CryptoQuote:
    """Fetch a single coin's live quote."""
    quotes = get_crypto_quotes([coin_id])
    if not quotes:
        raise CoinNotFoundError(f"No data found for coin '{coin_id}'")
    return quotes[0]


def get_crypto_history(coin_id: str, chart_range: str) -> CryptoHistoryResponse:
    """Fetch a historical price series for a coin over a supported chart range, priced in AUD."""
    if chart_range not in _RANGE_TO_DAYS:
        raise ValueError(f"Unsupported range '{chart_range}'")

    def _build() -> CryptoHistoryResponse:
        try:
            data = _get(
                f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart",
                params={"vs_currency": "aud", "days": _RANGE_TO_DAYS[chart_range]},
            )
        except requests.RequestException as exc:
            logger.error("Failed to fetch history for %s: %s", coin_id, exc)
            raise UpstreamAPIError(f"CoinGecko request failed for {coin_id}") from exc

        prices = data.get("prices", [])
        if not prices:
            raise CoinNotFoundError(f"No historical data found for coin '{coin_id}'")

        points = [
            PricePoint(
                timestamp=datetime.fromtimestamp(ts_ms / 1000, tz=UTC).isoformat(),
                value=round(price, 4),
            )
            for ts_ms, price in prices
        ]
        return CryptoHistoryResponse(id=coin_id, range=chart_range, points=points)

    return market_data_cache.get_or_set(
        f"crypto_history:{coin_id}:{chart_range}", _build, ttl_seconds=300
    )
