"""
tests/test_ingest.py — Idempotency and ingest pipeline tests.

Spec: ingesting the same URL twice yields ONE article and NO duplicate chunks.
All external calls (httpx, trafilatura, Chroma) are mocked.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

VALID_TOKEN = "test-secret-token"


@pytest.mark.asyncio
async def test_ingest_idempotent_same_url(mock_mongo, mock_chroma, mock_embeddings):
    """
    Ingesting the same URL twice must result in:
    - 1 article in DB (second run → duplicate count)
    - No duplicate Chroma documents
    """
    test_url = "https://example.com/article-idempotent"
    investigation_id = "inv_idem_test"

    fake_text = "This is the article text. " * 50

    with patch("app.rag.ingest._extract_text", new_callable=AsyncMock) as mock_extract, \
         patch("app.rag.store.add_documents") as mock_add:
        mock_extract.return_value = (fake_text, "full")
        mock_add.return_value = True

        from app.rag.ingest import ingest_articles

        # First ingest
        counts1 = await ingest_articles(
            investigation_id=investigation_id,
            urls=[test_url],
        )
        assert counts1["new"] == 1
        assert counts1["duplicate"] == 0

        # Second ingest — same URL
        counts2 = await ingest_articles(
            investigation_id=investigation_id,
            urls=[test_url],
        )
        assert counts2["duplicate"] == 1
        assert counts2["new"] == 0

        # add_documents called exactly once (first ingest only)
        assert mock_add.call_count == 1


@pytest.mark.asyncio
async def test_ingest_partial_on_extraction_failure(mock_mongo, mock_chroma):
    """When text extraction fails, article is stored with extraction_status=partial."""
    test_url = "https://example.com/broken-article"
    investigation_id = "inv_partial_test"

    with patch("app.rag.ingest._extract_text", new_callable=AsyncMock) as mock_extract, \
         patch("app.rag.store.add_documents") as mock_add:
        mock_extract.return_value = (None, "partial")

        from app.rag.ingest import ingest_articles

        counts = await ingest_articles(
            investigation_id=investigation_id,
            urls=[test_url],
        )

        # Partial: stored in DB but no Chroma embeddings
        assert counts["partial"] == 1
        mock_add.assert_not_called()


@pytest.mark.asyncio
async def test_ingest_multiple_urls(mock_mongo, mock_chroma, mock_embeddings):
    """Multiple distinct URLs → multiple new articles."""
    urls = [
        "https://example.com/article-a",
        "https://example.com/article-b",
        "https://example.com/article-c",
    ]
    investigation_id = "inv_multi_test"
    fake_text = "Article content here. " * 40

    with patch("app.rag.ingest._extract_text", new_callable=AsyncMock) as mock_extract, \
         patch("app.rag.store.add_documents") as mock_add:
        mock_extract.return_value = (fake_text, "full")
        mock_add.return_value = True

        from app.rag.ingest import ingest_articles

        counts = await ingest_articles(investigation_id=investigation_id, urls=urls)
        assert counts["new"] == 3
        assert counts["duplicate"] == 0
        assert mock_add.call_count == 3

