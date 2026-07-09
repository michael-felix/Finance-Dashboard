"""Response schema for the unified /search endpoint."""
from typing import Literal

from pydantic import BaseModel

AssetType = Literal["stock", "crypto", "fx"]


class SearchResult(BaseModel):
    """A single searchable asset, usable directly as a watchlist entry on the frontend."""

    type: AssetType
    symbol: str
    name: str
    subtitle: str | None = None


class SearchResponse(BaseModel):
    items: list[SearchResult]
