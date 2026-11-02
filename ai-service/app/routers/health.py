"""
routers/health.py — GET /health (no auth required).

Returns provider availability (booleans only), DB connectivity,
and vector store status. Never returns key values.
"""

from fastapi import APIRouter
from app.schemas import HealthResponse
from app import db
from app.rag.store import vector_store_ready
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    mongo_ok = db.ping()
    vs_ok = vector_store_ready()

    all_ok = mongo_ok and vs_ok and (settings.groq_available or settings.gemini_available)

    return HealthResponse(
        status="ok" if all_ok else "degraded",
        groq_available=settings.groq_available,
        gemini_available=settings.gemini_available,
        mongodb_connected=mongo_ok,
        vector_store_ready=vs_ok,
    )

