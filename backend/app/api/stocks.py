"""Endpoints for ASX stock quotes and historical prices."""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import ChartRange
from app.schemas.stock import StockHistoryResponse, StockListResponse, StockQuote
from app.services import yahoo_service
from app.services.tracked_assets_service import get_tracked_stocks
from app.services.yahoo_service import StockNotFoundError, UpstreamAPIError
from app.utils.constants import STOCK_NAMES
from app.utils.logger import get_logger

router = APIRouter(prefix="/stocks", tags=["stocks"])
logger = get_logger(__name__)


@router.get("", response_model=StockListResponse)
def list_stocks(db: Session = Depends(get_db)) -> StockListResponse:
    """Return live quotes for the tracked watchlist of ASX stocks."""
    quotes: list[StockQuote] = []
    for ticker, name in get_tracked_stocks(db):
        try:
            quotes.append(yahoo_service.get_stock_quote(ticker, company_name=name))
        except (StockNotFoundError, UpstreamAPIError) as exc:
            logger.warning("Skipping %s: %s", ticker, exc)
    return StockListResponse(items=quotes, count=len(quotes))


@router.get("/{ticker}", response_model=StockQuote)
def get_stock(ticker: str = Path(..., description="ASX ticker, e.g. CBA.AX")) -> StockQuote:
    """Return the live quote for a single ASX ticker."""
    ticker = ticker.upper()
    try:
        return yahoo_service.get_stock_quote(ticker, company_name=STOCK_NAMES.get(ticker))
    except StockNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{ticker}/history", response_model=StockHistoryResponse)
def get_stock_history(
    ticker: str = Path(..., description="ASX ticker, e.g. CBA.AX"),
    range: ChartRange = ChartRange.ONE_MONTH,
) -> StockHistoryResponse:
    """Return a historical close-price series for a ticker over the requested range."""
    try:
        return yahoo_service.get_stock_history(ticker.upper(), range.value)
    except StockNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
