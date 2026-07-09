"""FastAPI application entry point for the Australian Finance Dashboard API."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure every ORM model is registered on Base.metadata before create_all runs below —
# importing only a subset (e.g. via the scheduler module) would silently skip their tables.
import app.models  # noqa: F401,E402
from app.api import api_router
from app.config import get_settings
from app.database.base import Base
from app.database.session import engine
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup and start/stop the background scheduler."""
    Base.metadata.create_all(bind=engine)

    scheduler = None
    if settings.scheduler_enabled:
        from app.scheduler.jobs import create_scheduler

        scheduler = create_scheduler()
        scheduler.start()
        logger.info("Scheduler started (interval=%sm)", settings.snapshot_interval_minutes)

    yield

    if scheduler is not None:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")


app = FastAPI(
    title="Australian Finance Dashboard API",
    description=(
        "Live market data API covering ASX stocks, AUD foreign exchange rates, "
        "and cryptocurrency prices, backed by a scheduled PostgreSQL snapshot pipeline."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(api_router)


@app.get("/", tags=["health"])
def root() -> dict:
    """Basic service metadata, useful for confirming the deployment is reachable."""
    return {"service": "finance-dashboard-api", "status": "running", "docs": "/docs"}
