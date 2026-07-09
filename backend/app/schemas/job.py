"""Response schemas for the admin scheduler/job-health endpoints."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SchedulerRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    finished_at: datetime
    stocks_stored: int
    crypto_stored: int
    fx_stored: int
    success: bool
    error_message: str | None
    triggered_by: str


class SchedulerRunListResponse(BaseModel):
    items: list[SchedulerRunOut]
