"""Unit tests for app.services.forex_service, particularly the USD->AUD cross-rate math."""

from datetime import datetime, timedelta

import pytest
import requests

from app.database.session import SessionLocal
from app.models.fx import FxRate, FxSnapshot
from app.schemas.fx import FxQuote
from app.services import forex_service


def test_get_fx_quotes_derives_aud_cross_rates(mocker):
    # USD-based rates from Open Exchange Rates' free tier.
    mocker.patch(
        "app.services.forex_service._fetch_usd_rates",
        return_value={"AUD": 1.5, "EUR": 0.9, "JPY": 150.0},
    )

    quotes = forex_service.get_fx_quotes(["EUR", "JPY"])

    by_currency = {q.quote_currency: q for q in quotes}
    # rate(AUD->EUR) = rate(USD->EUR) / rate(USD->AUD) = 0.9 / 1.5 = 0.6
    assert by_currency["EUR"].rate == pytest.approx(0.6)
    # rate(AUD->JPY) = 150.0 / 1.5 = 100.0
    assert by_currency["JPY"].rate == pytest.approx(100.0)
    assert by_currency["EUR"].pair == "AUD/EUR"


def test_get_fx_quotes_skips_unknown_currency(mocker):
    mocker.patch(
        "app.services.forex_service._fetch_usd_rates",
        return_value={"AUD": 1.5, "EUR": 0.9},
    )

    quotes = forex_service.get_fx_quotes(["EUR", "XYZ"])

    assert len(quotes) == 1
    assert quotes[0].quote_currency == "EUR"


def test_get_fx_quote_raises_when_currency_missing(mocker):
    mocker.patch(
        "app.services.forex_service._fetch_usd_rates",
        return_value={"AUD": 1.5},
    )

    with pytest.raises(forex_service.FxPairNotFoundError):
        forex_service.get_fx_quote("EUR")


def test_fetch_usd_rates_raises_upstream_error_on_failure(mocker):
    mocker.patch(
        "app.services.forex_service._get",
        side_effect=requests.RequestException("rate limited"),
    )

    with pytest.raises(forex_service.UpstreamAPIError):
        forex_service._fetch_usd_rates()


def test_aud_cross_rates_raises_when_aud_missing(mocker):
    mocker.patch("app.services.forex_service._fetch_usd_rates", return_value={"EUR": 0.9})

    with pytest.raises(forex_service.UpstreamAPIError):
        forex_service._aud_cross_rates()


def _make_quote(rate: float, currency: str = "USD") -> FxQuote:
    return FxQuote(
        quote_currency=currency, pair=f"AUD/{currency}", rate=rate, updated_at="2026-01-01T00:00:00+00:00"
    )


def test_enrich_fx_quotes_leaves_quote_unchanged_without_tracked_pair():
    with SessionLocal() as db:
        quote = _make_quote(0.65)
        enriched = forex_service.enrich_fx_quotes([quote], db)
        assert enriched[0].day_change_pct is None
        assert enriched[0].sparkline == []


def test_enrich_fx_quotes_computes_day_change_from_stored_snapshots():
    with SessionLocal() as db:
        fx_rate = FxRate(base_currency="AUD", quote_currency="USD")
        db.add(fx_rate)
        db.flush()

        old = FxSnapshot(fx_rate_id=fx_rate.id, timestamp=datetime.utcnow() - timedelta(hours=25), rate=0.60)
        recent = FxSnapshot(
            fx_rate_id=fx_rate.id, timestamp=datetime.utcnow() - timedelta(hours=1), rate=0.63
        )
        db.add_all([old, recent])
        db.commit()

        quote = _make_quote(0.66)
        enriched = forex_service.enrich_fx_quotes([quote], db)[0]

        # baseline is the oldest snapshot still within the last 24h ("recent", rate 0.63)
        assert enriched.day_change_pct == pytest.approx((0.66 - 0.63) / 0.63 * 100, rel=1e-3)
        assert len(enriched.sparkline) == 2
