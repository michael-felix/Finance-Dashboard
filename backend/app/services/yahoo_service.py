"""Fetches ASX stock quotes and historical prices from Yahoo Finance via yfinance."""
from datetime import UTC, datetime

import yfinance as yf
from tenacity import retry, stop_after_attempt, wait_exponential

from app.schemas.common import PricePoint
from app.schemas.stock import StockHistoryResponse, StockQuote
from app.utils.cache import market_data_cache
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Yahoo interval/period combinations used to satisfy each supported chart range.
_RANGE_TO_PERIOD_INTERVAL: dict[str, tuple[str, str]] = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "15m"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
}


class StockNotFoundError(Exception):
    """Raised when Yahoo Finance has no data for the requested ticker."""


class UpstreamAPIError(Exception):
    """Raised when the upstream provider fails after retries."""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4), reraise=True)
def _fetch_ticker_history(ticker: str, period: str, interval: str):
    return yf.Ticker(ticker).history(period=period, interval=interval)


def get_stock_quote(ticker: str, company_name: str | None = None) -> StockQuote:
    """Fetch the latest quote plus day/week/month deltas and a sparkline for a ticker."""

    def _build() -> StockQuote:
        try:
            history_1mo = _fetch_ticker_history(ticker, period="1mo", interval="1d")
        except Exception as exc:  # noqa: BLE001 - normalized into a domain error below
            logger.error("Failed to fetch %s from Yahoo Finance: %s", ticker, exc)
            raise UpstreamAPIError(f"Yahoo Finance request failed for {ticker}") from exc

        if history_1mo.empty:
            raise StockNotFoundError(f"No data found for ticker '{ticker}'")

        closes = history_1mo["Close"].dropna()
        latest = closes.iloc[-1]
        prev_day = closes.iloc[-2] if len(closes) >= 2 else latest
        week_ago = closes.iloc[-6] if len(closes) >= 6 else closes.iloc[0]
        month_ago = closes.iloc[0]

        day_change = float(latest - prev_day)
        day_change_pct = (day_change / prev_day * 100) if prev_day else 0.0
        week_change_pct = ((latest - week_ago) / week_ago * 100) if week_ago else None
        month_change_pct = ((latest - month_ago) / month_ago * 100) if month_ago else None

        info = yf.Ticker(ticker).fast_info
        sparkline = [
            PricePoint(timestamp=ts.isoformat(), value=round(float(val), 4))
            for ts, val in closes.tail(30).items()
        ]

        return StockQuote(
            ticker=ticker,
            name=company_name or ticker,
            price=round(float(latest), 4),
            day_change=round(day_change, 4),
            day_change_pct=round(day_change_pct, 4),
            week_change_pct=round(week_change_pct, 4) if week_change_pct is not None else None,
            month_change_pct=round(month_change_pct, 4) if month_change_pct is not None else None,
            day_high=round(float(info.get("dayHigh")), 4) if info.get("dayHigh") else None,
            day_low=round(float(info.get("dayLow")), 4) if info.get("dayLow") else None,
            volume=int(info.get("lastVolume")) if info.get("lastVolume") else None,
            sparkline=sparkline,
            updated_at=datetime.now(UTC).isoformat(),
        )

    return market_data_cache.get_or_set(f"stock_quote:{ticker}", _build, ttl_seconds=60)


def get_stock_history(ticker: str, chart_range: str) -> StockHistoryResponse:
    """Fetch a historical close-price series for a ticker over a supported chart range."""
    if chart_range not in _RANGE_TO_PERIOD_INTERVAL:
        raise ValueError(f"Unsupported range '{chart_range}'")

    def _build() -> StockHistoryResponse:
        period, interval = _RANGE_TO_PERIOD_INTERVAL[chart_range]
        try:
            history = _fetch_ticker_history(ticker, period=period, interval=interval)
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to fetch history for %s: %s", ticker, exc)
            raise UpstreamAPIError(f"Yahoo Finance request failed for {ticker}") from exc

        if history.empty:
            raise StockNotFoundError(f"No historical data found for ticker '{ticker}'")

        points = [
            PricePoint(timestamp=ts.isoformat(), value=round(float(val), 4))
            for ts, val in history["Close"].dropna().items()
        ]
        return StockHistoryResponse(ticker=ticker, range=chart_range, points=points)

    return market_data_cache.get_or_set(
        f"stock_history:{ticker}:{chart_range}", _build, ttl_seconds=300
    )
