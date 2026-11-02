"""
config.py — Settings loaded from environment via pydantic-settings.

Rules enforced here:
- Every secret is a SecretStr — it will NEVER appear in repr/logs.
- Required keys: MONGODB_URI, INTERNAL_SERVICE_TOKEN.
- LLM keys are optional at load time; degraded-mode flags are computed at startup.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_BASE_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        # Do NOT echo extra fields — keeps secrets safe
        extra="ignore",
    )

    # ---------- LLM providers (optional — service may degrade) ----------
    groq_api_key: Optional[SecretStr] = Field(default=None)
    gemini_api_key: Optional[SecretStr] = Field(default=None)

    # ---------- External APIs (optional per-feature) ----------
    guardian_api_key: Optional[SecretStr] = Field(default=None)
    factcheck_api_key: Optional[SecretStr] = Field(default=None)

    # ---------- Required infrastructure ----------
    mongodb_uri: SecretStr = Field(...)
    internal_service_token: SecretStr = Field(...)

    # ---------- Model names (configurable so free-tier names can change) ----------
    groq_model: str = Field(default="llama-3.3-70b-versatile")
    gemini_model: str = Field(default="gemini-1.5-pro-002")
    gemini_embedding_model: str = Field(default="models/text-embedding-004")

    # ---------- Storage ----------
    chroma_dir: str = Field(default="./chroma_data")

    # ---------- Behaviour ----------
    log_level: str = Field(default="INFO")
    long_context_token_threshold: int = Field(default=3000)
    max_retries: int = Field(default=3)
    http_timeout: float = Field(default=20.0)
    retrieval_k: int = Field(default=8)

    # ---------- Computed degraded-mode flags (never exposed to client) ----------
    groq_available: bool = False
    gemini_available: bool = False

    @model_validator(mode="after")
    def _compute_availability(self) -> "Settings":
        self.groq_available = self.groq_api_key is not None and bool(
            self.groq_api_key.get_secret_value()
        )
        self.gemini_available = self.gemini_api_key is not None and bool(
            self.gemini_api_key.get_secret_value()
        )
        return self


def _check_env_file_not_tracked() -> None:
    """Fail loudly at startup if .env would be committed to git."""
    env_paths = [_BASE_DIR / ".env", Path(".env")]
    env_path = next((p for p in env_paths if p.exists()), None)
    if not env_path:
        return
    for gi in [_BASE_DIR / ".gitignore", _BASE_DIR.parent / ".gitignore", Path(".gitignore")]:
        if gi.exists():
            patterns = gi.read_text(encoding="utf-8").splitlines()
            if any(p.strip().startswith(".env") for p in patterns):
                return  # .env is ignored — safe
    # Also check .git/info/exclude
    git_exclude = _BASE_DIR.parent / ".git" / "info" / "exclude"
    if git_exclude.exists():
        patterns = git_exclude.read_text(encoding="utf-8").splitlines()
        if any(p.strip().startswith(".env") for p in patterns):
            return
    raise RuntimeError(
        "SECURITY: '.env' file exists but is NOT listed in .gitignore. "
        "Add '.env' to .gitignore before starting the service."
    )


# Singleton — import `settings` everywhere else
settings = Settings()

