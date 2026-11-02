"""
conftest.py — Shared pytest fixtures.

All external dependencies (MongoDB, Chroma, Groq, Gemini, httpx) are mocked.
No real API keys are required or used in tests.
"""

from __future__ import annotations

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Inject dummy env vars BEFORE importing settings / app
# ---------------------------------------------------------------------------

os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017")
os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "test-secret-token")
os.environ.setdefault("GROQ_API_KEY", "gsk_testkey_groq")
os.environ.setdefault("GEMINI_API_KEY", "testkey_gemini")
os.environ.setdefault("GUARDIAN_API_KEY", "testkey_guardian")
os.environ.setdefault("FACTCHECK_API_KEY", "testkey_factcheck")

import app.config
import app.db
import app.embeddings
import app.llm
import app.main
import app.rag
import app.rag.ingest
import app.rag.retriever
import app.rag.store


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def mock_env():
    """Ensure .env security check doesn't block tests (no .env file in CI)."""
    with patch("app.config._check_env_file_not_tracked", return_value=None):
        yield


@pytest.fixture(scope="session")
def mock_mongo():
    """Replace pymongo with mongomock for all tests."""
    import mongomock

    with patch("app.db.MongoClient", mongomock.MongoClient):
        yield


@pytest.fixture(scope="session")
def mock_chroma():
    """Stub out Chroma so tests don't need a real vector store."""
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = []
    mock_store.add_documents.return_value = None

    with patch("app.rag.store._get_chroma_client", return_value=MagicMock()), \
         patch("app.rag.store.get_vector_store", return_value=mock_store), \
         patch("app.rag.store.vector_store_ready", return_value=True):
        yield mock_store


@pytest.fixture(scope="session")
def mock_embeddings():
    """Stub Gemini embeddings."""
    mock_emb = MagicMock()
    mock_emb.embed_documents.return_value = [[0.1] * 768]
    mock_emb.embed_query.return_value = [0.1] * 768

    with patch("app.embeddings.get_embeddings", return_value=mock_emb):
        yield mock_emb


@pytest.fixture(scope="session")
def client(mock_env, mock_mongo, mock_chroma, mock_embeddings):
    """Test client with all external deps mocked."""
    with patch("app.config._check_env_file_not_tracked", return_value=None), \
         patch("app.db.ping", return_value=True):
        from app.main import app

        with TestClient(app, raise_server_exceptions=False) as c:
            yield c


VALID_TOKEN = "test-secret-token"
INVALID_TOKEN = "wrong-token"
