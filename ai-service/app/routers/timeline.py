"""
routers/timeline.py — POST /timeline

Builds a chronological timeline of a story from retrieved sources.
Uses Gemini (long-context) with structured output (Timeline schema).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.messages import HumanMessage, SystemMessage

from app.auth import require_internal_token
from app.llm import TaskType, get_structured_llm
from app.prompts import TIMELINE_PROMPT
from app.rag.retriever import format_context, retrieve
from app.schemas import Timeline, TimelineRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["timeline"], dependencies=[Depends(require_internal_token)])


@router.post("/timeline", response_model=Timeline)
async def timeline(req: TimelineRequest) -> Timeline:
    docs = retrieve(req.story_query, investigation_id=req.investigation_id, k=20)
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No relevant articles found. Run /ingest first.",
        )

    context = format_context(docs)
    estimated_tokens = len(context) // 4

    try:
        llm = get_structured_llm(TaskType.TIMELINE, Timeline, estimated_tokens=estimated_tokens)
        result: Timeline = await llm.ainvoke(
            [
                SystemMessage(content=TIMELINE_PROMPT),
                HumanMessage(
                    content=(
                        f"Story to timeline: {req.story_query}\n\n"
                        f"Retrieved sources:\n{context}"
                    )
                ),
            ]
        )
        return result
    except Exception as exc:
        logger.error("Timeline LLM call failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM provider error. Please try again later.",
        )

