"""Response schemas for the authenticated-user and admin user-management endpoints."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supabase_user_id: str
    email: str
    is_admin: bool
    created_at: datetime


class UserListResponse(BaseModel):
    items: list[UserProfileOut]
