"""Unit tests for app.services.yahoo_service, with yfinance mocked out."""
import pandas as pd
import pytest

from app.services import yahoo_service
from tests.conftest import make_price_history


def test_get_stock_quote_computes_deltas(mocker):
    history = make_price_history([100.0, 101.0, 99.0, 102.0, 103.0, 104.0, 105.0])
    mocker.patch("app.services.yahoo_service._fetch_ticker_history", return_value=history)
    mocker.patch(
        "app.services.yahoo_service.yf.Ticker",
        return_value=mocker.Mock(fast_info={"dayHigh": 106.0, "dayLow": 104.0, "lastVolume": 5000}),
    )

    quote = yahoo_service.get_stock_quote("CBA.AX", company_name="Commonwealth Bank")

    assert quote.ticker == "CBA.AX"
    assert quote.name == "Commonwealth Bank"
    assert quote.price == 105.0
    assert quote.day_change == pytest.approx(1.0)
    assert quote.day_high == 106.0
    assert quote.day_low == 104.0
    assert quote.volume == 5000
    assert len(quote.sparkline) == 7


def test_get_stock_quote_raises_not_found_for_empty_history(mocker):
    mocker.patch("app.services.yahoo_service._fetch_ticker_history", return_value=pd.DataFrame())

    with pytest.raises(yahoo_service.StockNotFoundError):
        yahoo_service.get_stock_quote("NOTREAL.AX")


def test_get_stock_quote_wraps_upstream_failures(mocker):
    mocker.patch(
        "app.services.yahoo_service._fetch_ticker_history",
        side_effect=RuntimeError("network down"),
    )

    with pytest.raises(yahoo_service.UpstreamAPIError):
        yahoo_service.get_stock_quote("CBA.AX")


def test_get_stock_history_returns_points(mocker):
    history = make_price_history([10.0, 11.0, 12.0])
    mocker.patch("app.services.yahoo_service._fetch_ticker_history", return_value=history)

    result = yahoo_service.get_stock_history("CBA.AX", "1M")

    assert result.ticker == "CBA.AX"
    assert result.range == "1M"
    assert [p.value for p in result.points] == [10.0, 11.0, 12.0]


def test_get_stock_history_rejects_unsupported_range():
    with pytest.raises(ValueError):
        yahoo_service.get_stock_history("CBA.AX", "5Y")


def test_get_stock_quote_is_cached(mocker):
    history = make_price_history([1.0, 2.0])
    fetch = mocker.patch("app.services.yahoo_service._fetch_ticker_history", return_value=history)
    mocker.patch(
        "app.services.yahoo_service.yf.Ticker",
        return_value=mocker.Mock(fast_info={}),
    )

    yahoo_service.get_stock_quote("CBA.AX")
    yahoo_service.get_stock_quote("CBA.AX")

    assert fetch.call_count == 1
