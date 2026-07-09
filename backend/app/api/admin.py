"""Admin-only endpoints: manage tracked assets, manage users, and scheduler job health.

Every route except `/admin/me` requires `require_admin` — an authenticated user whose
`UserProfile.is_admin` flag is set (see app/api/deps.py for how that flag is assigned).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models.crypto import Crypto
from app.models.fx import FxRate
from app.models.scheduler_run import SchedulerRun
from app.models.stock import Stock
from app.models.user import UserProfile
from app.scheduler.jobs import run_snapshot_job
from app.schemas.admin import (
    AddCryptoRequest,
    AddFxRequest,
    AddStockRequest,
    TrackedAssetsResponse,
    TrackedCrypto,
    TrackedFx,
    TrackedStock,
)
from app.schemas.job import SchedulerRunListResponse, SchedulerRunOut
from app.schemas.user import UserListResponse, UserProfileOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/me", response_model=UserProfileOut)
def get_me(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """Return the current authenticated user's profile, including their admin flag."""
    return user


# --- Tracked assets -----------------------------------------------------------------


@router.get("/assets", response_model=TrackedAssetsResponse)
def list_tracked_assets(
    db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> TrackedAssetsResponse:
    stocks = db.execute(select(Stock)).scalars().all()
    crypto = db.execute(select(Crypto)).scalars().all()
    fx = db.execute(select(FxRate).where(FxRate.base_currency == "AUD")).scalars().all()
    return TrackedAssetsResponse(
        stocks=[TrackedStock(ticker=s.ticker, name=s.name) for s in stocks],
        crypto=[TrackedCrypto(coingecko_id=c.coingecko_id, symbol=c.symbol, name=c.name) for c in crypto],
        fx=[TrackedFx(quote_currency=f.quote_currency) for f in fx],
    )


@router.post("/assets/stocks", response_model=TrackedStock, status_code=201)
def add_tracked_stock(
    body: AddStockRequest, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> TrackedStock:
    ticker = body.ticker.strip().upper()
    existing = db.execute(select(Stock).where(Stock.ticker == ticker)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"'{ticker}' is already tracked")
    stock = Stock(ticker=ticker, name=body.name.strip())
    db.add(stock)
    db.commit()
    return TrackedStock(ticker=stock.ticker, name=stock.name)


@router.delete("/assets/stocks/{ticker}", status_code=204)
def remove_tracked_stock(
    ticker: str, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> None:
    stock = db.execute(select(Stock).where(Stock.ticker == ticker.upper())).scalar_one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail=f"'{ticker}' is not tracked")
    db.delete(stock)
    db.commit()


@router.post("/assets/crypto", response_model=TrackedCrypto, status_code=201)
def add_tracked_crypto(
    body: AddCryptoRequest, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> TrackedCrypto:
    coingecko_id = body.coingecko_id.strip().lower()
    existing = db.execute(
        select(Crypto).where(Crypto.coingecko_id == coingecko_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"'{coingecko_id}' is already tracked")
    crypto = Crypto(coingecko_id=coingecko_id, symbol=body.symbol.strip().upper(), name=body.name.strip())
    db.add(crypto)
    db.commit()
    return TrackedCrypto(coingecko_id=crypto.coingecko_id, symbol=crypto.symbol, name=crypto.name)


@router.delete("/assets/crypto/{coingecko_id}", status_code=204)
def remove_tracked_crypto(
    coingecko_id: str, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> None:
    crypto = db.execute(
        select(Crypto).where(Crypto.coingecko_id == coingecko_id.lower())
    ).scalar_one_or_none()
    if crypto is None:
        raise HTTPException(status_code=404, detail=f"'{coingecko_id}' is not tracked")
    db.delete(crypto)
    db.commit()


@router.post("/assets/fx", response_model=TrackedFx, status_code=201)
def add_tracked_fx(
    body: AddFxRequest, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> TrackedFx:
    currency = body.quote_currency.strip().upper()
    existing = db.execute(
        select(FxRate).where(FxRate.base_currency == "AUD", FxRate.quote_currency == currency)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"AUD/{currency} is already tracked")
    fx = FxRate(base_currency="AUD", quote_currency=currency)
    db.add(fx)
    db.commit()
    return TrackedFx(quote_currency=fx.quote_currency)


@router.delete("/assets/fx/{quote_currency}", status_code=204)
def remove_tracked_fx(
    quote_currency: str, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> None:
    fx = db.execute(
        select(FxRate).where(
            FxRate.base_currency == "AUD", FxRate.quote_currency == quote_currency.upper()
        )
    ).scalar_one_or_none()
    if fx is None:
        raise HTTPException(status_code=404, detail=f"AUD/{quote_currency} is not tracked")
    db.delete(fx)
    db.commit()


# --- Users ---------------------------------------------------------------------------


@router.get("/users", response_model=UserListResponse)
def list_users(
    db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> UserListResponse:
    users = db.execute(select(UserProfile).order_by(UserProfile.created_at)).scalars().all()
    return UserListResponse(items=list(users))


@router.post("/users/{user_id}/promote", response_model=UserProfileOut)
def promote_user(
    user_id: int, db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> UserProfile:
    user = db.get(UserProfile, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/demote", response_model=UserProfileOut)
def demote_user(
    user_id: int, db: Session = Depends(get_db), admin: UserProfile = Depends(require_admin)
) -> UserProfile:
    user = db.get(UserProfile, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    user.is_admin = False
    db.commit()
    db.refresh(user)
    return user


# --- Scheduler / job health ------------------------------------------------------------


@router.get("/jobs", response_model=SchedulerRunListResponse)
def list_job_runs(
    db: Session = Depends(get_db), _admin: UserProfile = Depends(require_admin)
) -> SchedulerRunListResponse:
    runs = db.execute(
        select(SchedulerRun).order_by(SchedulerRun.started_at.desc()).limit(50)
    ).scalars().all()
    return SchedulerRunListResponse(items=list(runs))


@router.post("/jobs/run-now", response_model=SchedulerRunOut)
def trigger_job_run(_admin: UserProfile = Depends(require_admin)) -> SchedulerRun:
    return run_snapshot_job(triggered_by="manual")
