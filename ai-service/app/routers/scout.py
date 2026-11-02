"""
routers/scout.py — POST /scout

Fetches news articles from multiple sources and normalises them.
Sources supported: "rss:<alias>", "guardian", "gdelt", or a direct feed URL.
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_internal_token
from app.schemas import Article, ScoutRequest, SourceType
from app.tools.gdelt import search_gdelt
from app.tools.guardian import search_guardian
from app.tools.rss import KNOWN_FEEDS, fetch_known_feed, fetch_rss

logger = logging.getLogger(__name__)
router = APIRouter(tags=["scout"], dependencies=[Depends(require_internal_token)])


@router.post("/scout", response_model=List[Article])
async def scout(req: ScoutRequest) -> List[Article]:
    """
    Search multiple news sources for articles matching the query.
    Returns a normalised list of Article objects.
    """
    all_raw = []

    sources = req.sources or ["guardian", "gdelt"]

    for source in sources:
        try:
            if source == "guardian":
                raw = await search_guardian(req.query, country=req.country, limit=req.limit)
            elif source == "gdelt":
                raw = await search_gdelt(req.query, country=req.country, limit=req.limit)
            elif source.startswith("rss:"):
                alias = source[4:]
                if alias in KNOWN_FEEDS:
                    raw = await fetch_known_feed(alias, query=req.query, limit=req.limit)
                else:
                    raw = await fetch_rss(alias, query=req.query, limit=req.limit)
            else:
                # Treat source value as a direct RSS feed URL
                raw = await fetch_rss(source, query=req.query, limit=req.limit)

            all_raw.extend(raw)
        except Exception as exc:
            logger.error("Scout source '%s' failed: %s", source, type(exc).__name__)

    if not all_raw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No articles found from any source for this query.",
        )

    # Dedupe by URL and normalise
    seen = set()
    articles: List[Article] = []
    for raw in all_raw:
        url = raw.get("url", "").strip()
        if not url or url in seen:
            continue
        seen.add(url)

        articles.append(
            Article(
                url=url,
                outlet=raw.get("outlet", "unknown"),
                title=raw.get("title", ""),
                published_at=raw.get("published_at"),
                source_type=SourceType(raw.get("source_type", "unknown")),
                snippet=raw.get("snippet", ""),
                language=raw.get("language", "en"),
            )
        )
        if len(articles) >= req.limit:
            break

    return articles

