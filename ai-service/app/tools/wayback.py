"""
tools/wayback.py — Wayback Machine (Internet Archive) availability checker.

Checks whether a URL has been archived and retrieves the oldest/newest
snapshot date. Useful for verifying publication dates and deleted articles.
"""

from __future__ import annotations

import logging
from typing import Optional, Dict, Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

AVAILABILITY_API = "https://archive.org/wayback/available"
CDX_API = "https://web.archive.org/cdx/search/cdx"
USER_AGENT = "NewsInvestigatorBot/1.0 (research tool)"


async def check_wayback(url: str) -> Dict[str, Any]:
    """
    Check if a URL is available in the Wayback Machine.
    Returns a dict with keys: available, snapshot_url, timestamp, closest.
    """
    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = await client.get(
                AVAILABILITY_API,
                params={"url": url},
            )
            resp.raise_for_status()
            data = resp.json()

        snapshot = data.get("archived_snapshots", {}).get("closest", {})
        return {
            "available": snapshot.get("available", False),
            "snapshot_url": snapshot.get("url", ""),
            "timestamp": snapshot.get("timestamp", ""),
            "status": snapshot.get("status", ""),
        }
    except Exception as exc:
        logger.error("Wayback check failed for %s: %s", url, type(exc).__name__)
        return {"available": False, "snapshot_url": "", "timestamp": "", "status": "error"}


async def get_first_snapshot(url: str) -> Optional[str]:
    """
    Return the timestamp of the FIRST archived version of a URL,
    useful for fact-checking claimed publication dates.
    """
    try:
        async with httpx.AsyncClient(
            timeout=settings.http_timeout,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = await client.get(
                CDX_API,
                params={
                    "url": url,
                    "output": "json",
                    "fl": "timestamp",
                    "limit": 1,
                    "from": "19960101",
                    "fastLatest": "true",
                },
            )
            resp.raise_for_status()
            rows = resp.json()
        if len(rows) > 1:  # first row is header ["timestamp"]
            return rows[1][0]
        return None
    except Exception as exc:
        logger.error("CDX lookup failed for %s: %s", url, type(exc).__name__)
        return None

