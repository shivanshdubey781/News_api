"""
schemas.py — Pydantic v2 models shared across the service.

These are the canonical data contracts for API requests, responses,
and .with_structured_output() calls.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class SourceType(str, Enum):
    wire = "wire"
    primary = "primary"
    opinion = "opinion"
    state_media = "state_media"
    aggregator = "aggregator"
    unknown = "unknown"


class ClaimStatus(str, Enum):
    verified = "verified"
    disputed = "disputed"
    unverified = "unverified"


# ---------------------------------------------------------------------------
# Core domain models
# ---------------------------------------------------------------------------

class Article(BaseModel):
    id: Optional[str] = None
    url: str
    outlet: str
    title: str
    published_at: Optional[datetime] = None
    source_type: SourceType = SourceType.unknown
    snippet: Optional[str] = None
    language: str = "en"


class Citation(BaseModel):
    url: str
    outlet: str
    published_at: Optional[datetime] = None
    quote_snippet: Optional[str] = Field(default=None, max_length=200)  # ~25 words


class OutletCoverage(BaseModel):
    outlet: str
    headline: str
    key_claims: List[str] = Field(default_factory=list)
    framing_notes: str = ""
    omissions: List[str] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)


class Comparison(BaseModel):
    event: str
    outlets: List[OutletCoverage] = Field(default_factory=list)
    agreements: List[str] = Field(default_factory=list)
    disagreements: List[str] = Field(default_factory=list)
    single_source_flags: List[str] = Field(default_factory=list)


class TimelineEvent(BaseModel):
    date: str  # ISO-8601 string; may be partial ("2024-Q3")
    description: str
    citations: List[Citation] = Field(default_factory=list)


class Timeline(BaseModel):
    story: str
    events: List[TimelineEvent] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)


class VerifyResult(BaseModel):
    claim: str
    factcheck_hits: List[dict] = Field(default_factory=list)
    checklist: List[str] = Field(default_factory=list)
    related_sources: List[Citation] = Field(default_factory=list)
    verdict: ClaimStatus = ClaimStatus.unverified


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class ScoutRequest(BaseModel):
    query: str
    country: Optional[str] = None
    sources: List[str] = Field(default_factory=list)
    limit: int = Field(default=10, ge=1, le=50)


class IngestRequest(BaseModel):
    investigation_id: str
    articles: Optional[List[Article]] = None
    urls: Optional[List[str]] = None


class IngestResponse(BaseModel):
    new: int = 0
    duplicate: int = 0
    partial: int = 0
    failed: int = 0


class CompareRequest(BaseModel):
    investigation_id: str
    event_query: str


class TimelineRequest(BaseModel):
    investigation_id: str
    story_query: str


class VerifyRequest(BaseModel):
    claim: str
    investigation_id: Optional[str] = None


class AskRequest(BaseModel):
    investigation_id: str
    question: str
    stream: bool = False


class AskResponse(BaseModel):
    answer: str
    citations: List[Citation] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str  # "ok" | "degraded" | "error"
    groq_available: bool
    gemini_available: bool
    mongodb_connected: bool
    vector_store_ready: bool

