"""Tests for the snapshot pipeline: verifies rows are actually persisted, and that a
failure in one asset class doesn't prevent the others from being stored.
"""
from datetime import UTC, datetime

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.crypto import Crypto, CryptoSnapshot
from app.models.fx import FxRate, FxSnapshot
from app.models.stock import Stock, StockSnapshot
from app.scheduler import jobs
from app.schemas.crypto import CryptoQuote
from app.schemas.fx import FxQuote
from app.schemas.stock import StockQuote
from app.services import coingecko_service, forex_service, yahoo_service


def _fake_stock_quote(ticker: str) -> StockQuote:
    return StockQuote(
        ticker=ticker,
        name="Test Co",
        price=10.0,
        day_change=0.1,
        day_change_pct=1.0,
        day_high=10.5,
        day_low=9.5,
        volume=100,
        sparkline=[],
        updated_at=datetime.now(UTC).isoformat(),
    )


def test_run_snapshot_job_persists_all_asset_classes(mocker):
    mocker.patch.object(yahoo_service, "get_stock_quote", return_value=_fake_stock_quote("CBA.AX"))
    mocker.patch.object(
        coingecko_service,
        "get_crypto_quotes",
        return_value=[
            CryptoQuote(
                id="bitcoin",
                symbol="BTC",
                name="Bitcoin",
                price_aud=90000.0,
                updated_at=datetime.now(UTC).isoformat(),
            )
        ],
    )
    mocker.patch.object(
        forex_service,
        "get_fx_quotes",
        return_value=[
            FxQuote(quote_currency="USD", pair="AUD/USD", rate=0.65, updated_at=datetime.now(UTC).isoformat())
        ],
    )

    jobs.run_snapshot_job()

    with SessionLocal() as db:
        stock = db.execute(select(Stock).where(Stock.ticker == "CBA.AX")).scalar_one()
        assert db.execute(select(StockSnapshot).where(StockSnapshot.stock_id == stock.id)).scalar_one()

        crypto = db.execute(select(Crypto).where(Crypto.coingecko_id == "bitcoin")).scalar_one()
        assert db.execute(select(CryptoSnapshot).where(CryptoSnapshot.crypto_id == crypto.id)).scalar_one()

        fx = db.execute(
            select(FxRate).where(FxRate.base_currency == "AUD", FxRate.quote_currency == "USD")
        ).scalar_one()
        assert db.execute(select(FxSnapshot).where(FxSnapshot.fx_rate_id == fx.id)).scalar_one()


def test_run_snapshot_job_isolates_fx_failure(mocker):
    """A broken FX provider must not stop stock/crypto snapshots from being stored."""
    mocker.patch.object(yahoo_service, "get_stock_quote", return_value=_fake_stock_quote("BHP.AX"))
    mocker.patch.object(coingecko_service, "get_crypto_quotes", return_value=[])
    mocker.patch.object(forex_service, "get_fx_quotes", side_effect=RuntimeError("provider down"))

    jobs.run_snapshot_job()

    with SessionLocal() as db:
        stock = db.execute(select(Stock).where(Stock.ticker == "BHP.AX")).scalar_one()
        assert db.execute(select(StockSnapshot).where(StockSnapshot.stock_id == stock.id)).scalar_one()
