from fastapi import APIRouter

from app.api import admin, crypto, fx, health, prices, search, stocks, summary

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(stocks.router)
api_router.include_router(crypto.router)
api_router.include_router(fx.router)
api_router.include_router(prices.router)
api_router.include_router(summary.router)
api_router.include_router(search.router)
api_router.include_router(admin.router)

__all__ = ["api_router"]
