"""
M5-05 â€” Release API endpoints.

GET /api/workspaces/{workspace_id}/releases                              â€” list releases
GET /api/workspaces/{workspace_id}/releases/{release_id}                 â€” get release
GET /api/workspaces/{workspace_id}/releases/{release_id}/stale-impact    â€” stale impact

Protected by require_workspace_access.
"""
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth.dependencies import require_workspace_access
from app.domain.models import StaleRelease
from app.repositories.passport_repo import ReleasePassportRepository
from app.repositories.event_repo import ReleaseStatusEventRepository
from app.repositories.stale_detection_repo import StaleDetectionRepository

router = APIRouter()


def _get_db(request: Request):
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=401, detail="Authentication unavailable")
    db = getattr(env, "DB", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    return db


@router.get("/workspaces/{workspace_id}/releases", response_model=dict)
async def list_releases(
    workspace_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """List release passports for a workspace."""
    db = _get_db(request)
    repo = ReleasePassportRepository(db)
    result = await repo.list_by_workspace(workspace_id)
    releases = []
    for p in result.items:
        d = p.model_dump() if hasattr(p, "model_dump") else dict(p)
        releases.append({
            "id": d["id"],
            "workspace_id": d["workspace_id"],
            "content_version_id": d["content_version_id"],
            "content_sha256": d["content_sha256"],
            "status": d["status"],
            "approved_at": d["created_at"],
            "approver_id": d.get("approver_id"),
            "policy_version_id": d.get("policy_version_id"),
        })
    return {"releases": releases}


@router.get("/workspaces/{workspace_id}/releases/{release_id}", response_model=dict)
async def get_release(
    workspace_id: str,
    release_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """Get a single release passport by ID."""
    db = _get_db(request)
    repo = ReleasePassportRepository(db)
    passport = await repo.get(release_id, workspace_id)
    if passport is None:
        raise HTTPException(status_code=404, detail="Release not found")
    d = passport.model_dump() if hasattr(passport, "model_dump") else dict(passport)
    return {
        "id": d["id"],
        "workspace_id": d["workspace_id"],
        "content_item_id": d["content_item_id"],
        "content_version_id": d["content_version_id"],
        "content_sha256": d["content_sha256"],
        "status": d["status"],
        "approved_at": d["created_at"],
        "approver_id": d.get("approver_id"),
        "approver_role": d.get("approver_role"),
        "decision_timestamp": d.get("decision_timestamp"),
        "policy_version_id": d.get("policy_version_id"),
    }


@router.get(
    "/workspaces/{workspace_id}/releases/{release_id}/stale-impact",
    response_model=dict,
)
async def get_stale_impact(
    workspace_id: str,
    release_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """Return stale impact explanation for a release.

    Explains whether the release is stale, what changed, and why revalidation is required.
    """
    db = _get_db(request)

    # Verify the release exists in this workspace
    passport_repo = ReleasePassportRepository(db)
    passport = await passport_repo.get(release_id, workspace_id)
    if passport is None:
        raise HTTPException(status_code=404, detail="Release not found")

    p = passport.model_dump() if hasattr(passport, "model_dump") else dict(passport)

    # Run stale detection for this workspace
    stale_repo = StaleDetectionRepository(db)
    stale_releases = await stale_repo.find_stale_releases_detailed(workspace_id)

    # Find this specific release in the stale list
    stale_entry = None
    for s in stale_releases:
        if s.passport_id == release_id:
            stale_entry = s
            break

    # Also get status events for this release
    event_repo = ReleaseStatusEventRepository(db)
    events_result = await event_repo.list_for_passport(release_id, workspace_id)
    events = []
    for e in events_result.items:
        ed = e.model_dump() if hasattr(e, "model_dump") else dict(e)
        events.append({
            "id": ed["id"],
            "status": ed["status"],
            "reason": ed["reason"],
            "timestamp": ed["timestamp"],
        })

    is_stale = stale_entry is not None

    return {
        "release_id": release_id,
        "workspace_id": workspace_id,
        "status": "STALE" if is_stale else p["status"].upper(),
        "content_version_id": p["content_version_id"],
        "content_sha256": p["content_sha256"],
        "stale_reason": stale_entry.stale_reason if is_stale else None,
        "stale_since": stale_entry.stale_since if is_stale else None,
        "changed_dependency": stale_entry.changed_dependency if is_stale else None,
        "revalidation_required": is_stale,
        "status_events": events,
    }
