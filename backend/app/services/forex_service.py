"""Fetches AUD-quoted FX rates from Open Exchange Rates.

The free tier of Open Exchange Rates only allows USD as the base currency, so this
service fetches USD-based rates and derives AUD-based cross rates:

    rate(AUD -> X) = rate(USD -> X) / rate(USD -> AUD)
"""

from datetime import UTC, datetime, timedelta

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.models.fx import FxRate, FxSnapshot
from app.schemas.common import PricePoint
from app.schemas.fx import FxHistoryResponse, FxQuote
from app.utils.cache import market_data_cache
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPEN_EXCHANGE_BASE_URL = "https://openexchangerates.org/api"


class UpstreamAPIError(Exception):
    """Raised when the upstream provider fails after retries."""


class FxPairNotFoundError(Exception):
    """Raised when the requested quote currency is not available upstream."""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4), reraise=True)
def _get(url: str, params: dict) -> dict:
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def _fetch_usd_rates() -> dict[str, float]:
    settings = get_settings()

    def _build() -> dict[str, float]:
        try:
            data = _get(
                f"{OPEN_EXCHANGE_BASE_URL}/latest.json",
                params={"app_id": settings.open_exchange_api_key},
            )
        except requests.RequestException as exc:
            logger.error("Failed to fetch FX rates from Open Exchange Rates: %s", exc)
            raise UpstreamAPIError("Open Exchange Rates request failed") from exc
        return data.get("rates", {})

    return market_data_cache.get_or_set("fx_usd_rates", _build, ttl_seconds=900)


def _aud_cross_rates() -> dict[str, float]:
    usd_rates = _fetch_usd_rates()
    usd_to_aud = usd_rates.get("AUD")
    if not usd_to_aud:
        raise UpstreamAPIError("USD/AUD rate unavailable from Open Exchange Rates")
    return {currency: rate / usd_to_aud for currency, rate in usd_rates.items() if currency != "AUD"}


def get_fx_quotes(quote_currencies: list[str]) -> list[FxQuote]:
    """Fetch live AUD-based exchange rates for a batch of quote currencies."""
    cross_rates = _aud_cross_rates()
    now = datetime.now(UTC).isoformat()
    quotes: list[FxQuote] = []
    for currency in quote_currencies:
        rate = cross_rates.get(currency)
        if rate is None:
            logger.warning("Quote currency '%s' not found in Open Exchange Rates response", currency)
            continue
        quotes.append(
            FxQuote(
                quote_currency=currency,
                pair=f"AUD/{currency}",
                rate=round(rate, 6),
                updated_at=now,
            )
        )
    return quotes


def get_fx_quote(quote_currency: str) -> FxQuote:
    """Fetch a single AUD-based exchange rate."""
    quotes = get_fx_quotes([quote_currency])
    if not quotes:
        raise FxPairNotFoundError(f"No data found for currency '{quote_currency}'")
    return quotes[0]


def enrich_fx_quotes(quotes: list[FxQuote], db: Session) -> list[FxQuote]:
    """Fill in day_change_pct and a sparkline from our own stored fx_snapshots.

    Open Exchange Rates' free tier only allows the current rate, so day-over-day
    change and trend data come from the scheduler's own 15-minute snapshot history
    instead of another upstream call. Both fields stay None/empty until at least a
    day of snapshots has accumulated (e.g. right after first deploying).
    """
    return [_enrich_one(quote, db) for quote in quotes]


def _enrich_one(quote: FxQuote, db: Session) -> FxQuote:
    fx_rate = db.execute(
        select(FxRate).where(
            FxRate.base_currency == quote.base_currency, FxRate.quote_currency == quote.quote_currency
        )
    ).scalar_one_or_none()
    if fx_rate is None:
        return quote

    since = datetime.utcnow() - timedelta(days=2)
    snapshots = (
        db.execute(
            select(FxSnapshot)
            .where(FxSnapshot.fx_rate_id == fx_rate.id, FxSnapshot.timestamp >= since)
            .order_by(FxSnapshot.timestamp)
        )
        .scalars()
        .all()
    )
    if not snapshots:
        return quote

    sparkline = [
        PricePoint(timestamp=s.timestamp.isoformat(), value=round(s.rate, 6)) for s in snapshots[-30:]
    ]

    day_ago = datetime.utcnow() - timedelta(hours=24)
    baseline = next((s for s in snapshots if s.timestamp >= day_ago), None)
    day_change_pct = (
        round((quote.rate - baseline.rate) / baseline.rate * 100, 4) if baseline and baseline.rate else None
    )

    return quote.model_copy(update={"sparkline": sparkline, "day_change_pct": day_change_pct})


def get_fx_history(quote_currency: str, chart_range: str) -> FxHistoryResponse:
    """Fetch a historical AUD-based rate series using Open Exchange Rates' historical endpoint.

    The free tier requires one request per historical day, so this is intentionally
    limited to a handful of sampled days to stay within free-tier rate limits.
    """
    settings = get_settings()
    days_by_range = {"1D": 1, "1W": 7, "1M": 30, "3M": 90}
    sample_points = {"1D": 1, "1W": 7, "1M": 10, "3M": 12}

    if chart_range not in days_by_range:
        raise ValueError(f"Unsupported range '{chart_range}'")

    def _build() -> FxHistoryResponse:
        total_days = days_by_range[chart_range]
        num_samples = min(sample_points[chart_range], total_days) or 1
        step = max(total_days // num_samples, 1)
        points: list[PricePoint] = []

        for offset in range(0, total_days + 1, step):
            date = (datetime.now(UTC) - timedelta(days=offset)).strftime("%Y-%m-%d")
            try:
                data = _get(
                    f"{OPEN_EXCHANGE_BASE_URL}/historical/{date}.json",
                    params={"app_id": settings.open_exchange_api_key},
                )
            except requests.RequestException as exc:
                logger.warning("Skipping historical FX sample for %s: %s", date, exc)
                continue

            usd_rates = data.get("rates", {})
            usd_to_aud = usd_rates.get("AUD")
            rate = usd_rates.get(quote_currency)
            if not usd_to_aud or not rate:
                continue
            points.append(PricePoint(timestamp=date, value=round(rate / usd_to_aud, 6)))

        points.reverse()
        if not points:
            raise FxPairNotFoundError(f"No historical data found for currency '{quote_currency}'")
        return FxHistoryResponse(pair=f"AUD/{quote_currency}", range=chart_range, points=points)

    return market_data_cache.get_or_set(
        f"fx_history:{quote_currency}:{chart_range}", _build, ttl_seconds=3600
    )
