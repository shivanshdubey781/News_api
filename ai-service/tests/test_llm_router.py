"""
tests/test_llm_router.py — LLM routing tests.

Spec:
- Short task → Groq
- Long input (token count > threshold) → Gemini
- Fallback triggers on simulated 429
All LLM classes are mocked — no real API calls.
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch
from langchain_core.runnables import RunnableLambda

import app.llm as llm_module


def _mock_groq():
    m = MagicMock()
    m.with_fallbacks.return_value = m
    m.with_structured_output.return_value = m
    return m


def _mock_gemini():
    m = MagicMock()
    m.with_fallbacks.return_value = m
    m.with_structured_output.return_value = m
    return m


def test_short_task_prefers_groq():
    """CLASSIFY task (short) → Groq is primary."""
    groq_mock = _mock_groq()
    gemini_mock = _mock_gemini()

    with patch("app.llm._build_groq", return_value=groq_mock), \
         patch("app.llm._build_gemini", return_value=gemini_mock):
        llm_module.get_llm(llm_module.TaskType.CLASSIFY, estimated_tokens=100)
        groq_mock.with_fallbacks.assert_called_once_with([gemini_mock])


def test_long_task_prefers_gemini():
    """COMPARE task (long-context) → Gemini is primary."""
    groq_mock = _mock_groq()
    gemini_mock = _mock_gemini()

    with patch("app.llm._build_groq", return_value=groq_mock), \
         patch("app.llm._build_gemini", return_value=gemini_mock):
        llm_module.get_llm(llm_module.TaskType.COMPARE)
        gemini_mock.with_fallbacks.assert_called_once_with([groq_mock])


def test_high_token_count_routes_to_gemini():
    """Even a SHORT task type routes to Gemini if token count exceeds threshold."""
    groq_mock = _mock_groq()
    gemini_mock = _mock_gemini()

    with patch("app.llm._build_groq", return_value=groq_mock), \
         patch("app.llm._build_gemini", return_value=gemini_mock), \
         patch.object(llm_module.settings, "long_context_token_threshold", 100):
        llm_module.get_llm(
            llm_module.TaskType.CLASSIFY,
            estimated_tokens=5000,  # Way above threshold
        )
        gemini_mock.with_fallbacks.assert_called_with([groq_mock])


def test_no_provider_raises_runtime_error():
    """If both providers are unavailable, get_llm raises RuntimeError."""
    with patch("app.llm._build_groq", return_value=None), \
         patch("app.llm._build_gemini", return_value=None):
        with pytest.raises(RuntimeError, match="No LLM provider"):
            llm_module.get_llm(llm_module.TaskType.CLASSIFY)


def test_groq_only_works_without_gemini():
    """If only Groq is available, get_llm returns Groq directly (no fallback chain)."""
    groq_mock = _mock_groq()

    with patch("app.llm._build_groq", return_value=groq_mock), \
         patch("app.llm._build_gemini", return_value=None):
        result = llm_module.get_llm(llm_module.TaskType.CLASSIFY)
        assert result is groq_mock


def test_fallback_triggers_on_simulated_429():
    """Simulate a 429 RateLimit on Groq and verify execution falls back to Gemini."""
    def fail_with_429(_input):
        raise RuntimeError("429 Too Many Requests: Rate limit reached")

    def succeed_gemini(_input):
        return "response from gemini fallback"

    groq_fail = RunnableLambda(fail_with_429)
    gemini_succeed = RunnableLambda(succeed_gemini)

    with patch("app.llm._build_groq", return_value=groq_fail), \
         patch("app.llm._build_gemini", return_value=gemini_succeed):
        chain = llm_module.get_llm(llm_module.TaskType.CLASSIFY, estimated_tokens=50)
        res = chain.invoke("test prompt")
        assert res == "response from gemini fallback"
