"""
tools/factcheck.py — Google Fact Check Tools API client.

Docs: https://developers.google.com/fact-check/tools/api/reference/rest
Free tier: 1,000 req/day.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any, Dict, List, Optional

import httpx

from app import db
from app.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
USER_AGENT = "NewsInvestigatorBot/1.0 (research tool)"


async def search_factcheck(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search the Google Fact Check Tools API for claims matching `query`.
    Returns a list of fact-check result dicts.
    """
    if not settings.factcheck_api_key:
        logger.warning("FACTCHECK_API_KEY not set — skipping fact-check search.")
        return []

    cache_key = hashlib.sha256(f"factcheck:{query}".encode()).hexdigest()
    cached = db.cache_get(cache_key, "factcheck")
    if cached:
        return cached["results"]

    params = {
        "query": query,
        "key": settings.factcheck_api_key.get_secret_value(),
        "pageSize": min(limit, 10),
        "languageCode": "en",
    }

    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = await client.get(BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("FactCheck API HTTP error %s", exc.response.status_code)
        return []
    except Exception as exc:
        logger.error("FactCheck API error: %s", type(exc).__name__)
        return []

    results = []
    for claim in data.get("claims", []):
        for review in claim.get("claimReview", []):
            results.append(
                {
                    "claim_text": claim.get("text", ""),
                    "claimant": claim.get("claimant", ""),
                    "claim_date": claim.get("claimDate", ""),
                    "publisher": review.get("publisher", {}).get("name", ""),
                    "url": review.get("url", ""),
                    "title": review.get("title", ""),
                    "rating": review.get("textualRating", ""),
                    "review_date": review.get("reviewDate", ""),
                    "language_code": review.get("languageCode", "en"),
                }
            )

    db.cache_set(cache_key, "factcheck", results)
    return results[:limit]

