-- BRANDCORE D1 rollback 0005 — Drop workspace_org_mapping table
-- Reverts migration 0005_clerk_workspace_mapping.sql
-- Preserves all workspace and other M2-01/M2-02/M2-03/M2-04/M3-01-M3-05 data.

DROP TABLE IF EXISTS workspace_org_mapping;

DROP INDEX IF EXISTS idx_workspace_org_mapping_workspace;
DROP INDEX IF EXISTS idx_workspace_org_mapping_org;
