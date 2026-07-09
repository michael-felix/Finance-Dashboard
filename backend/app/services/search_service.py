"""Unified search across ASX tickers, cryptocurrencies, and FX pairs for the search bar.

Stocks and crypto hit live upstream search APIs (Yahoo Finance, CoinGecko); FX pairs are
matched against a static list of common currencies since there is no meaningful "search"
for a fixed set of ~20 currency codes.
"""
import requests
import yfinance as yf
from tenacity import retry, stop_after_attempt, wait_exponential

from app.schemas.search import SearchResult
from app.utils.cache import market_data_cache
from app.utils.logger import get_logger

logger = get_logger(__name__)

COINGECKO_SEARCH_URL = "https://api.coingecko.com/api/v3/search"

MAX_RESULTS_PER_TYPE = 6

# Common currencies traded against AUD. Code -> display name.
_FX_CURRENCIES: dict[str, str] = {
    "USD": "US Dollar",
    "EUR": "Euro",
    "JPY": "Japanese Yen",
    "GBP": "British Pound",
    "NZD": "New Zealand Dollar",
    "CNY": "Chinese Yuan",
    "SGD": "Singapore Dollar",
    "HKD": "Hong Kong Dollar",
    "CHF": "Swiss Franc",
    "CAD": "Canadian Dollar",
    "INR": "Indian Rupee",
    "THB": "Thai Baht",
    "ZAR": "South African Rand",
    "KRW": "South Korean Won",
    "IDR": "Indonesian Rupiah",
}


def search_stocks(query: str) -> list[SearchResult]:
    """Search Yahoo Finance for ASX-listed equities matching the query."""

    def _build() -> list[SearchResult]:
        try:
            results = yf.Search(query, max_results=15).quotes
        except Exception as exc:  # noqa: BLE001 - search is best-effort, never fatal
            logger.warning("Stock search failed for '%s': %s", query, exc)
            return []

        matches = [
            SearchResult(
                type="stock",
                symbol=r["symbol"],
                name=r.get("longname") or r.get("shortname") or r["symbol"],
                subtitle=r.get("exchDisp"),
            )
            for r in results
            if r.get("exchange") == "ASX" and r.get("quoteType") == "EQUITY"
        ]
        return matches[:MAX_RESULTS_PER_TYPE]

    return market_data_cache.get_or_set(f"search_stock:{query.lower()}", _build, ttl_seconds=3600)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=2), reraise=True)
def _coingecko_search(query: str) -> dict:
    response = requests.get(COINGECKO_SEARCH_URL, params={"query": query}, timeout=10)
    response.raise_for_status()
    return response.json()


def search_crypto(query: str) -> list[SearchResult]:
    """Search CoinGecko for cryptocurrencies matching the query."""

    def _build() -> list[SearchResult]:
        try:
            data = _coingecko_search(query)
        except requests.RequestException as exc:
            logger.warning("Crypto search failed for '%s': %s", query, exc)
            return []

        coins = data.get("coins", [])[:MAX_RESULTS_PER_TYPE]
        return [
            SearchResult(type="crypto", symbol=coin["symbol"].upper(), name=coin["name"], subtitle=coin["id"])
            for coin in coins
        ]

    return market_data_cache.get_or_set(f"search_crypto:{query.lower()}", _build, ttl_seconds=3600)


def search_fx(query: str) -> list[SearchResult]:
    """Match the query against the static list of AUD-quotable currencies."""
    q = query.strip().upper()
    matches = [
        SearchResult(type="fx", symbol=code, name=name, subtitle=f"AUD/{code}")
        for code, name in _FX_CURRENCIES.items()
        if q in code or q.lower() in name.lower()
    ]
    return matches[:MAX_RESULTS_PER_TYPE]


def search_all(query: str) -> list[SearchResult]:
    """Search stocks, crypto, and FX in parallel-ish sequence and combine the results."""
    if not query or len(query.strip()) < 1:
        return []
    return [*search_stocks(query), *search_fx(query), *search_crypto(query)]
