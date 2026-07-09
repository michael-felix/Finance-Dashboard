"""Unit tests for app.services.search_service."""
from app.services import search_service


def test_search_stocks_filters_to_asx_equities(mocker):
    mocker.patch.object(
        search_service.yf,
        "Search",
        return_value=mocker.Mock(
            quotes=[
                {
                    "symbol": "CBA.AX",
                    "exchange": "ASX",
                    "quoteType": "EQUITY",
                    "longname": "Commonwealth Bank",
                },
                {"symbol": "CBA.NZ", "exchange": "NZE", "quoteType": "EQUITY", "longname": "Wrong exchange"},
                {"symbol": "CBAOPT", "exchange": "ASX", "quoteType": "OPTION", "longname": "Wrong type"},
            ]
        ),
    )

    results = search_service.search_stocks("commonwealth")

    assert len(results) == 1
    assert results[0].symbol == "CBA.AX"
    assert results[0].type == "stock"


def test_search_crypto_maps_coingecko_response(mocker):
    mocker.patch.object(
        search_service,
        "_coingecko_search",
        return_value={"coins": [{"id": "solana", "symbol": "sol", "name": "Solana"}]},
    )

    results = search_service.search_crypto("sol")

    assert results[0].type == "crypto"
    assert results[0].symbol == "SOL"
    assert results[0].subtitle == "solana"


def test_search_fx_matches_code_and_name():
    by_code = search_service.search_fx("usd")
    by_name = search_service.search_fx("yen")

    assert any(r.symbol == "USD" for r in by_code)
    assert any(r.symbol == "JPY" for r in by_name)


def test_search_all_combines_types(mocker):
    mocker.patch.object(search_service, "search_stocks", return_value=[])
    mocker.patch.object(search_service, "search_crypto", return_value=[])

    results = search_service.search_all("usd")

    assert any(r.type == "fx" for r in results)


def test_search_all_returns_empty_for_blank_query():
    assert search_service.search_all("   ") == []
