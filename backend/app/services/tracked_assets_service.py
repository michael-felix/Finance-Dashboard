"""Reads/writes the DB-backed tracked-asset lists (which tickers/coins/pairs are live).

Presence of a row in `stocks` / `crypto` / `fx_rates` *is* "tracked" — the admin
asset-management endpoints simply insert/delete rows here. If the table is empty
(e.g. a fresh DB before the scheduler's first seed, or the scheduler disabled in
dev), callers fall back to the env-configured default watchlist so the dashboard
still shows something.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.crypto import Crypto
from app.models.fx import FxRate
from app.models.stock import Stock
from app.utils.constants import STOCK_NAMES


def get_tracked_stocks(db: Session) -> list[tuple[str, str]]:
    """Return (ticker, name) pairs for every tracked stock."""
    rows = db.execute(select(Stock.ticker, Stock.name)).all()
    if rows:
        return [(r.ticker, r.name) for r in rows]
    settings = get_settings()
    return [(t, STOCK_NAMES.get(t, t)) for t in settings.stock_ticker_list]


def get_tracked_crypto_ids(db: Session) -> list[str]:
    """Return CoinGecko ids for every tracked cryptocurrency."""
    rows = db.execute(select(Crypto.coingecko_id)).scalars().all()
    if rows:
        return list(rows)
    return get_settings().crypto_id_list


def get_tracked_fx_currencies(db: Session) -> list[str]:
    """Return quote-currency codes for every tracked FX pair."""
    rows = db.execute(select(FxRate.quote_currency).where(FxRate.base_currency == "AUD")).scalars().all()
    if rows:
        return list(rows)
    return get_settings().fx_pair_list
