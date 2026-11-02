"""
routers/compare.py — POST /compare

Compares how different outlets covered the same event.
Uses Gemini (long-context) via get_structured_llm with the Comparison schema.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.messages import HumanMessage, SystemMessage

from app.auth import require_internal_token
from app.llm import TaskType, get_structured_llm
from app.prompts import COMPARE_PROMPT
from app.rag.retriever import format_context, retrieve
from app.schemas import Comparison, CompareRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["compare"], dependencies=[Depends(require_internal_token)])


@router.post("/compare", response_model=Comparison)
async def compare(req: CompareRequest) -> Comparison:
    """
    Retrieve relevant chunks and ask the LLM to produce a structured
    multi-outlet comparison. Uses .with_structured_output(Comparison).
    """
    docs = retrieve(req.event_query, investigation_id=req.investigation_id, k=16)
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No relevant articles found for this event query. Run /ingest first.",
        )

    context = format_context(docs)
    estimated_tokens = len(context) // 4  # rough char-to-token estimate

    try:
        llm = get_structured_llm(TaskType.COMPARE, Comparison, estimated_tokens=estimated_tokens)
        result: Comparison = await llm.ainvoke(
            [
                SystemMessage(content=COMPARE_PROMPT),
                HumanMessage(
                    content=(
                        f"Event to compare: {req.event_query}\n\n"
                        f"Retrieved sources:\n{context}"
                    )
                ),
            ]
        )
        return result
    except Exception as exc:
        logger.error("Compare LLM call failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM provider error. Please try again later.",
        )

