-- BRANDCORE rollback for migration 0002 — Core data foundation
--
-- SAFETY RULES:
-- * Run ONLY against a local disposable database state.
-- * NEVER run against a remote or production database.
-- * Use: npx wrangler d1 execute brandcore-db --local --file=database/rollbacks/0002_core_data_foundation_rollback.sql
--
-- Drops only the six tables introduced in 0002, in reverse dependency order.
-- Does NOT touch poc_records (0001) or the d1_migrations tracking table.

DROP TABLE IF EXISTS fact_evidence;
DROP TABLE IF EXISTS terminology;
DROP TABLE IF EXISTS policy;
DROP TABLE IF EXISTS approved_fact;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS workspace;
