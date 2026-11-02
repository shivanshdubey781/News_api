"""
tests/test_retrieval.py — Retrieval always includes url/outlet/date metadata.
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document


def _make_doc(url, outlet, published_at="2024-01-15", content="Some news text here."):
    return Document(
        page_content=content,
        metadata={
            "url": url,
            "outlet": outlet,
            "published_at": published_at,
            "title": "Test Article",
            "source_type": "wire",
            "investigation_id": "inv_test",
            "chunk_id": f"{url}_0",
            "article_id": "abc123",
        },
    )


def test_retrieve_results_include_url_outlet_date(mock_chroma, mock_embeddings):
    """
    Every retrieved Document must carry url, outlet, and published_at in metadata.
    """
    docs = [
        _make_doc("https://bbc.com/news/1", "BBC", "2024-01-10"),
        _make_doc("https://reuters.com/news/2", "Reuters", "2024-01-11"),
    ]
    mock_chroma.similarity_search.return_value = docs

    with patch("app.rag.retriever.get_vector_store", return_value=mock_chroma):
        from app.rag.retriever import retrieve

        results = retrieve("test query", investigation_id="inv_test")

    for doc in results:
        assert "url" in doc.metadata and doc.metadata["url"]
        assert "outlet" in doc.metadata and doc.metadata["outlet"]
        assert "published_at" in doc.metadata


def test_docs_to_citations_deduplicates():
    """docs_to_citations must not return duplicate URLs."""
    url = "https://bbc.com/news/same-story"
    docs = [
        _make_doc(url, "BBC", "2024-01-10"),
        _make_doc(url, "BBC", "2024-01-10"),  # duplicate
    ]
    from app.rag.retriever import docs_to_citations

    citations = docs_to_citations(docs)
    assert len(citations) == 1


def test_docs_to_citations_snippet_max_25_words():
    """Citation quote_snippet must be ≤ 25 words."""
    long_text = " ".join([f"word{i}" for i in range(100)])
    docs = [_make_doc("https://example.com/long", "Example", content=long_text)]

    from app.rag.retriever import docs_to_citations

    citations = docs_to_citations(docs)
    assert len(citations) == 1
    snippet = citations[0].quote_snippet or ""
    words = snippet.rstrip("…").split()
    assert len(words) <= 25


def test_format_context_includes_outlet_and_url():
    """format_context output must contain outlet names and URLs for LLM citation."""
    docs = [
        _make_doc("https://theguardian.com/article/1", "The Guardian"),
    ]
    from app.rag.retriever import format_context

    context = format_context(docs)
    assert "The Guardian" in context
    assert "https://theguardian.com/article/1" in context

