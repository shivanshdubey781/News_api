"""
tools/article.py — Single-article fetcher with text extraction.

Used when the caller supplies a specific URL rather than a search query.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import httpx
import trafilatura

from app.config import settings

logger = logging.getLogger(__name__)

USER_AGENT = (
    "NewsInvestigatorBot/1.0 (mass-comm research tool; "
    "contact: newsbot@example.com)"
)


async def fetch_article(url: str) -> Dict[str, Any]:
    """
    Fetch a single article URL and extract its text.

    Returns a dict with keys: url, outlet, title, full_text, snippet,
    extraction_status (full | partial | failed).
    """
    outlet = _outlet_from_url(url)

    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPStatusError as exc:
        logger.warning("HTTP %s fetching %s", exc.response.status_code, url)
        return _partial(url, outlet, "failed")
    except Exception as exc:
        logger.warning("Fetch failed for %s: %s", url, type(exc).__name__)
        return _partial(url, outlet, "failed")

    # Respect robots.txt via trafilatura settings
    metadata = trafilatura.extract_metadata(html, default_url=url)
    text = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_tables=False,
        favor_recall=True,
    )

    title = (metadata.title if metadata and metadata.title else "") or ""
    author = (metadata.author if metadata and metadata.author else "") or ""
    pub_date = (metadata.date if metadata and metadata.date else None)

    if text and len(text.strip()) > 100:
        return {
            "url": url,
            "outlet": outlet,
            "title": title,
            "author": author,
            "published_at": pub_date,
            "full_text": text,
            "snippet": text[:500],
            "extraction_status": "full",
        }
    return _partial(url, outlet, "partial", title=title)


def _outlet_from_url(url: str) -> str:
    try:
        host = urlparse(url).netloc
        return host.replace("www.", "")
    except Exception:
        return "unknown"


def _partial(url: str, outlet: str, status: str, title: str = "") -> Dict[str, Any]:
    return {
        "url": url,
        "outlet": outlet,
        "title": title,
        "author": "",
        "published_at": None,
        "full_text": None,
        "snippet": "",
        "extraction_status": status,
    }

