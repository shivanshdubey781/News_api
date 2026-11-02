"""
routers/ask.py — POST /ask

Runs the LangGraph agent against the investigation's knowledge base.
Supports both JSON response and SSE streaming (stream=true).
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from app.agent import run_agent, stream_agent
from app.auth import require_internal_token
from app.schemas import AskRequest, AskResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ask"], dependencies=[Depends(require_internal_token)])


@router.post("/ask")
async def ask(req: AskRequest, request: Request):
    """
    Answer a question grounded in the investigation's ingested articles.
    Set stream=true for Server-Sent Events streaming.
    """
    if req.stream:
        return EventSourceResponse(
            _sse_generator(req.investigation_id, req.question),
            media_type="text/event-stream",
        )

    try:
        response: AskResponse = await run_agent(req.investigation_id, req.question)
        return response
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Agent failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Agent error. Please try again later.",
        )


async def _sse_generator(investigation_id: str, question: str):
    """Yield SSE events from the streaming agent."""
    try:
        async for chunk in stream_agent(investigation_id, question):
            yield {"data": chunk}
    except Exception as exc:
        logger.error("Stream agent failed: %s", type(exc).__name__)
        yield {"event": "error", "data": json.dumps({"detail": "Stream error."})}

