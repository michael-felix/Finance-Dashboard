"""ORM models for cryptocurrencies and their historical price snapshots."""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Crypto(Base):
    """A tracked cryptocurrency, keyed by its CoinGecko id (e.g. 'bitcoin')."""

    __tablename__ = "crypto"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    coingecko_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    symbol: Mapped[str] = mapped_column(String(16), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    snapshots: Mapped[list["CryptoSnapshot"]] = relationship(
        back_populates="crypto", cascade="all, delete-orphan", order_by="CryptoSnapshot.timestamp"
    )


class CryptoSnapshot(Base):
    """A point-in-time price/market observation for a cryptocurrency, quoted in AUD."""

    __tablename__ = "crypto_snapshots"
    __table_args__ = (
        UniqueConstraint("crypto_id", "timestamp", name="uq_crypto_snapshot_ts"),
        Index("ix_crypto_snapshot_coin_ts", "crypto_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    crypto_id: Mapped[int] = mapped_column(ForeignKey("crypto.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    price_aud: Mapped[float] = mapped_column(Float, nullable=False)
    market_cap_aud: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_24h_aud: Mapped[float | None] = mapped_column(Float, nullable=True)
    change_24h_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="coingecko", nullable=False)

    crypto: Mapped["Crypto"] = relationship(back_populates="snapshots")
