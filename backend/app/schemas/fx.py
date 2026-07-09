"""Response schemas for the /fx endpoints."""
from pydantic import BaseModel, ConfigDict

from app.schemas.common import PricePoint


class FxQuote(BaseModel):
    """Live/latest exchange rate for an AUD-quoted currency pair."""

    model_config = ConfigDict(from_attributes=True)

    base_currency: str = "AUD"
    quote_currency: str
    pair: str
    rate: float
    day_change_pct: float | None = None
    week_change_pct: float | None = None
    sparkline: list[PricePoint] = []
    updated_at: str


class FxListResponse(BaseModel):
    """Wrapper for a collection of FX quotes."""

    items: list[FxQuote]
    count: int


class FxHistoryResponse(BaseModel):
    """Historical rate series for a single pair over a requested range."""

    pair: str
    range: str
    points: list[PricePoint]
