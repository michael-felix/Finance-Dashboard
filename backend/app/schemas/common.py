"""Shared schema primitives used across multiple response models."""
from enum import Enum

from pydantic import BaseModel


class ChartRange(str, Enum):
    """Supported historical chart windows."""

    ONE_DAY = "1D"
    ONE_WEEK = "1W"
    ONE_MONTH = "1M"
    THREE_MONTHS = "3M"


class PricePoint(BaseModel):
    """A single (timestamp, value) observation used to render sparklines/charts."""

    timestamp: str
    value: float


class ErrorResponse(BaseModel):
    """Standard error envelope returned by the API on failure."""

    detail: str
    error_code: str | None = None
