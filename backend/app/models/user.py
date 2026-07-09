"""ORM model mirroring authenticated Supabase users, plus our own admin flag.

Supabase owns the actual `auth.users` table (credentials, sessions, password resets);
this table is a thin local shadow keyed by the JWT `sub` claim, created on first
authenticated request, so the API can attach an `is_admin` flag without needing
write access to Supabase's auth schema.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    supabase_user_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
