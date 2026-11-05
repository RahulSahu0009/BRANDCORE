-- BRANDCORE rollback for migration 0004 — Release and governance data model
--
-- SAFETY RULES:
-- * Run ONLY against a local disposable database state.
-- * NEVER run against a remote or production database.
-- * Use: npx wrangler d1 execute brandcore-db --local --file=database/rollbacks/0004_release_governance_rollback.sql
--
-- Drops only the five tables and two triggers introduced in 0004,
-- in reverse dependency order.
-- Does NOT touch M2-01, M2-02 tables, poc_records or the d1_migrations table.

-- Triggers must be dropped before their table is dropped.
DROP TRIGGER IF EXISTS trg_release_passport_no_delete;
DROP TRIGGER IF EXISTS trg_release_passport_no_update;

-- release_status_event references release_passport; drop it first.
DROP TABLE IF EXISTS release_status_event;

-- review_decision references content_version (0003); drop it.
DROP TABLE IF EXISTS review_decision;

-- claim_fact_dependency references candidate_claim and approved_fact; drop it.
DROP TABLE IF EXISTS claim_fact_dependency;

-- release_passport references content_version, policy, audit_event; drop it.
DROP TABLE IF EXISTS release_passport;

-- audit_event has no outgoing FKs from this migration; drop it last.
DROP TABLE IF EXISTS audit_event;
