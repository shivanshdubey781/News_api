"""
main.py — FastAPI application entry point.

Startup sequence:
1. Check .env is not tracked by git.
2. Validate required environment variables (via Settings).
3. Ensure MongoDB indexes.
4. Log provider availability (booleans only — no keys).
5. Mount all routers.
"""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings, _check_env_file_not_tracked, settings

# ---------------------------------------------------------------------------
# Logging — structured, no secrets, no full-text
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("AI Service starting up...")

    # Security: fail if .env could be committed
    try:
        _check_env_file_not_tracked()
    except RuntimeError as exc:
        logger.critical(str(exc))
        sys.exit(1)

    # Provider availability (booleans only in logs)
    logger.info("Groq available: %s", settings.groq_available)
    logger.info("Gemini available: %s", settings.gemini_available)

    if not settings.groq_available and not settings.gemini_available:
        logger.warning(
            "NO LLM PROVIDER configured. All AI endpoints will return 503."
        )

    # Ensure MongoDB indexes
    try:
        from app import db
        db.ensure_indexes()
        logger.info("MongoDB connected and indexes ready.")
    except Exception as exc:
        logger.error("MongoDB startup check failed: %s", type(exc).__name__)

    # Warm up Chroma
    try:
        from app.rag.store import vector_store_ready
        ready = vector_store_ready()
        logger.info("Vector store ready: %s", ready)
    except Exception as exc:
        logger.error("Vector store startup check failed: %s", type(exc).__name__)

    yield

    # --- Shutdown ---
    logger.info("AI Service shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="News Investigation AI Service",
    description=(
        "Backend AI service for a news investigation tool. "
        "Requires X-Internal-Token header on all endpoints except /health."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # Disable default OpenAPI schemas that could expose internal details
    docs_url="/docs",
    redoc_url=None,
)

# CORS — restrict in production to the Express gateway's origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Internal-Token", "Content-Type"],
)


# ---------------------------------------------------------------------------
# Global error handlers — no stack traces, no secrets in responses
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        type(exc).__name__,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check service logs."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from app.routers import health, scout, ingest, compare, timeline, verify, ask, sources  # noqa: E402

app.include_router(health.router)
app.include_router(scout.router)
app.include_router(ingest.router)
app.include_router(compare.router)
app.include_router(timeline.router)
app.include_router(verify.router)
app.include_router(ask.router)
app.include_router(sources.router)


# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level=settings.log_level.lower(),
    )

