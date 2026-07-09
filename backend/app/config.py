"""Centralized application configuration loaded from environment variables."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the Finance Dashboard API."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase / Postgres
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = "sqlite:///./finance_dashboard.db"

    # Comma-separated emails auto-promoted to admin the first time they sign in.
    admin_emails: str = ""

    # External APIs
    open_exchange_api_key: str = ""

    # App
    port: int = 8000
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"

    # Scheduler
    scheduler_enabled: bool = True
    snapshot_interval_minutes: int = 15

    # Default watchlist seeds
    default_stock_tickers: str = "CBA.AX,BHP.AX,CSL.AX,NAB.AX,WBC.AX"
    default_crypto_ids: str = "bitcoin,ethereum,solana"
    default_fx_pairs: str = "USD,EUR,JPY,GBP,NZD"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def stock_ticker_list(self) -> list[str]:
        return [t.strip() for t in self.default_stock_tickers.split(",") if t.strip()]

    @property
    def crypto_id_list(self) -> list[str]:
        return [c.strip() for c in self.default_crypto_ids.split(",") if c.strip()]

    @property
    def fx_pair_list(self) -> list[str]:
        return [p.strip() for p in self.default_fx_pairs.split(",") if p.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (avoids re-parsing env on every call)."""
    return Settings()
