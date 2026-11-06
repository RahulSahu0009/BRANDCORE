"""
M5-05 — Approved Facts API endpoints.

GET    /api/workspaces/{workspace_id}/facts        — list facts
POST   /api/workspaces/{workspace_id}/facts        — create fact
GET    /api/workspaces/{workspace_id}/facts/{fact_id} — get fact
PATCH  /api/workspaces/{workspace_id}/facts/{fact_id} — update fact (new version)

Protected by require_workspace_access.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.domain.models import (
    ApprovedFact, ApprovedFactCreate, ListResult,
)
from app.repositories.base import SqliteD1Wrapper
from app.repositories.evidence_repo import EvidenceRepository
from app.repositories.fact_repo import ApprovedFactRepository
from app.auth.dependencies import require_workspace_access

router = APIRouter()


def _get_db(request: Request):
    env = request.scope.get("env")
    if env is None:
        raise HTTPException(status_code=401, detail="Authentication unavailable")
    db = getattr(env, "DB", None)
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    return db


@router.get("/workspaces/{workspace_id}/facts", response_model=dict)
async def list_facts(
    workspace_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """List approved facts for a workspace."""
    db = _get_db(request)
    repo = ApprovedFactRepository(db)
    result = await repo.list_by_workspace(workspace_id)
    facts = []
    for f in result.items:
        d = f.model_dump() if hasattr(f, "model_dump") else dict(f)
        # Parse scope JSON string into object for frontend compatibility
        scope = d.get("scope")
        if isinstance(scope, str):
            import json
            try:
                d["scope"] = json.loads(scope)
            except Exception:
                d["scope"] = None
        evidence_id = await repo.get_evidence_id(d["id"], workspace_id)
        facts.append({
            "id": d["id"],
            "workspace_id": d["workspace_id"],
            "text": d["claim_text"],
            "scope": d.get("scope"),
            "qualifier": d.get("qualifier"),
            "evidence_id": evidence_id,
            "version": d["version"],
            "created_at": d["created_at"],
            "status": d["status"],
        })
    return {"facts": facts}


@router.post("/workspaces/{workspace_id}/facts", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_fact(
    workspace_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """Create a new approved fact with evidence reference."""
    from app.domain.models import now_utc
    import uuid
    import json

    db = _get_db(request)
    body = await request.json()

    claim_text = body.get("text", "").strip()
    if not claim_text:
        raise HTTPException(status_code=400, detail="Claim text is required")
    if len(claim_text) > 2000:
        raise HTTPException(status_code=400, detail="Claim text exceeds 2000 characters")

    evidence_id = body.get("evidence_id")
    if not evidence_id:
        raise HTTPException(status_code=400, detail="Evidence reference is required")

    # Validate evidence belongs to this workspace
    evidence_repo = EvidenceRepository(db)
    evidence = await evidence_repo.get(evidence_id, workspace_id)
    if evidence is None:
        raise HTTPException(status_code=400, detail="Evidence not found in this workspace")

    scope = body.get("scope")
    if isinstance(scope, dict):
        scope = json.dumps(scope)

    fact_id = f"fact-{uuid.uuid4()}"
    data = ApprovedFactCreate(
        claim_text=claim_text,
        numeric_value=body.get("numeric_value"),
        unit=body.get("unit"),
        qualifier=body.get("qualifier"),
        scope=scope,
        evidence_ids=[evidence_id] if evidence_id else [],
    )

    fact_repo = ApprovedFactRepository(db)
    fact = await fact_repo.create(fact_id, workspace_id, data)

    # Link evidence to fact
    await fact_repo.link_evidence(fact_id, workspace_id, evidence_id)

    # Audit event
    audit_id = f"audit-{uuid.uuid4()}"
    await db.prepare(
        """
        INSERT INTO audit_event
            (id, workspace_id, actor_id, actor_role, action, entity_type,
             entity_id, details, correlation_id, created_at)
        VALUES (?, ?, ?, ?, 'create_fact', 'approved_fact', ?, ?, ?, ?)
        """,
    ).bind(
        audit_id, workspace_id, user.user_id, user.org_role or "member",
        fact_id, json.dumps({"claim_text": claim_text, "evidence_id": evidence_id}),
        fact_id, now_utc(),
    ).run()

    d = fact.model_dump() if hasattr(fact, "model_dump") else dict(fact)
    scope_val = d.get("scope")
    if isinstance(scope_val, str):
        try:
            scope_val = json.loads(scope_val)
        except Exception:
            scope_val = None

    return {
        "id": d["id"],
        "workspace_id": d["workspace_id"],
        "text": d["claim_text"],
        "scope": scope_val,
        "qualifier": d.get("qualifier"),
        "evidence_id": evidence_id,
        "version": d["version"],
        "created_at": d["created_at"],
        "status": d["status"],
    }


@router.get("/workspaces/{workspace_id}/facts/{fact_id}", response_model=dict)
async def get_fact(
    workspace_id: str,
    fact_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """Get a single approved fact by ID."""
    db = _get_db(request)
    repo = ApprovedFactRepository(db)
    fact = await repo.get(fact_id, workspace_id)
    if fact is None:
        raise HTTPException(status_code=404, detail="Fact not found")
    d = fact.model_dump() if hasattr(fact, "model_dump") else dict(fact)
    scope_val = d.get("scope")
    if isinstance(scope_val, str):
        import json
        try:
            scope_val = json.loads(scope_val)
        except Exception:
            scope_val = None
    return {
        "id": d["id"],
        "workspace_id": d["workspace_id"],
        "text": d["claim_text"],
        "scope": scope_val,
        "qualifier": d.get("qualifier"),
        "evidence_id": d.get("evidence_id"),
        "version": d["version"],
        "created_at": d["created_at"],
        "status": d["status"],
    }


@router.patch("/workspaces/{workspace_id}/facts/{fact_id}", response_model=dict)
async def update_fact(
    workspace_id: str,
    fact_id: str,
    request: Request,
    user = Depends(require_workspace_access("workspace_id")),
):
    """Update an approved fact — creates a new version, retires the previous head."""
    import json
    from app.domain.models import ApprovedFactCreate

    db = _get_db(request)
    body = await request.json()

    claim_text = body.get("text", "").strip()
    if not claim_text:
        raise HTTPException(status_code=400, detail="Claim text is required")

    evidence_id = body.get("evidence_id")
    if evidence_id:
        evidence_repo = EvidenceRepository(db)
        evidence = await evidence_repo.get(evidence_id, workspace_id)
        if evidence is None:
            raise HTTPException(status_code=400, detail="Evidence not found in this workspace")

    scope = body.get("scope")
    if isinstance(scope, dict):
        scope = json.dumps(scope)

    data = ApprovedFactCreate(
        claim_text=claim_text,
        numeric_value=body.get("numeric_value"),
        unit=body.get("unit"),
        qualifier=body.get("qualifier"),
        scope=scope,
        evidence_ids=[evidence_id] if evidence_id else [],
    )

    fact_repo = ApprovedFactRepository(db)
    updated = await fact_repo.update(fact_id, workspace_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Fact not found")

    if evidence_id:
        await fact_repo.link_evidence(fact_id, workspace_id, evidence_id)

    d = updated.model_dump() if hasattr(updated, "model_dump") else dict(updated)
    scope_val = d.get("scope")
    if isinstance(scope_val, str):
        try:
            scope_val = json.loads(scope_val)
        except Exception:
            scope_val = None
    return {
        "id": d["id"],
        "workspace_id": d["workspace_id"],
        "text": d["claim_text"],
        "scope": scope_val,
        "qualifier": d.get("qualifier"),
        "evidence_id": evidence_id,
        "version": d["version"],
        "created_at": d["created_at"],
        "status": d["status"],
    }
