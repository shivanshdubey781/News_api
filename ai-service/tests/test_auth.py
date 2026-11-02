"""
tests/test_auth.py — Authentication middleware tests.

Spec: endpoints without X-Internal-Token return 401.
"""

from __future__ import annotations

import pytest
from tests.conftest import VALID_TOKEN, INVALID_TOKEN


def test_health_no_token_allowed(client):
    """GET /health does NOT require a token."""
    resp = client.get("/health")
    assert resp.status_code == 200


def test_scout_no_token_returns_401(client):
    """POST /scout without token → 401."""
    resp = client.post("/scout", json={"query": "test", "limit": 5})
    assert resp.status_code == 401


def test_scout_wrong_token_returns_401(client):
    """POST /scout with wrong token → 401."""
    resp = client.post(
        "/scout",
        json={"query": "test", "limit": 5},
        headers={"X-Internal-Token": INVALID_TOKEN},
    )
    assert resp.status_code == 401


def test_ingest_no_token_returns_401(client):
    resp = client.post(
        "/ingest",
        json={"investigation_id": "inv1", "urls": ["https://example.com"]},
    )
    assert resp.status_code == 401


def test_compare_no_token_returns_401(client):
    resp = client.post(
        "/compare",
        json={"investigation_id": "inv1", "event_query": "test"},
    )
    assert resp.status_code == 401


def test_sources_no_token_returns_401(client):
    resp = client.get("/sources/inv1")
    assert resp.status_code == 401


def test_401_response_contains_no_secret(client):
    """The 401 error body must NOT contain the actual token value."""
    resp = client.post(
        "/scout",
        json={"query": "test"},
        headers={"X-Internal-Token": INVALID_TOKEN},
    )
    body = resp.text
    assert VALID_TOKEN not in body
    assert INVALID_TOKEN not in body  # Don't echo back what was sent

