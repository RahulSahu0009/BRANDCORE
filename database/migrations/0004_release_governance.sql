-- BRANDCORE D1 migration 0004 — Release and governance data model
-- Tables: claim_fact_dependency, review_decision, release_passport,
--         release_status_event, audit_event
-- Depends on: migration 0003 (content_item, content_version, candidate_claim,
--           verification_finding) and migration 0002 (workspace, evidence,
--           approved_fact, fact_evidence, policy, terminology)
--
-- Design notes:
-- * Follows M2-01/M2-02 conventions: TEXT UUIDs, ISO 8601 UTC timestamps as
--   TEXT, workspace-scoped composite FKs, ON DELETE RESTRICT on all business
--   records.
-- * release_passport and release_status_event are append-only / immutable:
--   BEFORE UPDATE and BEFORE DELETE triggers abort mutation with an explicit
--   error message.
-- * Composite FKs enforce workspace isolation at the DB level: a dependency,
--   decision, passport, event or audit row cannot reference a parent from a
--   different workspace.
-- * PRAGMA foreign_keys = ON must be set per connection in the application layer.

-- ---------------------------------------------------------------------------
-- 1. claim_fact_dependency
-- ---------------------------------------------------------------------------
-- Links a candidate_claim to one or more approved_fact versions that support
-- or relate to it. Workspace-scoped; a claim cannot depend on a fact from a
-- different workspace.
CREATE TABLE IF NOT EXISTS claim_fact_dependency (
    id                TEXT NOT NULL,
    workspace_id      TEXT NOT NULL,
    claim_id          TEXT NOT NULL,
    claim_workspace   TEXT NOT NULL,
    fact_id           TEXT NOT NULL,
    fact_workspace    TEXT NOT NULL,
    dependency_type   TEXT NOT NULL DEFAULT 'supports'
                        CHECK (dependency_type IN ('supports', 'references')),
    created_at        TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id),
    UNIQUE (claim_id, fact_id),
    FOREIGN KEY (claim_id, claim_workspace)
        REFERENCES candidate_claim (id, workspace_id) ON DELETE RESTRICT,
    FOREIGN KEY (fact_id, fact_workspace)
        REFERENCES approved_fact (id, workspace_id) ON DELETE RESTRICT,
    CHECK (claim_workspace = workspace_id),
    CHECK (fact_workspace = workspace_id),
    CHECK (claim_workspace = fact_workspace)
);

CREATE INDEX IF NOT EXISTS idx_claim_fact_dependency_workspace
    ON claim_fact_dependency (workspace_id);
CREATE INDEX IF NOT EXISTS idx_claim_fact_dependency_claim
    ON claim_fact_dependency (claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_fact_dependency_fact
    ON claim_fact_dependency (fact_id);

-- ---------------------------------------------------------------------------
-- 2. review_decision
-- ---------------------------------------------------------------------------
-- Human review decision recorded against an exact content version.
-- Creator cannot be the approver (enforced in application layer).
-- Historical decisions are preserved; no mutation path.
CREATE TABLE IF NOT EXISTS review_decision (
    id                TEXT NOT NULL,
    workspace_id      TEXT NOT NULL,
    content_version_id TEXT NOT NULL,
    reviewer_id       TEXT NOT NULL,      -- demo: role label; production: user id
    reviewer_role     TEXT NOT NULL,      -- e.g. 'reviewer', 'brand_admin'
    decision          TEXT NOT NULL
                        CHECK (decision IN ('approved', 'changes_requested', 'rejected')),
    rationale         TEXT,
    notes             TEXT,
    analysis_batch_id TEXT,               -- references the analysis that produced findings
    created_at        TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id),
    FOREIGN KEY (content_version_id, workspace_id)
        REFERENCES content_version (id, workspace_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_review_decision_workspace
    ON review_decision (workspace_id);
CREATE INDEX IF NOT EXISTS idx_review_decision_content_version
    ON review_decision (content_version_id);
CREATE INDEX IF NOT EXISTS idx_review_decision_decision
    ON review_decision (decision);

-- ---------------------------------------------------------------------------
-- 3. release_passport
-- ---------------------------------------------------------------------------
-- Immutable snapshot created at the moment of human approval. Identifies
-- exactly what was approved: content version, content hash, policy version,
-- fact/evidence versions, findings and dispositions.
-- The row is never updated; status changes are recorded as release_status_event
-- rows only.
CREATE TABLE IF NOT EXISTS release_passport (
    id                    TEXT NOT NULL,
    workspace_id          TEXT NOT NULL,
    content_item_id       TEXT NOT NULL,
    content_version_id    TEXT NOT NULL,
    content_sha256        TEXT NOT NULL,      -- SHA-256 of the exact content body
    policy_version_id     TEXT NOT NULL,      -- policy version in effect at approval
    fact_evidence_versions TEXT NOT NULL      -- JSON array of fact/evidence version IDs used
                                              -- e.g. [{"fact_id":"...","version":1},...]
    ,
    finding_ids_and_dispositions TEXT NOT NULL -- JSON array of finding IDs + reviewer dispositions
    ,
    approver_id           TEXT NOT NULL,      -- demo: role label; production: user id
    approver_role         TEXT NOT NULL,      -- e.g. 'reviewer'
    decision_timestamp    TEXT NOT NULL,      -- ISO 8601 UTC
    audit_reference       TEXT,               -- FK to audit_event(id, workspace_id)
    status                TEXT NOT NULL DEFAULT 'valid'
                            CHECK (status IN ('valid', 'stale', 'revoked', 'invalid')),
    created_at            TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id),
    UNIQUE (content_version_id),              -- one passport per content version
    FOREIGN KEY (content_version_id, workspace_id)
        REFERENCES content_version (id, workspace_id) ON DELETE RESTRICT,
    FOREIGN KEY (policy_version_id, workspace_id)
        REFERENCES policy (id, workspace_id) ON DELETE RESTRICT,
    FOREIGN KEY (audit_reference, workspace_id)
        REFERENCES audit_event (id, workspace_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_release_passport_workspace
    ON release_passport (workspace_id);
CREATE INDEX IF NOT EXISTS idx_release_passport_content_version
    ON release_passport (content_version_id);
CREATE INDEX IF NOT EXISTS idx_release_passport_status
    ON release_passport (workspace_id, status);

-- Immutability trigger: reject UPDATE on any release_passport row.
CREATE TRIGGER IF NOT EXISTS trg_release_passport_no_update
    BEFORE UPDATE ON release_passport
BEGIN
    SELECT RAISE(ABORT, 'release_passport rows are immutable: updates are not permitted');
END;

-- Immutability trigger: reject DELETE on any release_passport row.
CREATE TRIGGER IF NOT EXISTS trg_release_passport_no_delete
    BEFORE DELETE ON release_passport
BEGIN
    SELECT RAISE(ABORT, 'release_passport rows are immutable: deletes are not permitted');
END;

-- ---------------------------------------------------------------------------
-- 4. release_status_event
-- ---------------------------------------------------------------------------
-- Append-only event history for a release passport. A status change creates a
-- new event; historical events are never overwritten or deleted.
-- Current release status is derivable from the latest event for a passport.
CREATE TABLE IF NOT EXISTS release_status_event (
    id                TEXT NOT NULL,
    workspace_id      TEXT NOT NULL,
    passport_id       TEXT NOT NULL,
    passport_workspace TEXT NOT NULL,
    status            TEXT NOT NULL
                        CHECK (status IN ('pending', 'approved', 'released', 'stale', 'revoked', 'invalid')),
    reason            TEXT NOT NULL,
    timestamp         TEXT NOT NULL,        -- ISO 8601 UTC
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id),
    FOREIGN KEY (passport_id, passport_workspace)
        REFERENCES release_passport (id, workspace_id) ON DELETE RESTRICT,
    CHECK (passport_workspace = workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_release_status_event_workspace
    ON release_status_event (workspace_id);
CREATE INDEX IF NOT EXISTS idx_release_status_event_passport
    ON release_status_event (passport_id);
CREATE INDEX IF NOT EXISTS idx_release_status_event_passport_status
    ON release_status_event (passport_id, status);

-- ---------------------------------------------------------------------------
-- 5. audit_event
-- ---------------------------------------------------------------------------
-- Append-only audit history. No secrets, credentials or unnecessary content
-- bodies are logged.
CREATE TABLE IF NOT EXISTS audit_event (
    id             TEXT NOT NULL,
    workspace_id   TEXT NOT NULL,
    actor_id       TEXT NOT NULL,            -- demo: role label; production: user id
    actor_role     TEXT NOT NULL,            -- e.g. 'creator', 'reviewer', 'brand_admin'
    action         TEXT NOT NULL,            -- e.g. 'extract_claims', 'run_verification', 'review_decision', 'release_passport'
    entity_type    TEXT NOT NULL,            -- e.g. 'content_version', 'candidate_claim', 'verification_finding', 'review_decision', 'release_passport'
    entity_id      TEXT NOT NULL,
    details        TEXT,                     -- JSON structured details (no secrets)
    correlation_id TEXT,                     -- extraction/analysis batch id
    created_at     TEXT NOT NULL,            -- ISO 8601 UTC
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_audit_event_workspace
    ON audit_event (workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_workspace_action
    ON audit_event (workspace_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_event_entity
    ON audit_event (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_correlation
    ON audit_event (correlation_id);
