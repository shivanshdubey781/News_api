"""
routers/sources.py — GET /sources/{investigation_id}

Returns the source log for an investigation.
?format=csv exports as a downloadable CSV file.
"""

from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from app.auth import require_internal_token
from app import db

router = APIRouter(tags=["sources"], dependencies=[Depends(require_internal_token)])


@router.get("/sources/{investigation_id}")
async def get_sources(
    investigation_id: str,
    format: str = Query(default="json", pattern="^(json|csv)$"),
):
    """
    Return the source log for an investigation.
    ?format=csv exports a CSV file suitable for academic citation tracking.
    """
    log = db.get_source_log(investigation_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sources found for this investigation.",
        )

    if format == "csv":
        return _as_csv(log, investigation_id)

    # Serialize datetime objects for JSON
    return _serialize(log)


def _serialize(log: List[dict]) -> List[dict]:
    out = []
    for entry in log:
        row = {}
        for k, v in entry.items():
            row[k] = v.isoformat() if isinstance(v, datetime) else v
        out.append(row)
    return out


def _as_csv(log: List[dict], investigation_id: str) -> StreamingResponse:
    fieldnames = ["url", "access_date", "outlet", "what_it_supports", "investigation_id"]
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for entry in log:
        row = {}
        for k in fieldnames:
            v = entry.get(k, "")
            row[k] = v.isoformat() if isinstance(v, datetime) else (v or "")
        writer.writerow(row)

    buf.seek(0)
    filename = f"sources_{investigation_id}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

