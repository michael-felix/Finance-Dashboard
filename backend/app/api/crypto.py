"""Endpoints for cryptocurrency quotes and historical prices."""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import ChartRange
from app.schemas.crypto import CryptoHistoryResponse, CryptoListResponse, CryptoQuote
from app.services import coingecko_service
from app.services.coingecko_service import CoinNotFoundError, UpstreamAPIError
from app.services.tracked_assets_service import get_tracked_crypto_ids
from app.utils.logger import get_logger

router = APIRouter(prefix="/crypto", tags=["crypto"])
logger = get_logger(__name__)


@router.get("", response_model=CryptoListResponse)
def list_crypto(db: Session = Depends(get_db)) -> CryptoListResponse:
    """Return live quotes for the tracked watchlist of cryptocurrencies."""
    try:
        quotes = coingecko_service.get_crypto_quotes(get_tracked_crypto_ids(db))
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return CryptoListResponse(items=quotes, count=len(quotes))


@router.get("/{coin_id}", response_model=CryptoQuote)
def get_crypto(coin_id: str = Path(..., description="CoinGecko coin id, e.g. bitcoin")) -> CryptoQuote:
    """Return the live quote for a single cryptocurrency."""
    try:
        return coingecko_service.get_crypto_quote(coin_id.lower())
    except CoinNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{coin_id}/history", response_model=CryptoHistoryResponse)
def get_crypto_history(
    coin_id: str = Path(..., description="CoinGecko coin id, e.g. bitcoin"),
    range: ChartRange = ChartRange.ONE_MONTH,
) -> CryptoHistoryResponse:
    """Return a historical AUD price series for a coin over the requested range."""
    try:
        return coingecko_service.get_crypto_history(coin_id.lower(), range.value)
    except CoinNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UpstreamAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
