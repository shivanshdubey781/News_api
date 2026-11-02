"""
tests/test_health.py — Health endpoint tests.
"""

from __future__ import annotations

import pytest
from unittest.mock import patch


def test_health_returns_200(client):
    resp = client.get("/health")
    assert resp.status_code == 200


def test_health_shape(client):
    resp = client.get("/health")
    data = resp.json()
    assert "status" in data
    assert "groq_available" in data
    assert "gemini_available" in data
    assert "mongodb_connected" in data
    assert "vector_store_ready" in data
    # All availability fields are booleans
    assert isinstance(data["groq_available"], bool)
    assert isinstance(data["gemini_available"], bool)
    assert isinstance(data["mongodb_connected"], bool)
    assert isinstance(data["vector_store_ready"], bool)


def test_health_no_secret_values(client):
    """Health response must never contain key values."""
    resp = client.get("/health")
    body = resp.text
    for secret in ["gsk_testkey_groq", "testkey_gemini", "test-secret-token"]:
        assert secret not in body

