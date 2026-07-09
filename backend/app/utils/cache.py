"""A minimal in-process TTL cache used to shield free upstream APIs from rate limits.

Not a substitute for Redis in a multi-instance deployment, but sufficient for a
single-process FastAPI deployment on Railway and keeps the project dependency-light.
"""
import time
from collections.abc import Callable
from threading import Lock
from typing import Any, TypeVar

T = TypeVar("T")


class TTLCache:
    """Thread-safe cache that expires entries after a fixed number of seconds."""

    def __init__(self, default_ttl_seconds: float = 60.0) -> None:
        self._default_ttl = default_ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if time.monotonic() >= expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: float | None = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            self._store[key] = (time.monotonic() + ttl, value)

    def get_or_set(self, key: str, factory: Callable[[], T], ttl_seconds: float | None = None) -> T:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = factory()
        self.set(key, value, ttl_seconds)
        return value

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


# Shared cache instance for market-data lookups (60s TTL matches free-tier rate limits).
market_data_cache = TTLCache(default_ttl_seconds=60.0)
