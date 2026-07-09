"""Unit tests for app.services.forex_service, particularly the USD->AUD cross-rate math."""
import pytest
import requests

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
