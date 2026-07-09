"""ORM models for AUD-based foreign exchange rates and their historical snapshots."""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FxRate(Base):
    """A tracked currency pair, always quoted as AUD -> quote_currency."""

    __tablename__ = "fx_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    base_currency: Mapped[str] = mapped_column(String(8), default="AUD", nullable=False)
    quote_currency: Mapped[str] = mapped_column(String(8), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("base_currency", "quote_currency", name="uq_fx_pair"),)

    snapshots: Mapped[list["FxSnapshot"]] = relationship(
        back_populates="fx_rate", cascade="all, delete-orphan", order_by="FxSnapshot.timestamp"
    )

    @property
    def pair_symbol(self) -> str:
        return f"{self.base_currency}/{self.quote_currency}"


class FxSnapshot(Base):
    """A point-in-time exchange rate observation."""

    __tablename__ = "fx_snapshots"
    __table_args__ = (
        UniqueConstraint("fx_rate_id", "timestamp", name="uq_fx_snapshot_ts"),
        Index("ix_fx_snapshot_pair_ts", "fx_rate_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fx_rate_id: Mapped[int] = mapped_column(ForeignKey("fx_rates.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    rate: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="open_exchange_rates", nullable=False)

    fx_rate: Mapped["FxRate"] = relationship(back_populates="snapshots")
