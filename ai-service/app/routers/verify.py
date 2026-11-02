"""
routers/verify.py — POST /verify

Fact-check a claim using:
1. Google Fact Check Tools API hits.
2. Retrieved sources from Chroma.
3. LLM-produced verification checklist (guide only — no final verdict).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.messages import HumanMessage, SystemMessage

from app.auth import require_internal_token
from app.llm import TaskType, get_structured_llm
from app.prompts import VERIFY_PROMPT
from app.rag.retriever import docs_to_citations, format_context, retrieve
from app.schemas import VerifyRequest, VerifyResult
from app.tools.factcheck import search_factcheck

logger = logging.getLogger(__name__)
router = APIRouter(tags=["verify"], dependencies=[Depends(require_internal_token)])


@router.post("/verify", response_model=VerifyResult)
async def verify(req: VerifyRequest) -> VerifyResult:
    # --- 1. Fact-check API hits ---
    factcheck_hits = await search_factcheck(req.claim, limit=5)

    # --- 2. Retrieved related sources ---
    docs = retrieve(
        req.claim,
        investigation_id=req.investigation_id,
        k=8,
    )
    related_sources = docs_to_citations(docs)
    context = format_context(docs)
    estimated_tokens = len(context) // 4

    # --- 3. LLM-generated checklist (guide, no verdict) ---
    checklist = []
    try:
        llm = get_structured_llm(TaskType.VERIFY, VerifyResult, estimated_tokens=estimated_tokens)
        result: VerifyResult = await llm.ainvoke(
            [
                SystemMessage(content=VERIFY_PROMPT),
                HumanMessage(
                    content=(
                        f"Claim to investigate: {req.claim}\n\n"
                        f"Fact-check database hits:\n"
                        + (
                            "\n".join(
                                f"- [{h.get('publisher')}] {h.get('title')} "
                                f"Rating: {h.get('rating')} URL: {h.get('url')}"
                                for h in factcheck_hits
                            )
                            if factcheck_hits
                            else "None found."
                        )
                        + f"\n\nRetrieved sources:\n{context}"
                    )
                ),
            ]
        )
        checklist = result.checklist
        # Override with our direct hits
        result.factcheck_hits = factcheck_hits
        result.related_sources = related_sources
        result.claim = req.claim
        return result
    except Exception as exc:
        logger.error("Verify LLM call failed: %s", type(exc).__name__)
        # Degrade gracefully: return what we have without LLM
        return VerifyResult(
            claim=req.claim,
            factcheck_hits=factcheck_hits,
            checklist=[
                "Could not generate checklist (LLM unavailable).",
                "Manually check: who reported first, original source, date discrepancies.",
            ],
            related_sources=related_sources,
        )

