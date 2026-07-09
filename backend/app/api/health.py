"""Liveness/readiness endpoint used by Docker healthchecks and uptime monitors."""
from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    """Return a simple OK payload confirming the API process is alive."""
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}
