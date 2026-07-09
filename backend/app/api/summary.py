"""Endpoint for the aggregated market summary banner."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.summary import MarketSummary
from app.services.summary_service import build_market_summary

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("", response_model=MarketSummary)
def get_summary(db: Session = Depends(get_db)) -> MarketSummary:
    """Return the strongest/weakest ASX movers, crypto direction, and AUD strength indicator."""
    return build_market_summary(db)
