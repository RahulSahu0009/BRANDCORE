"""
M5-05 — Evidence API endpoints.

GET /api/workspaces/{workspace_id}/evidence          — list evidence
GET /api/workspaces/{workspace_id}/evidence/{evidence_id} — get evidence

Protected by require_workspace_access.
"""
from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth.dependencies import require_workspace_access
from app.domain.models import Evidence
from app.repositories.evidence_repo import EvidenceRepository

router = APIRouter()


def _get_db(request: Request):
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=401, detail="Authentication unavailable")
    db = getattr(env, "DB", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    return db


@router.get("/workspaces/{workspace_id}/evidence", response_model=dict)
async def list_evidence(
    workspace_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """List evidence records for a workspace."""
    db = _get_db(request)
    repo = EvidenceRepository(db)
    result = await repo.list_by_workspace(workspace_id)
    items = []
    for e in result.items:
        d = e.model_dump() if hasattr(e, "model_dump") else dict(e)
        items.append({
            "id": d["id"],
            "workspace_id": d["workspace_id"],
            "title": d["title"],
            "source_type": d["source_type"],
            "summary": d["summary"],
            "source_url": d.get("source_url"),
            "version": d["version"],
            "status": d["status"],
            "created_at": d["created_at"],
        })
    return {"evidence": items}


@router.get("/workspaces/{workspace_id}/evidence/{evidence_id}", response_model=dict)
async def get_evidence(
    workspace_id: str,
    evidence_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """Get a single evidence record by ID."""
    db = _get_db(request)
    repo = EvidenceRepository(db)
    evidence = await repo.get(evidence_id, workspace_id)
    if evidence is None:
        raise HTTPException(status_code=404, detail="Evidence not found")
    d = evidence.model_dump() if hasattr(evidence, "model_dump") else dict(evidence)
    return {
        "id": d["id"],
        "workspace_id": d["workspace_id"],
        "title": d["title"],
        "source_type": d["source_type"],
        "summary": d["summary"],
        "source_url": d.get("source_url"),
        "version": d["version"],
        "status": d["status"],
        "created_at": d["created_at"],
    }
