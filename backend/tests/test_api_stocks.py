"""Integration tests for the /stocks endpoints, with the Yahoo Finance service mocked out."""
from datetime import UTC, datetime

from app.schemas.stock import StockQuote
from app.services import yahoo_service


def _fake_quote(ticker: str) -> StockQuote:
    return StockQuote(
        ticker=ticker,
        name="Test Co",
        price=100.0,
        day_change=1.0,
        day_change_pct=1.0,
        week_change_pct=2.0,
        month_change_pct=3.0,
        day_high=101.0,
        day_low=99.0,
        volume=1000,
        sparkline=[],
        updated_at=datetime.now(UTC).isoformat(),
    )


def test_get_stock_returns_quote(client, mocker):
    mocker.patch.object(yahoo_service, "get_stock_quote", return_value=_fake_quote("CBA.AX"))

    response = client.get("/stocks/CBA.AX")

    assert response.status_code == 200
    body = response.json()
    assert body["ticker"] == "CBA.AX"
    assert body["price"] == 100.0


def test_get_stock_returns_404_when_not_found(client, mocker):
    mocker.patch.object(
        yahoo_service, "get_stock_quote", side_effect=yahoo_service.StockNotFoundError("nope")
    )

    response = client.get("/stocks/NOTREAL.AX")

    assert response.status_code == 404


def test_get_stock_returns_502_on_upstream_failure(client, mocker):
    mocker.patch.object(
        yahoo_service, "get_stock_quote", side_effect=yahoo_service.UpstreamAPIError("down")
    )

    response = client.get("/stocks/CBA.AX")

    assert response.status_code == 502


def test_list_stocks_skips_failed_tickers(client, mocker):
    def fake_get_quote(ticker, company_name=None):
        if ticker == "BHP.AX":
            raise yahoo_service.StockNotFoundError("nope")
        return _fake_quote(ticker)

    mocker.patch.object(yahoo_service, "get_stock_quote", side_effect=fake_get_quote)

    response = client.get("/stocks")

    assert response.status_code == 200
    tickers = [item["ticker"] for item in response.json()["items"]]
    assert "BHP.AX" not in tickers
    assert "CBA.AX" in tickers
