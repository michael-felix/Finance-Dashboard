"""Shared pytest fixtures for the backend test suite."""
import os
import tempfile

# Must be set before any `app.*` module is imported, since app.config.get_settings()
# is cached at import time and several modules read it at module load.
# A real file (not `:memory:`) is used so every connection in the pool sees the same DB.
_TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "finance_dashboard_test.db")
if os.path.exists(_TEST_DB_PATH):
    os.remove(_TEST_DB_PATH)
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TEST_DB_PATH}")
os.environ.setdefault("SCHEDULER_ENABLED", "false")
os.environ.setdefault("OPEN_EXCHANGE_API_KEY", "test-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-at-least-32-characters-long")
os.environ.setdefault("ADMIN_EMAILS", "admin@example.com")

import time  # noqa: E402

import jwt  # noqa: E402
import pandas as pd  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import app.models  # noqa: E402,F401 - register all models on Base.metadata before create_all
from app.database.base import Base  # noqa: E402
from app.database.session import engine  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.utils.cache import market_data_cache  # noqa: E402


@pytest.fixture(autouse=True)
def _clear_cache():
    """Every service function is cached, so tests would otherwise leak state across cases."""
    market_data_cache.clear()
    yield
    market_data_cache.clear()


@pytest.fixture(autouse=True, scope="session")
def _create_tables():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _clean_db():
    """Truncate every table between tests so DB-touching tests don't see leftover rows."""
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(fastapi_app)


def make_auth_token(sub: str, email: str) -> str:
    """Mint a Supabase-shaped HS256 JWT for tests, signed with the test JWT secret."""
    payload = {"sub": sub, "email": email, "aud": "authenticated", "exp": int(time.time()) + 3600}
    return jwt.encode(payload, os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")


def auth_headers(sub: str, email: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_auth_token(sub, email)}"}


def make_price_history(prices: list[float], freq: str = "D") -> pd.DataFrame:
    """Build a minimal yfinance-shaped OHLC DataFrame from a list of close prices."""
    index = pd.date_range("2026-06-01", periods=len(prices), freq=freq, tz="Australia/Sydney")
    return pd.DataFrame(
        {
            "Open": prices,
            "High": prices,
            "Low": prices,
            "Close": prices,
            "Volume": [1000] * len(prices),
        },
        index=index,
    )
