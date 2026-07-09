"""Endpoints for AUD foreign exchange rates and historical rates."""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import ChartRange
from app.schemas.fx import FxHistoryResponse, FxListResponse, FxQuote
from app.services import forex_service
from app.services.forex_service import FxPairNotFoundError, UpstreamAPIError
from app.services.tracked_assets_service import get_tracked_fx_currencies

router = APIRouter(prefix="/fx", tags=["fx"])


@router.get("", response_model=FxListResponse)
def list_fx(db: Session = Depends(get_db)) -> FxListResponse:
    """Return live AUD-based rates for the tracked watchlist of currency pairs."""
    try:
        quotes = forex_service.get_fx_quotes(get_tracked_fx_currencies(db))
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return FxListResponse(items=quotes, count=len(quotes))


@router.get("/{quote_currency}", response_model=FxQuote)
def get_fx(quote_currency: str = Path(..., description="Quote currency code, e.g. USD")) -> FxQuote:
    """Return the live AUD-based rate for a single currency."""
    try:
        return forex_service.get_fx_quote(quote_currency.upper())
    except FxPairNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{quote_currency}/history", response_model=FxHistoryResponse)
def get_fx_history(
    quote_currency: str = Path(..., description="Quote currency code, e.g. USD"),
    range: ChartRange = ChartRange.ONE_MONTH,
) -> FxHistoryResponse:
    """Return a historical AUD-based rate series over the requested range."""
    try:
        return forex_service.get_fx_history(quote_currency.upper(), range.value)
    except FxPairNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
