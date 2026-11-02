"""
tools/rss.py — RSS feed fetcher using feedparser + httpx.

Returns a list of Article-compatible dicts.
Respects the query_cache (1-hour TTL in MongoDB).
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import httpx

from app import db
from app.config import settings
from app.schemas import Article, SourceType

logger = logging.getLogger(__name__)

USER_AGENT = (
    "NewsInvestigatorBot/1.0 (mass-comm research tool; "
    "contact: newsbot@example.com)"
)

# Well-known RSS endpoints keyed by a short alias
KNOWN_FEEDS: Dict[str, str] = {
    "bbc": "https://feeds.bbci.co.uk/news/rss.xml",
    "reuters": "https://feeds.reuters.com/reuters/topNews",
    "guardian": "https://www.theguardian.com/world/rss",
    "aljazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "ap": "https://rsshub.app/apnews/topics/apf-topnews",
}


async def fetch_rss(
    feed_url: str,
    query: Optional[str] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Fetch an RSS feed and return article dicts.
    Results are cached for 1 hour to preserve free API quotas.
    """
    cache_key = hashlib.sha256(f"rss:{feed_url}".encode()).hexdigest()
    cached = db.cache_get(cache_key, "rss")
    if cached:
        logger.debug("RSS cache hit: %s", feed_url)
        return cached["results"][:limit]

    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
        ) as client:
            resp = await client.get(feed_url)
            resp.raise_for_status()
            content = resp.content
    except Exception as exc:
        logger.error("RSS fetch failed for %s: %s", feed_url, type(exc).__name__)
        return []

    parsed = feedparser.parse(content)
    articles = []
    for entry in parsed.entries:
        pub_dt = None
        if hasattr(entry, "published"):
            try:
                pub_dt = parsedate_to_datetime(entry.published)
            except Exception:
                pass

        outlet = parsed.feed.get("title", "Unknown")
        title = entry.get("title", "")
        url = entry.get("link", "")

        if not url:
            continue

        # Optional: filter by query keyword (simple substring match)
        if query:
            haystack = (title + " " + entry.get("summary", "")).lower()
            if query.lower() not in haystack:
                continue

        articles.append(
            {
                "url": url,
                "title": title,
                "outlet": outlet,
                "published_at": pub_dt,
                "snippet": entry.get("summary", "")[:500],
                "source_type": "aggregator",
                "language": "en",
            }
        )

    # Cache raw results (convert datetime to str for JSON-compat)
    serialisable = [
        {**a, "published_at": str(a["published_at"]) if a["published_at"] else None}
        for a in articles
    ]
    db.cache_set(cache_key, "rss", serialisable)

    return articles[:limit]


async def fetch_known_feed(
    alias: str,
    query: Optional[str] = None,
    limit: int = 10,
) -> List[Dict]:
    url = KNOWN_FEEDS.get(alias.lower())
    if not url:
        logger.warning("Unknown RSS alias: %s", alias)
        return []
    return await fetch_rss(url, query=query, limit=limit)

