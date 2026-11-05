-- BRANDCORE D1 migration 0005 — Clerk Organization to Workspace mapping
-- Table: workspace_org_mapping
-- Depends on: migration 0002 (workspace table)
--
-- Design notes:
-- * Maps each BRANDCORE workspace to exactly one Clerk Organization ID.
-- * UNIQUE(org_id) — a Clerk Organization ID must never map to multiple workspaces.
-- * UNIQUE(workspace_id) — a workspace maps to exactly one Clerk Organization.
-- * Composite FK (workspace_id) references workspace(id) ON DELETE RESTRICT.
-- * All queries parameterized; used by auth/dependencies.py for workspace authorization.
-- * Additive migration — preserves all existing workspace records and seed data.

-- ---------------------------------------------------------------------------
-- 1. workspace_org_mapping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_org_mapping (
    id          TEXT NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    org_id      TEXT NOT NULL,
    created_by  TEXT NOT NULL,          -- Clerk user_id who provisioned the mapping
    created_at  TEXT NOT NULL,          -- ISO 8601 UTC
    PRIMARY KEY (id),
    UNIQUE (workspace_id),              -- one workspace -> one org
    UNIQUE (org_id)                     -- one org -> one workspace
);

CREATE INDEX IF NOT EXISTS idx_workspace_org_mapping_workspace
    ON workspace_org_mapping (workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_org_mapping_org
    ON workspace_org_mapping (org_id);
