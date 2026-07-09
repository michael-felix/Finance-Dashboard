"""ORM models for ASX stocks and their historical price snapshots."""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Stock(Base):
    """A tracked ASX-listed company (e.g. CBA.AX)."""

    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ticker: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    exchange: Mapped[str] = mapped_column(String(16), default="ASX", nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="AUD", nullable=False)
    sector: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    snapshots: Mapped[list["StockSnapshot"]] = relationship(
        back_populates="stock", cascade="all, delete-orphan", order_by="StockSnapshot.timestamp"
    )


class StockSnapshot(Base):
    """A point-in-time price observation for a stock, used to render historical charts."""

    __tablename__ = "stock_snapshots"
    __table_args__ = (
        UniqueConstraint("stock_id", "timestamp", name="uq_stock_snapshot_ts"),
        Index("ix_stock_snapshot_ticker_ts", "stock_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    day_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    day_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="yahoo_finance", nullable=False)

    stock: Mapped["Stock"] = relationship(back_populates="snapshots")
