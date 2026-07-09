"""Response schemas for the /crypto endpoints."""
from pydantic import BaseModel, ConfigDict

from app.schemas.common import PricePoint


class CryptoQuote(BaseModel):
    """Live/latest quote for a single cryptocurrency, priced in AUD."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    symbol: str
    name: str
    price_aud: float
    market_cap_aud: float | None = None
    volume_24h_aud: float | None = None
    change_24h_pct: float | None = None
    change_7d_pct: float | None = None
    sparkline: list[PricePoint] = []
    updated_at: str


class CryptoListResponse(BaseModel):
    """Wrapper for a collection of crypto quotes."""

    items: list[CryptoQuote]
    count: int


class CryptoHistoryResponse(BaseModel):
    """Historical price series for a single coin over a requested range."""

    id: str
    range: str
    points: list[PricePoint]
