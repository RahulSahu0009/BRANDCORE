-- BRANDCORE D1 migration 0002 — Core data foundation
-- Tables: workspace, evidence, approved_fact, fact_evidence, policy, terminology
--
-- Design notes:
-- * All IDs are TEXT (UUID strings generated in Python with uuid.uuid4()).
-- * All timestamps are TEXT storing ISO 8601 UTC (e.g. "2026-11-04T12:00:00Z").
-- * Every business entity is scoped to a workspace_id.
-- * evidence rows are immutable once created; deletion is RESTRICT to preserve
--   provenance chains. A new evidence version is a new row.
-- * approved_fact is versioned; old versions are preserved (RESTRICT on delete).
--   The fact-to-evidence relationship is many-to-many via fact_evidence so a
--   fact can cite multiple supporting sources.
-- * policy and terminology are workspace-specific and versioned.
-- * Foreign keys use composite (workspace_id, id) references where the child
--   must belong to the same workspace as the parent, enforcing workspace isolation.
--   SQLite supports composite FKs; the referenced columns must form a UNIQUE
--   constraint or PRIMARY KEY on the parent table.
-- * PRAGMA foreign_keys = ON must be set per connection in the application layer;
--   D1 local simulation enables it by default for wrangler d1 execute --local.

-- ---------------------------------------------------------------------------
-- 1. workspace
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    demo_flag   INTEGER NOT NULL DEFAULT 1 CHECK (demo_flag IN (0, 1)),
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_workspace_status ON workspace (status);

-- ---------------------------------------------------------------------------
-- 2. evidence
-- ---------------------------------------------------------------------------
-- evidence rows are immutable once created. A new version of a source is a
-- new row with a higher version number. Deletion is blocked (RESTRICT) to
-- preserve provenance chains referenced by approved_fact and release_passport.
CREATE TABLE IF NOT EXISTS evidence (
    id              TEXT NOT NULL,
    workspace_id    TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    title           TEXT NOT NULL,
    source_url      TEXT,
    source_type     TEXT NOT NULL CHECK (source_type IN (
                        'internal_study', 'third_party_report',
                        'regulatory_document', 'press_release', 'other'
                    )),
    summary         TEXT,
    version         INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'retracted')),
    created_at      TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id)          -- composite unique for composite FK references
);

CREATE INDEX IF NOT EXISTS idx_evidence_workspace ON evidence (workspace_id);
CREATE INDEX IF NOT EXISTS idx_evidence_workspace_status ON evidence (workspace_id, status);

-- ---------------------------------------------------------------------------
-- 3. approved_fact
-- ---------------------------------------------------------------------------
-- Each row is one immutable version of a fact. Editing a fact creates a new
-- row; the old version is preserved. previous_version_id links the chain.
-- Deletion is RESTRICT to preserve the provenance chain.
CREATE TABLE IF NOT EXISTS approved_fact (
    id                  TEXT NOT NULL,
    workspace_id        TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    claim_text          TEXT NOT NULL,
    numeric_value       TEXT,                   -- stored as TEXT; deterministic checks parse it
    unit                TEXT,
    qualifier           TEXT,
    scope               TEXT,                   -- JSON array of scope tags, e.g. '["UK","B2B"]'
    version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    status              TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'superseded', 'retracted')),
    previous_version_id TEXT REFERENCES approved_fact (id) ON DELETE RESTRICT,
    created_by          TEXT NOT NULL,          -- demo: role label; production: user id
    created_at          TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id)                   -- composite unique for composite FK references
);

CREATE INDEX IF NOT EXISTS idx_approved_fact_workspace ON approved_fact (workspace_id);
CREATE INDEX IF NOT EXISTS idx_approved_fact_workspace_status
    ON approved_fact (workspace_id, status);

-- ---------------------------------------------------------------------------
-- 4. fact_evidence  (many-to-many join: approved_fact ↔ evidence)
-- ---------------------------------------------------------------------------
-- A fact can be supported by multiple evidence records.
-- Both sides use composite FKs to enforce workspace isolation:
-- the evidence record must belong to the same workspace as the fact.
CREATE TABLE IF NOT EXISTS fact_evidence (
    fact_id         TEXT NOT NULL,
    fact_workspace  TEXT NOT NULL,
    evidence_id     TEXT NOT NULL,
    ev_workspace    TEXT NOT NULL,
    linked_at       TEXT NOT NULL,
    PRIMARY KEY (fact_id, evidence_id),
    FOREIGN KEY (fact_id, fact_workspace)
        REFERENCES approved_fact (id, workspace_id) ON DELETE RESTRICT,
    FOREIGN KEY (evidence_id, ev_workspace)
        REFERENCES evidence (id, workspace_id) ON DELETE RESTRICT,
    CHECK (fact_workspace = ev_workspace)       -- workspace isolation enforced at DB level
);

CREATE INDEX IF NOT EXISTS idx_fact_evidence_fact ON fact_evidence (fact_id);
CREATE INDEX IF NOT EXISTS idx_fact_evidence_evidence ON fact_evidence (evidence_id);

-- ---------------------------------------------------------------------------
-- 5. policy
-- ---------------------------------------------------------------------------
-- Workspace-specific brand policy rules. Versioned; old versions preserved.
CREATE TABLE IF NOT EXISTS policy (
    id                  TEXT NOT NULL,
    workspace_id        TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    name                TEXT NOT NULL,
    description         TEXT,
    rules_json          TEXT NOT NULL DEFAULT '[]'
                            CHECK (rules_json LIKE '[%' OR rules_json LIKE '{%'),
    version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    status              TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'superseded', 'archived')),
    previous_version_id TEXT REFERENCES policy (id) ON DELETE RESTRICT,
    created_by          TEXT NOT NULL,
    created_at          TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_policy_workspace ON policy (workspace_id);
CREATE INDEX IF NOT EXISTS idx_policy_workspace_status ON policy (workspace_id, status);

-- ---------------------------------------------------------------------------
-- 6. terminology
-- ---------------------------------------------------------------------------
-- Workspace-specific approved/denied term list used by the deterministic
-- unapproved-terminology check.
CREATE TABLE IF NOT EXISTS terminology (
    id              TEXT NOT NULL,
    workspace_id    TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    term            TEXT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('approved', 'denied', 'preferred')),
    notes           TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (workspace_id, term)             -- one entry per term per workspace
);

CREATE INDEX IF NOT EXISTS idx_terminology_workspace ON terminology (workspace_id);
CREATE INDEX IF NOT EXISTS idx_terminology_workspace_status
    ON terminology (workspace_id, status);
