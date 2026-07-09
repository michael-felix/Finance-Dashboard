"""Seeds the reference tables (stocks, crypto, fx_rates) from the configured default watchlist.

Run directly with `python -m app.database.seed`, or it is called automatically by the
scheduler's first snapshot job so a fresh database is usable immediately.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.crypto import Crypto
from app.models.fx import FxRate
from app.models.stock import Stock
from app.utils.constants import STOCK_NAMES
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Human-readable names for the default coins, used only for seeding.
_CRYPTO_NAMES = {
    "bitcoin": ("BTC", "Bitcoin"),
    "ethereum": ("ETH", "Ethereum"),
    "solana": ("SOL", "Solana"),
}


def seed_reference_data(db: Session) -> None:
    """Idempotently insert reference rows for the configured default watchlist."""
    settings = get_settings()

    for ticker in settings.stock_ticker_list:
        exists = db.execute(select(Stock).where(Stock.ticker == ticker)).scalar_one_or_none()
        if exists is None:
            db.add(Stock(ticker=ticker, name=STOCK_NAMES.get(ticker, ticker)))
            logger.info("Seeded stock %s", ticker)

    for coin_id in settings.crypto_id_list:
        exists = db.execute(select(Crypto).where(Crypto.coingecko_id == coin_id)).scalar_one_or_none()
        if exists is None:
            symbol, name = _CRYPTO_NAMES.get(coin_id, (coin_id.upper()[:6], coin_id))
            db.add(Crypto(coingecko_id=coin_id, symbol=symbol, name=name))
            logger.info("Seeded crypto %s", coin_id)

    for currency in settings.fx_pair_list:
        exists = db.execute(
            select(FxRate).where(FxRate.base_currency == "AUD", FxRate.quote_currency == currency)
        ).scalar_one_or_none()
        if exists is None:
            db.add(FxRate(base_currency="AUD", quote_currency=currency))
            logger.info("Seeded FX pair AUD/%s", currency)

    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_reference_data(session)
    logger.info("Reference data seed complete")
