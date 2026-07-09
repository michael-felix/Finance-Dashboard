"""Endpoint powering the dashboard search bar's autocomplete suggestions."""
from fastapi import APIRouter, Query

from app.schemas.search import SearchResponse
from app.services.search_service import search_all

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, description="Search query across stocks, crypto, and FX"),
) -> SearchResponse:
    """Search ASX tickers, cryptocurrencies, and FX currencies matching the query."""
    return SearchResponse(items=search_all(q))
