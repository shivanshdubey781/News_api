"""
auth.py — Internal token authentication dependency.

Every endpoint except /health MUST call `require_internal_token`.
Uses hmac.compare_digest for constant-time comparison to prevent timing attacks.
Missing or incorrect token returns 401.
Keys are NEVER included in error messages, logs, or tracebacks.
"""

from __future__ import annotations

import hmac
import logging
from typing import Optional

from fastapi import Header, HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


async def require_internal_token(
    x_internal_token: Optional[str] = Header(default=None, alias="X-Internal-Token"),
) -> None:
    """
    FastAPI dependency. Raises 401 if the header is missing or wrong.
    Uses constant-time comparison to prevent timing-based secret leaks.
    """
    if not x_internal_token:
        logger.warning("Rejected request with missing internal token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service token.",
        )

    expected = settings.internal_service_token.get_secret_value()
    provided = x_internal_token

    # Both sides encoded to bytes for hmac.compare_digest
    match = hmac.compare_digest(
        expected.encode("utf-8"),
        provided.encode("utf-8"),
    )
    if not match:
        logger.warning("Rejected request with invalid internal token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service token.",
        )
