"""Aggregates stock, crypto, and FX data into the top-of-dashboard market summary."""
from datetime import UTC, datetime
from statistics import mean

from sqlalchemy.orm import Session

from app.schemas.summary import MarketSummary, TopMover
from app.services import coingecko_service, forex_service, yahoo_service
from app.services.tracked_assets_service import (
    get_tracked_crypto_ids,
    get_tracked_fx_currencies,
    get_tracked_stocks,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

_CRYPTO_BULL_THRESHOLD = 1.0
_CRYPTO_BEAR_THRESHOLD = -1.0
_AUD_STRONG_THRESHOLD = 0.3
_AUD_WEAK_THRESHOLD = -0.3


def build_market_summary(db: Session) -> MarketSummary:
    """Compute the strongest/weakest ASX movers, crypto direction, and AUD strength."""
    now = datetime.now(UTC).isoformat()

    strongest_stock: TopMover | None = None
    weakest_stock: TopMover | None = None
    stock_quotes = []
    for ticker, name in get_tracked_stocks(db):
        try:
            stock_quotes.append(yahoo_service.get_stock_quote(ticker, company_name=name))
        except Exception as exc:  # noqa: BLE001 - one bad ticker shouldn't break the summary
            logger.warning("Skipping %s in market summary: %s", ticker, exc)

    if stock_quotes:
        best = max(stock_quotes, key=lambda q: q.day_change_pct)
        worst = min(stock_quotes, key=lambda q: q.day_change_pct)
        strongest_stock = TopMover(
            symbol=best.ticker, name=best.name, change_pct=best.day_change_pct, price=best.price
        )
        weakest_stock = TopMover(
            symbol=worst.ticker, name=worst.name, change_pct=worst.day_change_pct, price=worst.price
        )

    crypto_avg_change = 0.0
    try:
        crypto_quotes = coingecko_service.get_crypto_quotes(get_tracked_crypto_ids(db))
        changes = [q.change_24h_pct for q in crypto_quotes if q.change_24h_pct is not None]
        crypto_avg_change = round(mean(changes), 4) if changes else 0.0
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping crypto in market summary: %s", exc)

    if crypto_avg_change >= _CRYPTO_BULL_THRESHOLD:
        crypto_direction = "bullish"
    elif crypto_avg_change <= _CRYPTO_BEAR_THRESHOLD:
        crypto_direction = "bearish"
    else:
        crypto_direction = "neutral"

    aud_avg_change = 0.0
    try:
        fx_quotes = forex_service.get_fx_quotes(get_tracked_fx_currencies(db))
        fx_quotes = forex_service.enrich_fx_quotes(fx_quotes, db)
        deltas = [q.day_change_pct for q in fx_quotes if q.day_change_pct is not None]
        aud_avg_change = round(mean(deltas), 4) if deltas else 0.0
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping FX in market summary: %s", exc)

    if aud_avg_change >= _AUD_STRONG_THRESHOLD:
        aud_indicator = "strengthening"
    elif aud_avg_change <= _AUD_WEAK_THRESHOLD:
        aud_indicator = "weakening"
    else:
        aud_indicator = "stable"

    return MarketSummary(
        strongest_stock=strongest_stock,
        weakest_stock=weakest_stock,
        crypto_market_direction=crypto_direction,
        crypto_average_change_pct=crypto_avg_change,
        aud_strength_indicator=aud_indicator,
        aud_average_change_pct=aud_avg_change,
        generated_at=now,
    )
