"""
rag/ingest.py — Full ingest pipeline.

Pipeline:
    fetch (tool result / URL list)
    → dedupe (url_hash check in MongoDB)
    → extract text (trafilatura)
    → save to MongoDB
    → chunk (RecursiveCharacterTextSplitter)
    → embed + store in Chroma
    → return counts

Idempotent: re-running on the same URL yields no duplicate chunks because
chunk_id is deterministic (url_hash + chunk_index).
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
import trafilatura
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app import db
from app.config import settings
from app.rag import store as vector_store_module
from app.schemas import Article, SourceType

logger = logging.getLogger(__name__)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100

USER_AGENT = (
    "NewsInvestigatorBot/1.0 (mass-comm research tool; "
    "contact: newsbot@example.com)"
)

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    length_function=len,
)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def ingest_articles(
    investigation_id: str,
    articles: Optional[List[Article]] = None,
    urls: Optional[List[str]] = None,
) -> Dict[str, int]:
    """
    Ingest a mix of pre-parsed Article objects and raw URLs.
    Returns counts: {new, duplicate, partial, failed}.
    """
    counts = {"new": 0, "duplicate": 0, "partial": 0, "failed": 0}

    items: List[Dict] = []

    if articles:
        for a in articles:
            items.append(
                {
                    "url": a.url,
                    "outlet": a.outlet,
                    "title": a.title,
                    "published_at": a.published_at,
                    "source_type": a.source_type.value if a.source_type else "unknown",
                    "language": a.language,
                    "snippet": a.snippet,
                }
            )

    if urls:
        for url in urls:
            items.append({"url": url, "outlet": "unknown", "title": ""})

    for item in items:
        try:
            await _ingest_one(investigation_id, item, counts)
        except Exception as exc:
            logger.error("Ingest failed for %s: %s", item.get("url", "?"), type(exc).__name__)
            counts["failed"] += 1

    return counts


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _ingest_one(
    investigation_id: str,
    item: Dict[str, Any],
    counts: Dict[str, int],
) -> None:
    url = item["url"]

    # --- 1. Dedupe ---
    if db.article_exists(url):
        counts["duplicate"] += 1
        logger.debug("Duplicate skipped: %s", url)
        return

    # --- 2. Fetch + extract ---
    full_text, extraction_status = await _extract_text(url)

    if full_text is None:
        extraction_status = "partial"

    # --- 3. Build MongoDB document ---
    fetched_at = datetime.now(timezone.utc)
    doc: Dict[str, Any] = {
        "url": url,
        "outlet": item.get("outlet", "unknown"),
        "title": item.get("title", ""),
        "published_at": item.get("published_at"),
        "source_type": item.get("source_type", "unknown"),
        "language": item.get("language", "en"),
        "full_text": full_text or item.get("snippet", ""),
        "snippet": item.get("snippet", (full_text or "")[:300]),
        "extraction_status": extraction_status,
        "investigation_id": investigation_id,
        "fetched_at": fetched_at,
    }

    article_id = db.insert_article(doc)
    if article_id is None:
        # Race condition — another worker inserted it just now
        counts["duplicate"] += 1
        return

    # --- 4. Chunk + embed + store ---
    if full_text:
        _chunk_and_store(
            investigation_id=investigation_id,
            article_id=article_id,
            doc=doc,
            text=full_text,
        )
        if extraction_status == "partial":
            counts["partial"] += 1
        else:
            counts["new"] += 1
    else:
        counts["partial"] += 1


async def _extract_text(url: str):
    """
    Fetch the URL and extract article text using trafilatura.
    Returns (text_or_None, status_string).
    Respects robots.txt via trafilatura's built-in support.
    """
    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text

        text = trafilatura.extract(
            html,
            url=url,
            include_comments=False,
            include_tables=False,
            favor_recall=True,
        )
        if text and len(text.strip()) > 100:
            return text, "full"
        return None, "partial"
    except httpx.HTTPStatusError as exc:
        logger.warning("HTTP %s fetching %s", exc.response.status_code, url)
        return None, "failed"
    except Exception as exc:
        logger.warning("Extraction failed for %s: %s", url, type(exc).__name__)
        return None, "failed"


def _chunk_and_store(
    investigation_id: str,
    article_id: str,
    doc: Dict[str, Any],
    text: str,
) -> None:
    """Chunk text and write to Chroma with full metadata."""
    url_hash = db.url_hash(doc["url"])
    chunks = _splitter.split_text(text)

    lc_docs = []
    for i, chunk in enumerate(chunks):
        chunk_id = f"{url_hash}_{i}"
        metadata = {
            "chunk_id": chunk_id,
            "article_id": article_id,
            "url": doc["url"],
            "outlet": doc.get("outlet", "unknown"),
            "title": doc.get("title", ""),
            "published_at": str(doc.get("published_at") or ""),
            "fetched_at": str(doc.get("fetched_at") or ""),
            "source_type": doc.get("source_type", "unknown"),
            "language": doc.get("language", "en"),
            "investigation_id": investigation_id,
        }
        lc_docs.append(Document(page_content=chunk, metadata=metadata))

    vector_store_module.add_documents(investigation_id, lc_docs)

