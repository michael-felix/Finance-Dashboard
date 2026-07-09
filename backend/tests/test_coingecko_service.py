"""Unit tests for app.services.coingecko_service, with HTTP calls mocked out."""
import pytest
import requests

from app.services import coingecko_service


def _mock_response(mocker, json_data, status_ok=True):
    response = mocker.Mock()
    response.json.return_value = json_data
    if status_ok:
        response.raise_for_status.return_value = None
    else:
        response.raise_for_status.side_effect = requests.HTTPError("boom")
    return response


def test_get_crypto_quotes_maps_fields(mocker):
    payload = [
        {
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "current_price": 90000.0,
            "market_cap": 1_800_000_000_000,
            "total_volume": 40_000_000_000,
            "price_change_percentage_24h_in_currency": -1.5,
            "price_change_percentage_7d_in_currency": 3.2,
            "sparkline_in_7d": {"price": [100.0, 101.0, 99.0]},
        }
    ]
    mocker.patch("app.services.coingecko_service._get", return_value=payload)

    quotes = coingecko_service.get_crypto_quotes(["bitcoin"])

    assert len(quotes) == 1
    quote = quotes[0]
    assert quote.id == "bitcoin"
    assert quote.symbol == "BTC"
    assert quote.price_aud == 90000.0
    assert quote.change_24h_pct == -1.5
    assert quote.change_7d_pct == 3.2
    assert len(quote.sparkline) == 3


def test_get_crypto_quote_raises_not_found_when_missing(mocker):
    mocker.patch("app.services.coingecko_service._get", return_value=[])

    with pytest.raises(coingecko_service.CoinNotFoundError):
        coingecko_service.get_crypto_quote("not-a-real-coin")


def test_get_crypto_history_converts_timestamps(mocker):
    mocker.patch(
        "app.services.coingecko_service._get",
        return_value={"prices": [[1717200000000, 100.0], [1717286400000, 102.0]]},
    )

    result = coingecko_service.get_crypto_history("bitcoin", "1M")

    assert result.id == "bitcoin"
    assert len(result.points) == 2
    assert result.points[0].value == 100.0


def test_get_crypto_history_rejects_unsupported_range():
    with pytest.raises(ValueError):
        coingecko_service.get_crypto_history("bitcoin", "5Y")


def test_upstream_error_propagates_as_domain_exception(mocker):
    mocker.patch(
        "app.services.coingecko_service._get",
        side_effect=requests.RequestException("network down"),
    )

    with pytest.raises(coingecko_service.UpstreamAPIError):
        coingecko_service.get_crypto_quotes(["bitcoin"])
