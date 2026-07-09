"""Request/response schemas for the admin asset-management endpoints."""
from pydantic import BaseModel


class AddStockRequest(BaseModel):
    ticker: str
    name: str


class AddCryptoRequest(BaseModel):
    coingecko_id: str
    symbol: str
    name: str


class AddFxRequest(BaseModel):
    quote_currency: str


class TrackedStock(BaseModel):
    ticker: str
    name: str


class TrackedCrypto(BaseModel):
    coingecko_id: str
    symbol: str
    name: str


class TrackedFx(BaseModel):
    quote_currency: str


class TrackedAssetsResponse(BaseModel):
    stocks: list[TrackedStock]
    crypto: list[TrackedCrypto]
    fx: list[TrackedFx]
