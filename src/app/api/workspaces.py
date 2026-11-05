"""
M5-05 — Workspace API endpoints.

GET /api/workspaces                              — List workspaces for the user's org
GET /api/workspaces/{workspace_id}               — Returns workspace information.
Protected by Clerk authentication + workspace authorization.
"""
from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.dependencies import require_development_env
from app.auth.dependencies import (
    require_workspace_access,
    get_current_clerk_user,
    WorkspaceOrgMappingRepository,
)
from app.domain.models import Workspace
from app.repositories.workspace_repo import WorkspaceRepository
from typing import List

router = APIRouter()


@router.get("/workspaces", response_model=dict)
async def list_workspaces(
    request: Request,
    user = Depends(get_current_clerk_user),
):
    """List workspaces accessible to the authenticated user's Clerk organization."""
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=401, detail="Authentication unavailable")
    db = getattr(env, "DB", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    if not user.has_organization:
        return {"workspaces": []}

    mapping_repo = WorkspaceOrgMappingRepository(db)
    org_id = user.org_id
    workspace_id = await mapping_repo.get_workspace_id_by_org_id(org_id)

    workspaces = []
    if workspace_id:
        workspace = await WorkspaceRepository(db).get(workspace_id)
        if workspace:
            d = workspace.model_dump() if hasattr(workspace, "model_dump") else dict(workspace)
            workspaces.append({
                "id": d["id"],
                "name": d["name"],
                "slug": d.get("slug"),
                "org_id": org_id,
            })

    return {"workspaces": workspaces}


@router.get("/workspaces/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
) -> Workspace:
    """Return workspace information for the authenticated user's organization."""
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=401, detail="Authentication unavailable")
    db = getattr(env, "DB", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    repo = WorkspaceRepository(db)
    workspace = await repo.get(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace
