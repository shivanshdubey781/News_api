"""
db.py — MongoDB client and collection helpers.

Uses pymongo directly (no ODM). The URI is read from settings and never logged.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, DuplicateKeyError, PyMongoError

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client singleton
# ---------------------------------------------------------------------------

_client: Optional[MongoClient] = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.mongodb_uri.get_secret_value(),
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_db():
    return get_client()["news_investigator"]


def ping() -> bool:
    """Return True if MongoDB is reachable."""
    try:
        get_client().admin.command("ping")
        return True
    except (ConnectionFailure, PyMongoError):
        return False


# ---------------------------------------------------------------------------
# Collection accessors
# ---------------------------------------------------------------------------

def articles_col() -> Collection:
    return get_db()["articles"]


def investigations_col() -> Collection:
    return get_db()["investigations"]


def claims_col() -> Collection:
    return get_db()["claims"]


def source_log_col() -> Collection:
    return get_db()["source_log"]


def query_cache_col() -> Collection:
    return get_db()["query_cache"]


# ---------------------------------------------------------------------------
# Index setup (idempotent — call once on startup)
# ---------------------------------------------------------------------------

def ensure_indexes() -> None:
    try:
        articles_col().create_index([("url_hash", ASCENDING)], unique=True, background=True)
        articles_col().create_index([("investigation_id", ASCENDING)], background=True)
        articles_col().create_index([("published_at", ASCENDING)], background=True)

        investigations_col().create_index([("owner_id", ASCENDING)], background=True)

        claims_col().create_index([("investigation_id", ASCENDING)], background=True)

        source_log_col().create_index([("investigation_id", ASCENDING)], background=True)

        # TTL index: cache entries expire after 1 hour
        query_cache_col().create_index(
            [("created_at", ASCENDING)],
            expireAfterSeconds=3600,
            background=True,
        )
        logger.info("MongoDB indexes ensured.")
    except PyMongoError as exc:
        logger.error("Failed to create indexes: %s", type(exc).__name__)


# ---------------------------------------------------------------------------
# Article helpers
# ---------------------------------------------------------------------------

def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def article_exists(url: str) -> bool:
    return articles_col().find_one({"url_hash": url_hash(url)}) is not None


def insert_article(doc: Dict[str, Any]) -> Optional[str]:
    """
    Insert an article. Returns the inserted _id as string, or None on duplicate.
    Raises on any other DB error.
    """
    doc["url_hash"] = url_hash(doc["url"])
    doc.setdefault("fetched_at", datetime.now(timezone.utc))
    try:
        result = articles_col().insert_one(doc)
        return str(result.inserted_id)
    except DuplicateKeyError:
        return None


def get_article_by_url(url: str) -> Optional[Dict]:
    return articles_col().find_one({"url_hash": url_hash(url)})


def get_articles_for_investigation(investigation_id: str) -> List[Dict]:
    return list(articles_col().find({"investigation_id": investigation_id}))


# ---------------------------------------------------------------------------
# Source log helpers
# ---------------------------------------------------------------------------

def log_source(
    url: str,
    outlet: str,
    what_it_supports: str,
    investigation_id: str,
) -> None:
    source_log_col().insert_one(
        {
            "url": url,
            "access_date": datetime.now(timezone.utc),
            "outlet": outlet,
            "what_it_supports": what_it_supports,
            "investigation_id": investigation_id,
        }
    )


def get_source_log(investigation_id: str) -> List[Dict]:
    return list(source_log_col().find({"investigation_id": investigation_id}, {"_id": 0}))


# ---------------------------------------------------------------------------
# Query cache helpers
# ---------------------------------------------------------------------------

def cache_get(query_hash: str, provider: str) -> Optional[Dict]:
    return query_cache_col().find_one({"query_hash": query_hash, "provider": provider})


def cache_set(query_hash: str, provider: str, results: Any) -> None:
    query_cache_col().update_one(
        {"query_hash": query_hash, "provider": provider},
        {"$set": {"results": results, "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )

