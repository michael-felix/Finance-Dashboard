"""ORM model logging each execution of the snapshot pipeline, for the admin job-health view."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class SchedulerRun(Base):
    __tablename__ = "scheduler_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    finished_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    stocks_stored: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    crypto_stored: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fx_stored: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(16), default="schedule", nullable=False)
