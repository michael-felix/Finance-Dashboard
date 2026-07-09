"""FastAPI dependencies for authenticating requests against Supabase-issued JWTs.

Supabase Auth issues a standard HS256 JWT (signed with the project's JWT secret) on
sign-in; the frontend attaches it as `Authorization: Bearer <token>`. We verify the
signature here rather than trusting the client, then get-or-create a local
`UserProfile` row keyed by the token's `sub` claim so we can attach our own
`is_admin` flag without needing write access to Supabase's own `auth.users` table.
"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.session import get_db
from app.models.user import UserProfile

_bearer_scheme = HTTPBearer(auto_error=False)


def _decode_token(token: str) -> dict:
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on this server (missing SUPABASE_JWT_SECRET).",
        )
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Verify the bearer token and return the local UserProfile, creating it on first sight."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = _decode_token(credentials.credentials)
    supabase_user_id = payload.get("sub")
    email = payload.get("email", "")
    if not supabase_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

    profile = db.execute(
        select(UserProfile).where(UserProfile.supabase_user_id == supabase_user_id)
    ).scalar_one_or_none()

    if profile is None:
        settings = get_settings()
        profile = UserProfile(
            supabase_user_id=supabase_user_id,
            email=email,
            is_admin=email.lower() in settings.admin_email_list,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif email and profile.email != email:
        profile.email = email
        db.commit()
        db.refresh(profile)

    return profile


def require_admin(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """Dependency for admin-only endpoints; 403s for authenticated non-admin users."""
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
