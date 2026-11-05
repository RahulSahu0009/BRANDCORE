"""
BRANDCORE domain models (Pydantic).

Shared Pydantic schemas used by repositories and services. All timestamps are
ISO 8601 UTC strings. Numeric values are carried as strings to avoid
floating-point precision loss (see candidate_claim.numeric_value_text).
"""
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


def new_id() -> str:
    return str(uuid4())


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


# ---------------------------------------------------------------------------
# Workspace
# ---------------------------------------------------------------------------
class Workspace(BaseModel):
    id: str
    name: str
    slug: str
    demo_flag: int = 0
    status: str = "active"
    created_at: str
    updated_at: str


class WorkspaceCreate(BaseModel):
    name: str = Field(max_length=200)
    slug: str = Field(max_length=100)
    demo_flag: int = 0
    status: str = "active"


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# Policy
# ---------------------------------------------------------------------------
class Policy(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    rules_json: str
    version: int = 1
    status: str = "active"
    previous_version_id: Optional[str] = None
    created_by: str
    created_at: str


# ---------------------------------------------------------------------------
# Terminology
# ---------------------------------------------------------------------------
class Terminology(BaseModel):
    id: str
    workspace_id: str
    term: str
    status: str = "approved"  # 'approved' | 'denied' | 'preferred'
    notes: Optional[str] = None
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Approved fact
# ---------------------------------------------------------------------------
class ApprovedFact(BaseModel):
    id: str
    workspace_id: str
    claim_text: str
    numeric_value: Optional[str] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    scope: Optional[str] = None  # JSON string
    version: int = 1
    status: str = "active"
    previous_version_id: Optional[str] = None
    created_by: str
    created_at: str


class ApprovedFactCreate(BaseModel):
    claim_text: str = Field(max_length=2000)
    numeric_value: Optional[str] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    scope: Optional[str] = None  # JSON string
    evidence_ids: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Evidence
# ---------------------------------------------------------------------------
class Evidence(BaseModel):
    id: str
    workspace_id: str
    title: str
    source_type: str
    summary: str
    source_url: Optional[str] = None
    version: int = 1
    status: str = "active"
    created_at: str


class EvidenceCreate(BaseModel):
    title: str = Field(max_length=200)
    source_type: str
    summary: str = Field(max_length=2000)
    source_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Content item / version
# ---------------------------------------------------------------------------
class ContentItem(BaseModel):
    id: str
    workspace_id: str
    title: str
    status: str = "active"
    created_by: str
    created_at: str
    updated_at: str


class ContentItemCreate(BaseModel):
    title: str = Field(max_length=200)
    status: str = "active"


class ContentVersion(BaseModel):
    id: str
    workspace_id: str
    content_item_id: str
    version_number: int
    body_text: str
    sha256_hash: str
    submitted_by: str
    created_at: str


class ContentVersionCreate(BaseModel):
    content_item_id: str
    body_text: str = Field(max_length=10000)
    submitted_by: str


# ---------------------------------------------------------------------------
# Candidate claim
# ---------------------------------------------------------------------------
class CandidateClaim(BaseModel):
    id: str
    workspace_id: str
    content_version_id: str
    claim_text: str
    claim_type: Optional[str] = None
    numeric_value_text: Optional[str] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    scope: Optional[str] = None  # JSON string
    extraction_batch_id: str
    extracted_by: str
    extracted_at: str


class CandidateClaimCreate(BaseModel):
    content_version_id: str
    claim_text: str
    claim_type: Optional[str] = None
    numeric_value_text: Optional[str] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    scope: Optional[str] = None  # JSON string
    extraction_batch_id: str
    extracted_by: str


# ---------------------------------------------------------------------------
# Verification finding
# ---------------------------------------------------------------------------
class VerificationFinding(BaseModel):
    id: str
    workspace_id: str
    content_version_id: str
    claim_id: Optional[str] = None
    finding_type: str
    severity: str
    explanation: str
    suggested_correction: Optional[str] = None
    analysis_batch_id: str
    created_at: str


class VerificationFindingCreate(BaseModel):
    content_version_id: str
    claim_id: Optional[str] = None
    finding_type: str
    severity: str
    explanation: str
    suggested_correction: Optional[str] = None
    analysis_batch_id: str


# ---------------------------------------------------------------------------
# Review decision
# ---------------------------------------------------------------------------
class ReviewDecision(BaseModel):
    id: str
    workspace_id: str
    content_version_id: str
    reviewer_id: str
    reviewer_role: str
    decision: str  # 'approved' | 'changes_requested' | 'rejected'
    rationale: Optional[str] = None
    notes: Optional[str] = None
    analysis_batch_id: Optional[str] = None
    created_at: str


class ReviewDecisionCreate(BaseModel):
    content_version_id: str
    reviewer_id: str
    reviewer_role: str
    decision: str
    rationale: Optional[str] = None
    notes: Optional[str] = None
    analysis_batch_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Release passport
# ---------------------------------------------------------------------------
class ReleasePassport(BaseModel):
    id: str
    workspace_id: str
    content_item_id: str
    content_version_id: str
    content_sha256: str
    policy_version_id: str
    fact_evidence_versions: str  # JSON string
    finding_ids_and_dispositions: str  # JSON string
    approver_id: str
    approver_role: str
    decision_timestamp: str
    audit_reference: Optional[str] = None
    status: str = "valid"  # 'valid' | 'stale' | 'revoked' | 'invalid'
    created_at: str


class ReleasePassportCreate(BaseModel):
    content_version_id: str
    content_sha256: str
    policy_version_id: str
    fact_evidence_versions: str  # JSON string
    finding_ids_and_dispositions: str  # JSON string
    approver_id: str
    approver_role: str
    decision_timestamp: str
    audit_reference: Optional[str] = None


# ---------------------------------------------------------------------------
# Release status event
# ---------------------------------------------------------------------------
class ReleaseStatusEvent(BaseModel):
    id: str
    workspace_id: str
    passport_id: str
    passport_workspace: str
    status: str  # 'pending' | 'approved' | 'released' | 'stale' | 'revoked' | 'invalid'
    reason: str
    timestamp: str


class ReleaseStatusEventCreate(BaseModel):
    passport_id: str
    passport_workspace: str
    status: str
    reason: str
    timestamp: str


# ---------------------------------------------------------------------------
# Audit event
# ---------------------------------------------------------------------------
class AuditEvent(BaseModel):
    id: str
    workspace_id: str
    actor_id: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None  # JSON string
    correlation_id: Optional[str] = None
    created_at: str


class AuditEventCreate(BaseModel):
    workspace_id: str
    actor_id: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None  # JSON string
    correlation_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Claim-fact dependency
# ---------------------------------------------------------------------------
class ClaimFactDependency(BaseModel):
    id: str
    workspace_id: str
    claim_id: str
    claim_workspace: str
    fact_id: str
    fact_workspace: str
    dependency_type: str  # 'supports' | 'references'
    created_at: str


class ClaimFactDependencyCreate(BaseModel):
    claim_id: str
    claim_workspace: str
    fact_id: str
    fact_workspace: str
    dependency_type: str = "supports"


# ---------------------------------------------------------------------------
# Stale release result
# ---------------------------------------------------------------------------
class StaleRelease(BaseModel):
    passport_id: str
    workspace_id: str
    content_version_id: str
    content_sha256: str
    status: str
    stale_reason: str
    stale_since: str
    changed_dependency: str  # e.g. 'approved_fact', 'policy', 'evidence'


# Generic list wrapper for repository list operations.
class ListResult(BaseModel):
    items: list[Any]
    total: int
