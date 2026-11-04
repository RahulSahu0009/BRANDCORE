# BRANDCORE — API Contract

**Owner:** Mritunjay Singh · **Version:** 0.1.0 · **Status:** PROPOSED — not yet implemented
**Rule:** All endpoints are labelled PROPOSED until implemented and tested. Frontend may use mock fixtures until endpoints are available, but must remove mocks from the core workflow during integration.

---

## 1. Base URL

All API calls use relative paths. No hardcoded origins.

- Local dev: `http://localhost:8787/api`
- Production: `/api` (same Worker origin)

---

## 2. Error Format

All errors return:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "field": "optional_field_name"
  }
}
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `INTERNAL_ERROR`

Never expose stack traces, internal paths or secret values in error responses.

---

## 3. Endpoints

### 3.1 Health

#### `GET /api/health` — IMPLEMENTED (scaffold)

**Response 200:**
```json
{ "status": "ok", "version": "0.1.0" }
```

---

### 3.2 Workspace

#### `GET /api/workspaces/:workspace_id` — PROPOSED

**Response 200:**
```json
{
  "id": "ws_demo",
  "name": "Demo Brand",
  "demo": true
}
```

---

### 3.3 Approved Facts

#### `GET /api/workspaces/:workspace_id/facts` — PROPOSED

**Response 200:**
```json
{
  "facts": [
    {
      "id": "fact_001",
      "workspace_id": "ws_demo",
      "text": "Our product reduces energy consumption by up to 30% compared to the industry average.",
      "scope": { "product": "EcoWidget Pro", "region": "IN", "valid_until": "2027-06-30" },
      "qualifier": "up to",
      "evidence_id": "ev_001",
      "version": 1,
      "created_at": "2026-11-01T10:00:00Z"
    }
  ]
}
```

#### `POST /api/workspaces/:workspace_id/facts` — PROPOSED

**Request:**
```json
{
  "text": "string (required, max 2000 chars)",
  "scope": { "product": "string", "region": "string", "valid_until": "ISO date or null" },
  "qualifier": "string or null",
  "evidence_id": "string (required)"
}
```

**Response 201:** Created fact object (same shape as GET item)

---

### 3.4 Content

#### `POST /api/workspaces/:workspace_id/content` — PROPOSED

Submit a new content item. Creates an immutable content version.

**Request:**
```json
{
  "title": "string (required, max 200 chars)",
  "body_text": "string (required, max 10000 chars)"
}
```

**Response 201:**
```json
{
  "content_item_id": "ci_001",
  "content_version_id": "cv_001",
  "sha256_hash": "abc123...",
  "created_at": "2026-11-04T12:00:00Z"
}
```

#### `GET /api/workspaces/:workspace_id/content/:content_item_id/versions` — PROPOSED

**Response 200:**
```json
{
  "versions": [
    {
      "id": "cv_001",
      "version_number": 1,
      "sha256_hash": "abc123...",
      "created_at": "2026-11-04T12:00:00Z",
      "review_status": "PENDING"
    }
  ]
}
```

---

### 3.5 Claim Analysis

#### `POST /api/workspaces/:workspace_id/content/:content_version_id/analyze` — PROPOSED

Triggers AI claim extraction and deterministic checks. Returns findings.

**Response 200:**
```json
{
  "content_version_id": "cv_001",
  "claims": [
    {
      "id": "cl_001",
      "text": "Our product reduces energy consumption by 40%",
      "start_char": 10,
      "end_char": 58
    }
  ],
  "findings": [
    {
      "id": "fi_001",
      "claim_id": "cl_001",
      "finding_type": "NUMERIC_MISMATCH",
      "reason": "Claim states 40% but approved fact states up to 30%",
      "approved_fact_id": "fact_001",
      "evidence_id": "ev_001",
      "suggestion": "Change '40%' to 'up to 30%' to match the approved fact"
    }
  ]
}
```

Finding types: `UNSUPPORTED_CLAIM`, `NUMERIC_MISMATCH`, `CLAIM_STRONGER_THAN_EVIDENCE`, `MISSING_QUALIFIER`, `SCOPE_MISMATCH`, `EXPIRED_OFFER`, `UNAPPROVED_TERMINOLOGY`

---

### 3.6 Review Decision

#### `POST /api/workspaces/:workspace_id/content/:content_version_id/review` — PROPOSED

Record a human review decision. Server-side: creator cannot be the approver.

**Request:**
```json
{
  "decision": "APPROVED | CHANGES_REQUESTED | REJECTED",
  "reviewer_role": "reviewer",
  "notes": "string or null (max 1000 chars)"
}
```

**Response 201:**
```json
{
  "review_decision_id": "rd_001",
  "content_version_id": "cv_001",
  "decision": "APPROVED",
  "timestamp": "2026-11-04T13:00:00Z"
}
```

On `APPROVED`: a Release Passport is automatically created server-side.

---

### 3.7 Release Passports

#### `GET /api/workspaces/:workspace_id/releases` — PROPOSED

**Response 200:**
```json
{
  "releases": [
    {
      "id": "rp_001",
      "content_version_id": "cv_001",
      "content_sha256": "abc123...",
      "status": "VALID",
      "approved_at": "2026-11-04T13:00:00Z"
    }
  ]
}
```

#### `GET /api/workspaces/:workspace_id/releases/:release_id/stale-impact` — PROPOSED

Returns releases that became STALE due to a fact change.

**Response 200:**
```json
{
  "release_id": "rp_001",
  "status": "STALE",
  "stale_reason": "Approved fact fact_001 version 1 was superseded by version 2",
  "stale_since": "2026-11-04T14:00:00Z",
  "revalidation_required": true
}
```

---

## 4. Ownership

| Endpoint group | Owner | Notes |
|---------------|-------|-------|
| `/api/health` | Mritunjay | Implemented in scaffold |
| `/api/workspaces/*` | Mritunjay | All backend endpoints |
| Frontend API client (`frontend/src/services/api.js`) | Mritunjay (contract) / Rahul (implementation) | Contract decisions by Mritunjay |

---

## 5. Integration Rules

- API contract changes must be proposed by Mritunjay and communicated before frontend implementation depends on them.
- Rahul and Arvind may use clearly labelled mock fixtures (in `__mocks__/` or `fixtures/`) until endpoints are available.
- Mocks must be removed from the core workflow during integration (Milestone 6).
- All requests use relative `/api/*` paths. No hardcoded origins.
