"""Endpoint for querying stored historical price snapshots directly from PostgreSQL.

This complements /stocks/{ticker}/history (which always calls Yahoo Finance live) by
serving from the snapshots the scheduler has already persisted -- useful once enough
history has accumulated to avoid repeated upstream calls.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.stock import Stock, StockSnapshot
from app.schemas.common import ChartRange, PricePoint
from app.schemas.stock import StockHistoryResponse

router = APIRouter(prefix="/prices", tags=["prices"])

_RANGE_TO_TIMEDELTA: dict[str, timedelta] = {
    "1D": timedelta(days=1),
    "1W": timedelta(weeks=1),
    "1M": timedelta(days=30),
    "3M": timedelta(days=90),
}


@router.get("/{ticker}", response_model=StockHistoryResponse)
def get_stored_prices(
    ticker: str,
    range: ChartRange = Query(default=ChartRange.ONE_MONTH),
    db: Session = Depends(get_db),
) -> StockHistoryResponse:
    """Return stored historical snapshots for a ticker from the database."""
    stock = db.execute(select(Stock).where(Stock.ticker == ticker.upper())).scalar_one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail=f"No stored data for ticker '{ticker}'")

    since = datetime.utcnow() - _RANGE_TO_TIMEDELTA[range.value]
    snapshots = db.execute(
        select(StockSnapshot)
        .where(StockSnapshot.stock_id == stock.id, StockSnapshot.timestamp >= since)
        .order_by(StockSnapshot.timestamp)
    ).scalars().all()

    points = [PricePoint(timestamp=s.timestamp.isoformat(), value=s.price) for s in snapshots]
    return StockHistoryResponse(ticker=stock.ticker, range=range.value, points=points)
