"""
M5-05 — Workspace API endpoints.

GET /api/workspaces/{workspace_id} — Returns workspace information.
Protected by require_workspace_access.
"""
from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.dependencies import require_development_env
from app.auth.dependencies import require_workspace_access, get_current_clerk_user
from app.domain.models import Workspace
from app.repositories.workspace_repo import WorkspaceRepository

router = APIRouter()


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
