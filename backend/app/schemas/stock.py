"""Response schemas for the /stocks endpoints."""
from pydantic import BaseModel, ConfigDict

from app.schemas.common import PricePoint


class StockQuote(BaseModel):
    """Live/latest quote for a single ASX stock, including trend deltas and a sparkline."""

    model_config = ConfigDict(from_attributes=True)

    ticker: str
    name: str
    exchange: str = "ASX"
    currency: str = "AUD"
    price: float
    day_change: float
    day_change_pct: float
    week_change_pct: float | None = None
    month_change_pct: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    volume: int | None = None
    sparkline: list[PricePoint] = []
    updated_at: str


class StockListResponse(BaseModel):
    """Wrapper for a collection of stock quotes."""

    items: list[StockQuote]
    count: int


class StockHistoryResponse(BaseModel):
    """Historical price series for a single ticker over a requested range."""

    ticker: str
    range: str
    points: list[PricePoint]
