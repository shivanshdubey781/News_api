"""
tools/guardian.py — The Guardian Content API client.

Docs: https://open-platform.theguardian.com/documentation/
Free tier: 500 req/day, 12 req/s.
Results are cached for 1 hour.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app import db
from app.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://content.guardianapis.com"
USER_AGENT = "NewsInvestigatorBot/1.0 (research tool)"


async def search_guardian(
    query: str,
    country: Optional[str] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Search The Guardian for articles matching `query`.
    Returns article dicts compatible with the Article schema.
    """
    if not settings.guardian_api_key:
        logger.warning("GUARDIAN_API_KEY not set — skipping Guardian search.")
        return []

    cache_key = hashlib.sha256(f"guardian:{query}:{country}:{limit}".encode()).hexdigest()
    cached = db.cache_get(cache_key, "guardian")
    if cached:
        return cached["results"]

    params: Dict[str, Any] = {
        "q": query,
        "api-key": settings.guardian_api_key.get_secret_value(),
        "show-fields": "headline,trailText,byline,publicationDate,sectionName",
        "page-size": min(limit, 50),
        "order-by": "relevance",
    }
    if country:
        params["tag"] = f"world/{country.lower()}"

    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = await client.get(f"{BASE_URL}/search", params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Guardian API HTTP error %s", exc.response.status_code
        )
        return []
    except Exception as exc:
        logger.error("Guardian API error: %s", type(exc).__name__)
        return []

    results = []
    for item in data.get("response", {}).get("results", []):
        fields = item.get("fields", {})
        pub_str = fields.get("publicationDate") or item.get("webPublicationDate", "")
        pub_dt = None
        if pub_str:
            try:
                pub_dt = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
            except ValueError:
                pass
        results.append(
            {
                "url": item.get("webUrl", ""),
                "title": fields.get("headline") or item.get("webTitle", ""),
                "outlet": "The Guardian",
                "published_at": pub_dt,
                "snippet": fields.get("trailText", "")[:500],
                "source_type": "wire",
                "language": "en",
            }
        )

    serialisable = [
        {**r, "published_at": str(r["published_at"]) if r["published_at"] else None}
        for r in results
    ]
    db.cache_set(cache_key, "guardian", serialisable)
    return results

