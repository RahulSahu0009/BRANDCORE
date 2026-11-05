-- BRANDCORE rollback for migration 0003 — Content, claims and verification schema
--
-- SAFETY RULES:
-- * Run ONLY against a local disposable database state.
-- * NEVER run against a remote or production database.
-- * Use: npx wrangler d1 execute brandcore-db --local --file=database/rollbacks/0003_content_claims_verification_rollback.sql
--
-- Drops only the four tables and four triggers introduced in 0003,
-- in reverse dependency order.
-- Does NOT touch M2-01 tables (workspace, evidence, approved_fact, fact_evidence,
-- policy, terminology), poc_records (0001) or the d1_migrations tracking table.

-- Triggers must be dropped before their table is dropped (SQLite drops them
-- automatically with the table, but explicit drops are clearer and safer).
DROP TRIGGER IF EXISTS trg_verification_finding_claim_version_match_upd;
DROP TRIGGER IF EXISTS trg_verification_finding_claim_version_match;
DROP TRIGGER IF EXISTS trg_content_version_no_delete;
DROP TRIGGER IF EXISTS trg_content_version_no_update;

DROP TABLE IF EXISTS verification_finding;
DROP TABLE IF EXISTS candidate_claim;
DROP TABLE IF EXISTS content_version;
DROP TABLE IF EXISTS content_item;
