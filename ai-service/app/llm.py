"""
llm.py — LLM model factory with routing, fallbacks, and retries.

Rules:
- Groq  → fast, short tasks (classification, entity extraction, routing).
- Gemini → long-context tasks (compare, timeline, multi-article summaries).
- get_llm(task, estimated_tokens) selects the right model with a plain Python rule.
- .with_fallbacks() chains the two providers so rate-limits degrade gracefully.
- Temperature 0–0.2 for all factual tasks.
- Model names come from settings (never hard-coded here).
- No key is ever printed, logged, or raised in an error message.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Optional

from langchain_core.language_models import BaseChatModel
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Task taxonomy
# ---------------------------------------------------------------------------

class TaskType(str, Enum):
    # Short / fast — Groq preferred
    CLASSIFY = "classify"
    ENTITY_EXTRACT = "entity_extract"
    HEADLINE_CLEAN = "headline_clean"
    ROUTE = "route"
    # Long-context — Gemini preferred
    SUMMARIZE = "summarize"
    COMPARE = "compare"
    TIMELINE = "timeline"
    VERIFY = "verify"
    ASK = "ask"


_LONG_CONTEXT_TASKS = {
    TaskType.SUMMARIZE,
    TaskType.COMPARE,
    TaskType.TIMELINE,
    TaskType.VERIFY,
    TaskType.ASK,
}

# ---------------------------------------------------------------------------
# Internal model builders
# ---------------------------------------------------------------------------

def _build_groq(temperature: float = 0.1) -> Optional[BaseChatModel]:
    if not settings.groq_available:
        return None
    try:
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=settings.groq_model,
            groq_api_key=settings.groq_api_key.get_secret_value(),
            temperature=temperature,
            max_retries=settings.max_retries,
        )
    except Exception as exc:
        logger.error("Failed to build Groq model: %s", type(exc).__name__)
        return None


def _build_gemini(temperature: float = 0.1) -> Optional[BaseChatModel]:
    if not settings.gemini_available:
        return None
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key.get_secret_value(),
            temperature=temperature,
        )
    except Exception as exc:
        logger.error("Failed to build Gemini model: %s", type(exc).__name__)
        return None


# ---------------------------------------------------------------------------
# Public factory
# ---------------------------------------------------------------------------

def get_llm(
    task: TaskType | str,
    estimated_tokens: int = 0,
    temperature: float = 0.1,
) -> BaseChatModel:
    """
    Select and return an LLM with automatic fallback wiring.

    Selection logic (plain Python — no LLM call):
    1. If task is long-context OR estimated_tokens > threshold → prefer Gemini.
    2. Otherwise → prefer Groq.
    3. Fallback: if preferred is unavailable, use the other.
    4. If neither is available, raise RuntimeError (service is fully degraded).
    """
    task_enum = TaskType(task) if isinstance(task, str) else task
    prefer_gemini = (
        task_enum in _LONG_CONTEXT_TASKS
        or estimated_tokens > settings.long_context_token_threshold
    )

    groq = _build_groq(temperature)
    gemini = _build_gemini(temperature)

    if prefer_gemini:
        primary, fallback = gemini, groq
        primary_name, fallback_name = "Gemini", "Groq"
    else:
        primary, fallback = groq, gemini
        primary_name, fallback_name = "Groq", "Gemini"

    if primary is None and fallback is None:
        raise RuntimeError(
            "No LLM provider is available. "
            "Set GROQ_API_KEY and/or GEMINI_API_KEY in your environment."
        )

    if primary is None:
        logger.warning("%s unavailable; using %s.", primary_name, fallback_name)
        return fallback

    if fallback is None:
        return primary

    # Wire fallback: if primary raises an exception, fall through to secondary.
    # This covers 429 rate-limits and 5xx errors.
    return primary.with_fallbacks([fallback])


def get_structured_llm(task: TaskType | str, schema, estimated_tokens: int = 0):
    """
    Return an LLM bound to a Pydantic schema via .with_structured_output().
    Uses the same routing logic as get_llm().
    """
    llm = get_llm(task=task, estimated_tokens=estimated_tokens, temperature=0.0)
    return llm.with_structured_output(schema)

