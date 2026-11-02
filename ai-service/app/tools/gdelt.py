"""
tools/gdelt.py — GDELT GKG / DocSearch client (no API key required).

Uses the GDELT 2.0 Article Search API:
https://blog.gdeltproject.org/gdelt-2-0-our-global-database-of-society/
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

GDELT_API = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = "NewsInvestigatorBot/1.0 (research tool)"


async def search_gdelt(
    query: str,
    country: Optional[str] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Search GDELT for articles. Returns article dicts.
    No API key required; results cached for 1 hour.
    """
    cache_key = hashlib.sha256(f"gdelt:{query}:{country}:{limit}".encode()).hexdigest()
    cached = db.cache_get(cache_key, "gdelt")
    if cached:
        return cached["results"]

    params: Dict[str, Any] = {
        "query": query,
        "mode": "artlist",
        "maxrecords": min(limit, 250),
        "format": "json",
        "sort": "hybridrel",
    }
    if country:
        params["query"] = f"{query} sourcecountry:{country.upper()}"

    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = await client.get(GDELT_API, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("GDELT HTTP error %s", exc.response.status_code)
        return []
    except Exception as exc:
        logger.error("GDELT error: %s", type(exc).__name__)
        return []

    results = []
    for item in data.get("articles", [])[:limit]:
        pub_dt = None
        raw_date = item.get("seendate", "")
        if raw_date:
            try:
                pub_dt = datetime.strptime(raw_date[:14], "%Y%m%dT%H%M%S")
            except ValueError:
                pass
        results.append(
            {
                "url": item.get("url", ""),
                "title": item.get("title", ""),
                "outlet": item.get("domain", "unknown"),
                "published_at": pub_dt,
                "snippet": "",
                "source_type": "aggregator",
                "language": item.get("language", "en").lower()[:2],
            }
        )

    serialisable = [
        {**r, "published_at": str(r["published_at"]) if r["published_at"] else None}
        for r in results
    ]
    db.cache_set(cache_key, "gdelt", serialisable)
    return results

