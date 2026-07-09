"""APScheduler job definitions for the periodic market-data snapshot pipeline.

Every `SNAPSHOT_INTERVAL_MINUTES`, `run_snapshot_job` fetches the latest stock, crypto,
and FX data and persists a row per tracked asset into the `*_snapshots` tables. Each
asset class is isolated in its own try/except so a single bad ticker or an outage in
one upstream provider never blocks snapshots for the other two. Every run is logged to
`scheduler_runs` for the admin job-health view.
"""
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.seed import seed_reference_data
from app.database.session import SessionLocal
from app.models.crypto import Crypto, CryptoSnapshot
from app.models.fx import FxRate, FxSnapshot
from app.models.scheduler_run import SchedulerRun
from app.models.stock import Stock, StockSnapshot
from app.services import coingecko_service, forex_service, yahoo_service
from app.services.tracked_assets_service import (
    get_tracked_crypto_ids,
    get_tracked_fx_currencies,
    get_tracked_stocks,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _snapshot_stocks(db: Session) -> int:
    """Fetch and persist one snapshot row per tracked stock. Returns count stored."""
    stored = 0
    for ticker, name in get_tracked_stocks(db):
        try:
            quote = yahoo_service.get_stock_quote(ticker, company_name=name)
        except Exception as exc:  # noqa: BLE001 - one bad ticker shouldn't stop the batch
            logger.warning("Stock snapshot skipped for %s: %s", ticker, exc)
            continue

        stock = db.execute(select(Stock).where(Stock.ticker == ticker)).scalar_one_or_none()
        if stock is None:
            stock = Stock(ticker=ticker, name=quote.name)
            db.add(stock)
            db.flush()

        db.add(
            StockSnapshot(
                stock_id=stock.id,
                timestamp=datetime.utcnow(),
                price=quote.price,
                day_high=quote.day_high,
                day_low=quote.day_low,
                volume=quote.volume,
                source="yahoo_finance",
            )
        )
        stored += 1
    return stored


def _snapshot_crypto(db: Session) -> int:
    """Fetch and persist one snapshot row per tracked cryptocurrency. Returns count stored."""
    stored = 0
    try:
        quotes = coingecko_service.get_crypto_quotes(get_tracked_crypto_ids(db))
    except Exception as exc:  # noqa: BLE001 - CoinGecko outage shouldn't stop other snapshots
        logger.warning("Crypto snapshot batch skipped: %s", exc)
        return 0

    for quote in quotes:
        crypto = db.execute(
            select(Crypto).where(Crypto.coingecko_id == quote.id)
        ).scalar_one_or_none()
        if crypto is None:
            crypto = Crypto(coingecko_id=quote.id, symbol=quote.symbol, name=quote.name)
            db.add(crypto)
            db.flush()

        db.add(
            CryptoSnapshot(
                crypto_id=crypto.id,
                timestamp=datetime.utcnow(),
                price_aud=quote.price_aud,
                market_cap_aud=quote.market_cap_aud,
                volume_24h_aud=quote.volume_24h_aud,
                change_24h_pct=quote.change_24h_pct,
                source="coingecko",
            )
        )
        stored += 1
    return stored


def _snapshot_fx(db: Session) -> int:
    """Fetch and persist one snapshot row per tracked FX pair. Returns count stored."""
    stored = 0
    try:
        quotes = forex_service.get_fx_quotes(get_tracked_fx_currencies(db))
    except Exception as exc:  # noqa: BLE001 - Open Exchange Rates outage shouldn't stop the batch
        logger.warning("FX snapshot batch skipped: %s", exc)
        return 0

    for quote in quotes:
        fx_rate = db.execute(
            select(FxRate).where(
                FxRate.base_currency == quote.base_currency,
                FxRate.quote_currency == quote.quote_currency,
            )
        ).scalar_one_or_none()
        if fx_rate is None:
            fx_rate = FxRate(base_currency=quote.base_currency, quote_currency=quote.quote_currency)
            db.add(fx_rate)
            db.flush()

        db.add(
            FxSnapshot(
                fx_rate_id=fx_rate.id,
                timestamp=datetime.utcnow(),
                rate=quote.rate,
                source="open_exchange_rates",
            )
        )
        stored += 1
    return stored


def run_snapshot_job(triggered_by: str = "schedule") -> SchedulerRun:
    """Fetch and store the latest stock, crypto, and FX snapshots in a single DB session.

    Always writes a `SchedulerRun` row (success or failure) so the admin dashboard has a
    complete run history, then returns it.
    """
    db = SessionLocal()
    started_at = datetime.utcnow()
    try:
        stock_count = _snapshot_stocks(db)
        crypto_count = _snapshot_crypto(db)
        fx_count = _snapshot_fx(db)
        run = SchedulerRun(
            started_at=started_at,
            finished_at=datetime.utcnow(),
            stocks_stored=stock_count,
            crypto_stored=crypto_count,
            fx_stored=fx_count,
            success=True,
            triggered_by=triggered_by,
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        logger.info(
            "Snapshot job complete: %d stocks, %d crypto, %d fx pairs stored",
            stock_count,
            crypto_count,
            fx_count,
        )
        return run
    except Exception as exc:
        db.rollback()
        logger.exception("Snapshot job failed and was rolled back")
        run = SchedulerRun(
            started_at=started_at,
            finished_at=datetime.utcnow(),
            success=False,
            error_message=str(exc)[:1000],
            triggered_by=triggered_by,
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return run
    finally:
        db.close()


def create_scheduler() -> BackgroundScheduler:
    """Build a BackgroundScheduler wired with the periodic snapshot job.

    Seeds reference data synchronously first so the very first snapshot has
    stock/crypto/fx rows to attach to, then runs the job immediately and on
    the configured interval thereafter.
    """
    settings = get_settings()

    with SessionLocal() as session:
        seed_reference_data(session)

    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        run_snapshot_job,
        "interval",
        minutes=settings.snapshot_interval_minutes,
        id="market_data_snapshot",
        next_run_time=datetime.utcnow(),
        max_instances=1,
        coalesce=True,
    )
    return scheduler
