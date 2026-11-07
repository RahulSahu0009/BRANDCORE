"""
M5-05 — Content Review API endpoints.

POST /api/workspaces/{workspace_id}/content/{content_version_id}/review — submit review decision
GET  /api/workspaces/{workspace_id}/content/{content_version_id}/review — list review decisions

Protected by require_workspace_access (read) or require_workspace_permission (write, admin).
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.auth.dependencies import require_workspace_access, require_workspace_permission
from app.domain.models import ReviewDecision, ReviewDecisionCreate, now_utc
from app.repositories.content_repo import ContentVersionRepository
from app.repositories.review_repo import ReviewDecisionRepository

router = APIRouter()


def _get_db(request: Request):
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=401, detail="Authentication unavailable")
    db = getattr(env, "DB", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    return db


VALID_DECISIONS = {"APPROVED", "CHANGES_REQUESTED", "REJECTED"}


@router.post(
    "/workspaces/{workspace_id}/content/{content_version_id}/review",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def submit_review(
    workspace_id: str,
    content_version_id: str,
    request: Request,
    user = Depends(require_workspace_permission("workspace_id", require_admin=True)),
):
    """Record a human review decision for a content version.

    Requires org:admin role. Creator cannot approve their own content.
    Never creates a Release Passport automatically — that is a separate step.
    """
    db = _get_db(request)
    body = await request.json()

    decision = body.get("decision", "").upper()
    if decision not in VALID_DECISIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid decision. Must be one of: {', '.join(sorted(VALID_DECISIONS))}",
        )

    notes = body.get("notes")
    if notes is not None and len(notes) > 1000:
        raise HTTPException(status_code=400, detail="Notes exceed 1000 characters")

    version_repo = ContentVersionRepository(db)
    version = await version_repo.get(content_version_id, workspace_id)
    if version is None:
        raise HTTPException(status_code=404, detail="Content version not found")

    # Rule: creator cannot be the approver for the same content version
    if version.submitted_by == user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Content creator cannot approve their own content",
        )

    review_repo = ReviewDecisionRepository(db)

    # Check for existing decision — never overwrite
    existing = await review_repo.list_by_version(content_version_id, workspace_id)
    if existing.total > 0:
        raise HTTPException(
            status_code=409,
            detail="A review decision already exists for this content version",
        )

    data = ReviewDecisionCreate(
        content_version_id=content_version_id,
        reviewer_id=user.user_id,
        reviewer_role=user.org_role or "member",
        decision=decision.lower(),
        rationale=body.get("rationale"),
        notes=notes,
        analysis_batch_id=body.get("analysis_batch_id"),
    )
    decision_record = await review_repo.create(
        f"rd-{uuid.uuid4()}", workspace_id, data
    )

    d = decision_record.model_dump() if hasattr(decision_record, "model_dump") else dict(decision_record)
    return {
        "review_decision_id": d["id"],
        "content_version_id": d["content_version_id"],
        "decision": decision,
        "reviewer_id": d["reviewer_id"],
        "reviewer_role": d["reviewer_role"],
        "created_at": d["created_at"],
    }


@router.get(
    "/workspaces/{workspace_id}/content/{content_version_id}/review",
    response_model=dict,
)
async def get_review(
    workspace_id: str,
    content_version_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """List review decisions for a content version."""
    db = _get_db(request)
    review_repo = ReviewDecisionRepository(db)
    result = await review_repo.list_by_version(content_version_id, workspace_id)
    decisions = []
    for d in result.items:
        dd = d.model_dump() if hasattr(d, "model_dump") else dict(d)
        decisions.append({
            "id": dd["id"],
            "content_version_id": dd["content_version_id"],
            "decision": dd["decision"].upper(),
            "reviewer_id": dd["reviewer_id"],
            "reviewer_role": dd["reviewer_role"],
            "rationale": dd.get("rationale"),
            "notes": dd.get("notes"),
            "created_at": dd["created_at"],
        })
    return {"decisions": decisions}
