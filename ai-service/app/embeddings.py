"""
embeddings.py — Gemini embeddings factory.

Falls back gracefully if GEMINI_API_KEY is not set.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_embeddings_instance = None


def get_embeddings():
    """
    Return a LangChain Embeddings instance backed by Gemini.
    Returns None if Gemini is unavailable (degraded mode).
    """
    global _embeddings_instance
    if _embeddings_instance is not None:
        return _embeddings_instance

    if not settings.gemini_available:
        logger.warning("Gemini unavailable — embeddings disabled.")
        return None

    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        _embeddings_instance = GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.gemini_api_key.get_secret_value(),
        )
        logger.info("Gemini embeddings initialised (model=%s).", settings.gemini_embedding_model)
        return _embeddings_instance
    except Exception as exc:
        logger.error("Failed to initialise Gemini embeddings: %s", type(exc).__name__)
        return None

