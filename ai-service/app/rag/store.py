"""
rag/store.py — Chroma vector store initialisation and helpers.

- Persistent at CHROMA_DIR (from settings).
- One collection per investigation: inv_<investigation_id>.
- A shared global_news collection for cross-investigation retrieval.
- Embeddings: Gemini via app.embeddings.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from app.config import settings
from app.embeddings import get_embeddings

logger = logging.getLogger(__name__)

GLOBAL_COLLECTION = "global_news"

_chroma_client = None


def _get_chroma_client():
    global _chroma_client
    if _chroma_client is not None:
        return _chroma_client
    import chromadb

    _chroma_client = chromadb.PersistentClient(path=settings.chroma_dir)
    return _chroma_client


def collection_name(investigation_id: str) -> str:
    return f"inv_{investigation_id}"


def get_vector_store(investigation_id: Optional[str] = None):
    """
    Return a LangChain Chroma vector store for the given investigation.
    Falls back to the global collection if investigation_id is None.
    Returns None if embeddings are unavailable.
    """
    embeddings = get_embeddings()
    if embeddings is None:
        logger.warning("Embeddings unavailable — vector store disabled.")
        return None

    from langchain_chroma import Chroma

    col = collection_name(investigation_id) if investigation_id else GLOBAL_COLLECTION
    try:
        store = Chroma(
            client=_get_chroma_client(),
            collection_name=col,
            embedding_function=embeddings,
        )
        return store
    except Exception as exc:
        logger.error("Failed to open Chroma collection '%s': %s", col, type(exc).__name__)
        return None


def vector_store_ready() -> bool:
    """Ping Chroma and confirm the global collection is accessible."""
    try:
        client = _get_chroma_client()
        client.get_or_create_collection(GLOBAL_COLLECTION)
        return True
    except Exception:
        return False


def add_documents(investigation_id: Optional[str], documents: list) -> bool:
    """
    Add LangChain Document objects to BOTH the investigation collection
    and the global collection. Idempotent: documents with the same id
    are overwritten, not duplicated.
    """
    if not documents:
        return True

    embeddings = get_embeddings()
    if embeddings is None:
        return False

    from langchain_chroma import Chroma

    targets = [GLOBAL_COLLECTION]
    if investigation_id:
        targets.append(collection_name(investigation_id))

    for col in targets:
        try:
            store = Chroma(
                client=_get_chroma_client(),
                collection_name=col,
                embedding_function=embeddings,
            )
            # Use document ids derived from article_id + chunk index to ensure idempotency
            ids = [doc.metadata.get("chunk_id", str(i)) for i, doc in enumerate(documents)]
            store.add_documents(documents, ids=ids)
        except Exception as exc:
            logger.error(
                "Failed to add documents to collection '%s': %s", col, type(exc).__name__
            )
            return False
    return True

