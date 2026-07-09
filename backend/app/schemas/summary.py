"""Response schema for the /summary market overview endpoint."""
from pydantic import BaseModel


class TopMover(BaseModel):
    """A single asset highlighted as a top gainer/loser."""

    symbol: str
    name: str
    change_pct: float
    price: float


class MarketSummary(BaseModel):
    """Aggregated market-wide summary shown in the dashboard banner."""

    strongest_stock: TopMover | None = None
    weakest_stock: TopMover | None = None
    crypto_market_direction: str  # "bullish" | "bearish" | "neutral"
    crypto_average_change_pct: float
    aud_strength_indicator: str  # "strengthening" | "weakening" | "stable"
    aud_average_change_pct: float
    generated_at: str
