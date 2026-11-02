"""
tests/test_config.py — Config and secret-safety tests.

Spec requirements:
- Service degrades correctly when keys are missing.
- Keys NEVER appear in repr() or logs.
"""

from __future__ import annotations

import os
from unittest.mock import patch


def test_secret_str_not_in_repr():
    """SecretStr values must not appear in repr()."""
    from pydantic import SecretStr

    s = SecretStr("super-secret-key-12345")
    r = repr(s)
    assert "super-secret-key-12345" not in r, "Secret appeared in repr()!"


def test_groq_available_when_key_present():
    """groq_available must be True when GROQ_API_KEY is set."""
    env = {
        "GROQ_API_KEY": "gsk_testvalue",
        "GEMINI_API_KEY": "",
        "MONGODB_URI": "mongodb://localhost:27017",
        "INTERNAL_SERVICE_TOKEN": "tok",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload
        import app.config as cfg_module
        reload(cfg_module)
        s = cfg_module.Settings()
        assert s.groq_available is True


def test_groq_unavailable_when_key_missing():
    """groq_available must be False when GROQ_API_KEY is empty."""
    env = {
        "GROQ_API_KEY": "",
        "MONGODB_URI": "mongodb://localhost:27017",
        "INTERNAL_SERVICE_TOKEN": "tok",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload
        import app.config as cfg_module
        reload(cfg_module)
        s = cfg_module.Settings(_env_file=None)
        assert s.groq_available is False


def test_gemini_unavailable_when_key_missing():
    """gemini_available must be False when GEMINI_API_KEY is empty."""
    env = {
        "GEMINI_API_KEY": "",
        "MONGODB_URI": "mongodb://localhost:27017",
        "INTERNAL_SERVICE_TOKEN": "tok",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload
        import app.config as cfg_module
        reload(cfg_module)
        s = cfg_module.Settings(_env_file=None)
        assert s.gemini_available is False


def test_settings_keys_not_in_str():
    """String representation of Settings must not expose any secret value."""
    from app.config import settings

    s = str(settings)
    # These are test values — ensure they are masked
    for placeholder in ["gsk_testkey_groq", "testkey_gemini", "testkey_guardian", "test-secret-token"]:
        assert placeholder not in s, f"Secret '{placeholder}' leaked in Settings str!"

