-- BRANDCORE D1 migration 0003 — Content, claims and verification schema
-- Tables: content_item, content_version, candidate_claim, verification_finding
-- Depends on: migration 0002 (workspace, evidence, approved_fact, fact_evidence,
--           policy, terminology)
--
-- Design notes:
-- * Follows M2-01 conventions: TEXT UUIDs, ISO 8601 UTC timestamps as TEXT,
--   workspace-scoped composite FKs, ON DELETE RESTRICT on all business records.
-- * content_version is immutable: BEFORE UPDATE and BEFORE DELETE triggers abort
--   any mutation attempt with an explicit error message.
-- * content_version.body_text stores the content body in D1 (text content only,
--   per PRD §7 which excludes video/audio). R2 is reserved for evidence assets.
-- * candidate_claim.numeric_value_text stores the normalized string form of the
--   AI-extracted numeric_value (str|int|float|None -> TEXT|NULL), preserving
--   exact representation without floating-point conversion.
-- * verification_finding.claim_id is nullable: a finding may concern the whole
--   content version rather than a specific extracted claim. Composite FK
--   (claim_id, workspace_id) -> candidate_claim(id, workspace_id) enforces that
--   a referenced claim belongs to the same workspace; a trigger enforces it also
--   belongs to the same content_version.
-- * Finding types use snake_case matching the seven canonical types in PRD §5.
-- * PRAGMA foreign_keys = ON must be set per connection in the application layer.

-- ---------------------------------------------------------------------------
-- 1. content_item
-- ---------------------------------------------------------------------------
-- Logical content asset. Workspace-scoped. Versions are tracked in
-- content_version. Mutable fields (title, status) live here; immutable
-- snapshot fields live in content_version.
CREATE TABLE IF NOT EXISTS content_item (
    id              TEXT NOT NULL,
    workspace_id    TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    title           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'archived')),
    created_by      TEXT NOT NULL,      -- demo: role label; production: user id
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id)           -- required for composite FK from content_version
);

CREATE INDEX IF NOT EXISTS idx_content_item_workspace
    ON content_item (workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_item_workspace_status
    ON content_item (workspace_id, status);

-- ---------------------------------------------------------------------------
-- 2. content_version
-- ---------------------------------------------------------------------------
-- Immutable snapshot of a content item at a point in time.
-- Editing content creates a new version row; existing rows are never mutated.
-- Immutability is enforced by BEFORE UPDATE and BEFORE DELETE triggers below.
-- version_number is unique within a content_item (enforced by UNIQUE constraint).
-- body_text stores the full content body in D1 (text-only per PRD §7).
-- sha256_hash is the hex-encoded SHA-256 of body_text, computed server-side.
CREATE TABLE IF NOT EXISTS content_version (
    id              TEXT NOT NULL,
    workspace_id    TEXT NOT NULL,
    content_item_id TEXT NOT NULL,
    version_number  INTEGER NOT NULL CHECK (version_number >= 1),
    body_text       TEXT NOT NULL,
    sha256_hash     TEXT NOT NULL,      -- hex SHA-256 of body_text, 64 chars
    submitted_by    TEXT NOT NULL,      -- demo: role label; production: user id
    created_at      TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id),          -- required for composite FK from child tables
    UNIQUE (content_item_id, version_number),  -- one version number per content item
    FOREIGN KEY (content_item_id, workspace_id)
        REFERENCES content_item (id, workspace_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_content_version_workspace
    ON content_version (workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_version_item_version
    ON content_version (content_item_id, version_number);

-- Immutability trigger: reject UPDATE on any content_version row.
CREATE TRIGGER IF NOT EXISTS trg_content_version_no_update
    BEFORE UPDATE ON content_version
BEGIN
    SELECT RAISE(ABORT, 'content_version rows are immutable: updates are not permitted');
END;

-- Immutability trigger: reject DELETE on any content_version row.
CREATE TRIGGER IF NOT EXISTS trg_content_version_no_delete
    BEFORE DELETE ON content_version
BEGIN
    SELECT RAISE(ABORT, 'content_version rows are immutable: deletes are not permitted');
END;

-- ---------------------------------------------------------------------------
-- 3. candidate_claim
-- ---------------------------------------------------------------------------
-- A claim extracted from a content_version by the AI service (Workers AI).
-- Integrates with the M1 AiClaimExtraction Pydantic schema:
--   claim_text (str), claim_type (str|None), numeric_value (str|int|float|None),
--   unit (str|None), qualifier (str|None), scope (str|None).
-- numeric_value_text stores the normalized TEXT form of numeric_value so that
-- exact values like "40" are preserved without floating-point conversion.
-- extraction_batch_id groups all claims extracted in one AI service call,
-- enabling batch-level retrieval and re-extraction detection.
-- extracted_by records the AI model identifier (e.g. @cf/meta/llama-3.1-8b-instruct-fp8).
-- A candidate_claim is never an approved_fact; the two tables are separate.
CREATE TABLE IF NOT EXISTS candidate_claim (
    id                  TEXT NOT NULL,
    workspace_id        TEXT NOT NULL,
    content_version_id  TEXT NOT NULL,
    claim_text          TEXT NOT NULL,
    claim_type          TEXT,           -- nullable: AI may return null (M1-06 verified)
    numeric_value_text  TEXT,           -- nullable: normalized TEXT form of numeric_value
    unit                TEXT,
    qualifier           TEXT,
    scope               TEXT,           -- free-text scope string from AI extraction
    extraction_batch_id TEXT NOT NULL,  -- groups claims from one extraction run
    extracted_by        TEXT NOT NULL,  -- AI model identifier
    extracted_at        TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id),          -- required for composite FK from verification_finding
    FOREIGN KEY (content_version_id, workspace_id)
        REFERENCES content_version (id, workspace_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_candidate_claim_workspace
    ON candidate_claim (workspace_id);
CREATE INDEX IF NOT EXISTS idx_candidate_claim_content_version
    ON candidate_claim (content_version_id);
CREATE INDEX IF NOT EXISTS idx_candidate_claim_batch
    ON candidate_claim (extraction_batch_id);

-- ---------------------------------------------------------------------------
-- 4. verification_finding
-- ---------------------------------------------------------------------------
-- A finding produced by the deterministic check engine for a content_version.
-- claim_id is nullable: a finding may concern the whole content version
-- (e.g. a policy-level issue) rather than a specific extracted claim.
-- Composite FK (claim_id, workspace_id) -> candidate_claim(id, workspace_id)
-- enforces that a referenced claim belongs to the same workspace as the finding.
-- A trigger (trg_verification_finding_claim_version_match) additionally enforces
-- that the claim belongs to the same content_version as the finding.
-- finding_type uses the seven canonical snake_case values from PRD §5.
-- severity uses a four-level scale consistent with standard review tooling.
-- analysis_batch_id groups findings from one deterministic check run,
-- matching the extraction_batch_id pattern on candidate_claim.
CREATE TABLE IF NOT EXISTS verification_finding (
    id                  TEXT NOT NULL,
    workspace_id        TEXT NOT NULL,
    content_version_id  TEXT NOT NULL,
    claim_id            TEXT,           -- nullable: finding may be content-level
    finding_type        TEXT NOT NULL CHECK (finding_type IN (
                            'unsupported_claim',
                            'numeric_mismatch',
                            'claim_stronger_than_evidence',
                            'missing_qualifier',
                            'scope_mismatch',
                            'expired_offer',
                            'unapproved_terminology'
                        )),
    severity            TEXT NOT NULL CHECK (severity IN (
                            'critical', 'high', 'medium', 'low'
                        )),
    explanation         TEXT NOT NULL,
    suggested_correction TEXT,
    analysis_batch_id   TEXT NOT NULL,
    created_at          TEXT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (content_version_id, workspace_id)
        REFERENCES content_version (id, workspace_id) ON DELETE RESTRICT,
    -- Composite FK on claim: enforces claim belongs to the same workspace as the
    -- finding. Only active when claim_id IS NOT NULL; SQLite evaluates FK on NULL
    -- as a no-op, so content-level findings (claim_id NULL) are allowed.
    FOREIGN KEY (claim_id, workspace_id)
        REFERENCES candidate_claim (id, workspace_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_verification_finding_workspace
    ON verification_finding (workspace_id);
CREATE INDEX IF NOT EXISTS idx_verification_finding_content_version
    ON verification_finding (content_version_id);
CREATE INDEX IF NOT EXISTS idx_verification_finding_claim
    ON verification_finding (claim_id)
    WHERE claim_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_finding_type
    ON verification_finding (content_version_id, finding_type);
CREATE INDEX IF NOT EXISTS idx_verification_finding_batch
    ON verification_finding (analysis_batch_id);

-- When a claim is referenced, it must belong to the same content_version as the
-- finding (workspace is already enforced by the composite FK above). Applies to
-- INSERT and UPDATE so the invariant cannot be broken after the fact.
CREATE TRIGGER IF NOT EXISTS trg_verification_finding_claim_version_match
    BEFORE INSERT ON verification_finding
    FOR EACH ROW
    WHEN NEW.claim_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM candidate_claim cc
            WHERE cc.id = NEW.claim_id
              AND cc.content_version_id = NEW.content_version_id
        )
        THEN RAISE(ABORT, 'verification_finding.claim_id must reference a candidate_claim from the same content_version and workspace')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_verification_finding_claim_version_match_upd
    BEFORE UPDATE ON verification_finding
    FOR EACH ROW
    WHEN NEW.claim_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM candidate_claim cc
            WHERE cc.id = NEW.claim_id
              AND cc.content_version_id = NEW.content_version_id
        )
        THEN RAISE(ABORT, 'verification_finding.claim_id must reference a candidate_claim from the same content_version and workspace')
    END;
END;
