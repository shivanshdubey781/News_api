"""
rag/retriever.py — Retrieval with metadata filters and citations.

Every result always includes url, outlet, published_at so the caller
can build Citation objects without a second DB round-trip.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from langchain_core.documents import Document

from app.config import settings
from app.rag.store import get_vector_store
from app.schemas import Citation

logger = logging.getLogger(__name__)


def retrieve(
    query: str,
    investigation_id: Optional[str] = None,
    outlet: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    k: Optional[int] = None,
) -> List[Document]:
    """
    Similarity search over Chroma with optional metadata filters.

    Returns a list of LangChain Documents whose metadata always contains:
    url, outlet, published_at, title, source_type, investigation_id.
    """
    k = k or settings.retrieval_k
    store = get_vector_store(investigation_id)
    if store is None:
        logger.warning("Vector store unavailable — returning empty results.")
        return []

    # Build a Chroma where-clause filter
    where: Dict[str, Any] = {}
    if investigation_id:
        where["investigation_id"] = investigation_id
    if outlet:
        where["outlet"] = outlet
    if date_from:
        where["published_at"] = {"$gte": date_from}
    if date_to:
        existing = where.get("published_at", {})
        existing["$lte"] = date_to
        where["published_at"] = existing

    try:
        if where:
            docs = store.similarity_search(query, k=k, filter=where)
        else:
            docs = store.similarity_search(query, k=k)
        return docs
    except Exception as exc:
        logger.error("Retrieval failed: %s", type(exc).__name__)
        return []


def docs_to_citations(docs: List[Document]) -> List[Citation]:
    """Convert retrieved Document objects to Citation schema objects."""
    citations = []
    seen_urls = set()
    for doc in docs:
        url = doc.metadata.get("url", "")
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        # Trim snippet to ~25 words
        snippet_words = doc.page_content.split()[:25]
        snippet = " ".join(snippet_words) + ("…" if len(snippet_words) == 25 else "")
        citations.append(
            Citation(
                url=url,
                outlet=doc.metadata.get("outlet", "unknown"),
                published_at=doc.metadata.get("published_at") or None,
                quote_snippet=snippet,
            )
        )
    return citations


def format_context(docs: List[Document]) -> str:
    """
    Format retrieved documents as a numbered context block for LLM prompts.
    Includes inline source labels so the model can cite them.
    """
    if not docs:
        return "No relevant sources found in the database for this query."

    parts = []
    for i, doc in enumerate(docs, start=1):
        meta = doc.metadata
        parts.append(
            f"[{i}] {meta.get('outlet', 'Unknown')} | "
            f"{meta.get('published_at', 'date unknown')} | "
            f"{meta.get('title', '')}\n"
            f"URL: {meta.get('url', '')}\n"
            f"Type: {meta.get('source_type', 'unknown')}\n\n"
            f"{doc.page_content}\n"
            f"{'─' * 60}"
        )
    return "\n\n".join(parts)

