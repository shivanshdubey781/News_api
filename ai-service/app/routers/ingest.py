"""
routers/ingest.py — POST /ingest

Triggers the ingest pipeline for an investigation.
Accepts a mix of Article objects and raw URLs.
"""

from fastapi import APIRouter, Depends

from app.auth import require_internal_token
from app.rag.ingest import ingest_articles
from app.schemas import IngestRequest, IngestResponse

router = APIRouter(tags=["ingest"], dependencies=[Depends(require_internal_token)])


@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest) -> IngestResponse:
    """
    Ingest articles into MongoDB + Chroma for the given investigation.
    Returns counts: new, duplicate, partial, failed.
    """
    counts = await ingest_articles(
        investigation_id=req.investigation_id,
        articles=req.articles,
        urls=req.urls,
    )
    return IngestResponse(**counts)

