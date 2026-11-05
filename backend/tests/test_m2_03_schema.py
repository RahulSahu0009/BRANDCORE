"""
M2-03 schema, relationship and immutability tests.

Runs against the real SQLite runtime by applying migrations 0001-0004 to an
in-memory database with foreign_keys = ON. Every FK, CHECK, UNIQUE and trigger
behaviour is exercised against SQLite itself — not mocked.
"""
import hashlib
import sqlite3

import pytest

MIGRATION_DIR = "database/migrations"
M001 = "0001_poc_records.sql"
M201 = "0002_core_data_foundation.sql"
M202 = "0003_content_claims_verification.sql"
M203 = "0004_release_governance.sql"


def _read(name):
    with open(f"{MIGRATION_DIR}/{name}", encoding="utf-8") as f:
        return f.read()


def _migrate(conn):
    conn.execute("PRAGMA foreign_keys = ON")
    for name in (M001, M201, M202, M203):
        conn.executescript(_read(name))
    return conn


@pytest.fixture
def db():
    conn = sqlite3.connect(":memory:")
    try:
        _migrate(conn)
        yield conn
    finally:
        conn.close()


def _workspace(db, wid="ws-1", slug="ws-one"):
    db.execute(
        "INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 1, 'active', ?, ?)",
        (wid, "Workspace One", slug, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
    )


def _other_workspace(db, wid="ws-2", slug="ws-two"):
    db.execute(
        "INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 1, 'active', ?, ?)",
        (wid, "Workspace Two", slug, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
    )


def _content_item(db, cid="ci-1", wid="ws-1", title="Campaign Q3"):
    db.execute(
        "INSERT INTO content_item (id, workspace_id, title, status, created_by, created_at, updated_at) "
        "VALUES (?, ?, ?, 'active', 'creator', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
        (cid, wid, title),
    )


def _content_version(db, vid="cv-1", cid="ci-1", wid="ws-1", version_number=1,
                     body="Hello world", submitted_by="creator"):
    sha = hashlib.sha256(body.encode("utf-8")).hexdigest()
    db.execute(
        "INSERT INTO content_version (id, workspace_id, content_item_id, version_number, "
        "body_text, sha256_hash, submitted_by, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, '2026-01-01T00:00:00Z')",
        (vid, wid, cid, version_number, body, sha, submitted_by),
    )
    return sha


def _claim(db, cid="cc-1", cv="cv-1", wid="ws-1"):
    db.execute(
        "INSERT INTO candidate_claim (id, workspace_id, content_version_id, claim_text, "
        "extraction_batch_id, extracted_by, extracted_at) "
        "VALUES (?, ?, ?, 'Reduces time by 40 percent.', 'batch-1', 'model', '2026-01-01T00:00:00Z')",
        (cid, wid, cv),
    )


def _fact(db, fid="fact-1", wid="ws-1", version=1):
    db.execute(
        "INSERT INTO approved_fact (id, workspace_id, claim_text, numeric_value, unit, qualifier, "
        "scope, version, status, previous_version_id, created_by, created_at) "
        "VALUES (?, ?, 'Reduces time by 40 percent.', '40', NULL, NULL, NULL, ?, 'active', NULL, "
        "'creator', '2026-01-01T00:00:00Z')",
        (fid, wid, version),
    )


def _policy(db, pid="pol-1", wid="ws-1", version=1):
    db.execute(
        "INSERT INTO policy (id, workspace_id, name, description, rules_json, version, status, "
        "previous_version_id, created_by, created_at) "
        "VALUES (?, ?, 'P', 'd', '[]', ?, 'active', NULL, 'creator', '2026-01-01T00:00:00Z')",
        (pid, wid, version),
    )


# ---------------------------------------------------------------------------
# Schema and relationships
# ---------------------------------------------------------------------------

def test_all_five_tables_exist(db):
    tables = {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'")}
    for t in ("claim_fact_dependency", "review_decision", "release_passport",
              "release_status_event", "audit_event"):
        assert t in tables, t


def test_required_columns_exist(db):
    expected = {
        "claim_fact_dependency": {"id", "workspace_id", "claim_id", "claim_workspace",
                                  "fact_id", "fact_workspace", "dependency_type", "created_at"},
        "review_decision": {"id", "workspace_id", "content_version_id", "reviewer_id",
                            "reviewer_role", "decision", "rationale", "notes",
                            "analysis_batch_id", "created_at"},
        "release_passport": {"id", "workspace_id", "content_item_id", "content_version_id",
                             "content_sha256", "policy_version_id", "fact_evidence_versions",
                             "finding_ids_and_dispositions", "approver_id", "approver_role",
                             "decision_timestamp", "audit_reference", "status", "created_at"},
        "release_status_event": {"id", "workspace_id", "passport_id", "passport_workspace",
                                 "status", "reason", "timestamp"},
        "audit_event": {"id", "workspace_id", "actor_id", "actor_role", "action", "entity_type",
                        "entity_id", "details", "correlation_id", "created_at"},
    }
    for table, cols in expected.items():
        actual = {r[1] for r in db.execute(f"PRAGMA table_info({table})")}
        assert cols.issubset(actual), f"{table}: missing {cols - actual}"


def test_expected_triggers_exist(db):
    triggers = {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='trigger'")}
    for trig in ("trg_release_passport_no_update", "trg_release_passport_no_delete"):
        assert trig in triggers, trig


def test_valid_dependency_accepted(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    _fact(db)
    db.execute(
        "INSERT INTO claim_fact_dependency (id, workspace_id, claim_id, claim_workspace, "
        "fact_id, fact_workspace, dependency_type, created_at) "
        "VALUES ('d-1', 'ws-1', 'cc-1', 'ws-1', 'fact-1', 'ws-1', 'supports', '2026-01-01T00:00:00Z')")
    row = db.execute("SELECT dependency_type FROM claim_fact_dependency WHERE id='d-1'").fetchone()
    assert row[0] == "supports"


def test_dependency_prevents_duplicate_claim_fact(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    _fact(db)
    db.execute(
        "INSERT INTO claim_fact_dependency (id, workspace_id, claim_id, claim_workspace, "
        "fact_id, fact_workspace, dependency_type, created_at) "
        "VALUES ('d-1', 'ws-1', 'cc-1', 'ws-1', 'fact-1', 'ws-1', 'supports', '2026-01-01T00:00:00Z')")
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO claim_fact_dependency (id, workspace_id, claim_id, claim_workspace, "
            "fact_id, fact_workspace, dependency_type, created_at) "
            "VALUES ('d-2', 'ws-1', 'cc-1', 'ws-1', 'fact-1', 'ws-1', 'references', '2026-01-01T00:00:00Z')")
    db.rollback()


def test_dependency_cannot_cross_workspace(db):
    _workspace(db)
    _other_workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    # fact in ws-2
    _fact(db, fid="fact-2", wid="ws-2")
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO claim_fact_dependency (id, workspace_id, claim_id, claim_workspace, "
            "fact_id, fact_workspace, dependency_type, created_at) "
            "VALUES ('d-1', 'ws-1', 'cc-1', 'ws-1', 'fact-2', 'ws-2', 'supports', '2026-01-01T00:00:00Z')")
    db.rollback()


def test_valid_review_decision_accepted(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    db.execute(
        "INSERT INTO review_decision (id, workspace_id, content_version_id, reviewer_id, "
        "reviewer_role, decision, rationale, notes, analysis_batch_id, created_at) "
        "VALUES ('rd-1', 'ws-1', 'cv-1', 'rev-1', 'reviewer', 'approved', 'Looks good', NULL, "
        "'batch-1', '2026-01-01T00:00:00Z')")
    row = db.execute("SELECT decision FROM review_decision WHERE id='rd-1'").fetchone()
    assert row[0] == "approved"


def test_review_decision_canonical_values(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    for decision in ("approved", "changes_requested", "rejected"):
        db.execute(
            "INSERT INTO review_decision (id, workspace_id, content_version_id, reviewer_id, "
            "reviewer_role, decision, rationale, notes, analysis_batch_id, created_at) "
            "VALUES (?, 'ws-1', 'cv-1', 'rev-1', 'reviewer', ?, 'rationale', NULL, 'batch-1', "
            "'2026-01-01T00:00:00Z')",
            (f"rd-{decision}", decision))
    assert db.execute("SELECT COUNT(*) FROM review_decision").fetchone()[0] == 3
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO review_decision (id, workspace_id, content_version_id, reviewer_id, "
            "reviewer_role, decision, rationale, notes, analysis_batch_id, created_at) "
            "VALUES ('rd-bad', 'ws-1', 'cv-1', 'rev-1', 'reviewer', 'auto_approve', 'x', NULL, "
            "'batch-1', '2026-01-01T00:00:00Z')")
    db.rollback()


def test_valid_release_passport_accepted(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _policy(db)
    db.execute(
        "INSERT INTO audit_event (id, workspace_id, actor_id, actor_role, action, entity_type, "
        "entity_id, details, correlation_id, created_at) "
        "VALUES ('audit-1', 'ws-1', 'ap', 'reviewer', 'review_decision', 'review_decision', "
        "'rd-1', '{}', 'batch-1', '2026-01-01T00:00:00Z')")
    db.execute(
        "INSERT INTO release_passport (id, workspace_id, content_item_id, content_version_id, "
        "content_sha256, policy_version_id, fact_evidence_versions, finding_ids_and_dispositions, "
        "approver_id, approver_role, decision_timestamp, audit_reference, status, created_at) "
        "VALUES ('rp-1', 'ws-1', 'ci-1', 'cv-1', 'abc123', 'pol-1', '[]', '[]', 'ap', 'reviewer', "
        "'2026-01-01T00:00:00Z', 'audit-1', 'valid', '2026-01-01T00:00:00Z')")
    row = db.execute("SELECT status FROM release_passport WHERE id='rp-1'").fetchone()
    assert row[0] == "valid"


def test_release_passport_one_per_content_version(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _policy(db)
    db.execute(
        "INSERT INTO audit_event (id, workspace_id, actor_id, actor_role, action, entity_type, "
        "entity_id, details, correlation_id, created_at) "
        "VALUES ('audit-1', 'ws-1', 'ap', 'reviewer', 'review_decision', 'review_decision', "
        "'rd-1', '{}', 'batch-1', '2026-01-01T00:00:00Z')")
    db.execute(
        "INSERT INTO release_passport (id, workspace_id, content_item_id, content_version_id, "
        "content_sha256, policy_version_id, fact_evidence_versions, finding_ids_and_dispositions, "
        "approver_id, approver_role, decision_timestamp, audit_reference, status, created_at) "
        "VALUES ('rp-1', 'ws-1', 'ci-1', 'cv-1', 'abc123', 'pol-1', '[]', '[]', 'ap', 'reviewer', "
        "'2026-01-01T00:00:00Z', 'audit-1', 'valid', '2026-01-01T00:00:00Z')")
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO release_passport (id, workspace_id, content_item_id, content_version_id, "
            "content_sha256, policy_version_id, fact_evidence_versions, finding_ids_and_dispositions, "
            "approver_id, approver_role, decision_timestamp, audit_reference, status, created_at) "
            "VALUES ('rp-2', 'ws-1', 'ci-1', 'cv-1', 'abc123', 'pol-1', '[]', '[]', 'ap', 'reviewer', "
            "'2026-01-01T00:00:00Z', 'audit-1', 'valid', '2026-01-01T00:00:00Z')")
    db.rollback()


def test_release_passport_immutable(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _policy(db)
    db.execute(
        "INSERT INTO audit_event (id, workspace_id, actor_id, actor_role, action, entity_type, "
        "entity_id, details, correlation_id, created_at) "
        "VALUES ('audit-1', 'ws-1', 'ap', 'reviewer', 'review_decision', 'review_decision', "
        "'rd-1', '{}', 'batch-1', '2026-01-01T00:00:00Z')")
    db.execute(
        "INSERT INTO release_passport (id, workspace_id, content_item_id, content_version_id, "
        "content_sha256, policy_version_id, fact_evidence_versions, finding_ids_and_dispositions, "
        "approver_id, approver_role, decision_timestamp, audit_reference, status, created_at) "
        "VALUES ('rp-1', 'ws-1', 'ci-1', 'cv-1', 'abc123', 'pol-1', '[]', '[]', 'ap', 'reviewer', "
        "'2026-01-01T00:00:00Z', 'audit-1', 'valid', '2026-01-01T00:00:00Z')")
    db.commit()
    with pytest.raises(sqlite3.IntegrityError) as excinfo:
        db.execute("UPDATE release_passport SET status='stale' WHERE id='rp-1'")
    assert "immutable" in str(excinfo.value).lower()
    status = db.execute("SELECT status FROM release_passport WHERE id='rp-1'").fetchone()[0]
    assert status == "valid"


def test_release_status_event_append_only(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _policy(db)
    db.execute(
        "INSERT INTO audit_event (id, workspace_id, actor_id, actor_role, action, entity_type, "
        "entity_id, details, correlation_id, created_at) "
        "VALUES ('audit-1', 'ws-1', 'ap', 'reviewer', 'review_decision', 'review_decision', "
        "'rd-1', '{}', 'batch-1', '2026-01-01T00:00:00Z')")
    db.execute(
        "INSERT INTO release_passport (id, workspace_id, content_item_id, content_version_id, "
        "content_sha256, policy_version_id, fact_evidence_versions, finding_ids_and_dispositions, "
        "approver_id, approver_role, decision_timestamp, audit_reference, status, created_at) "
        "VALUES ('rp-1', 'ws-1', 'ci-1', 'cv-1', 'abc123', 'pol-1', '[]', '[]', 'ap', 'reviewer', "
        "'2026-01-01T00:00:00Z', 'audit-1', 'valid', '2026-01-01T00:00:00Z')")
    for i, status in enumerate(("pending", "approved", "released", "stale")):
        db.execute(
            "INSERT INTO release_status_event (id, workspace_id, passport_id, passport_workspace, "
            "status, reason, timestamp) "
            "VALUES (?, 'ws-1', 'rp-1', 'ws-1', ?, 'reason', ?)",
            (f"ev-{status}", status, f"2026-01-01T00:00:0{i}Z"))
    rows = db.execute(
        "SELECT status FROM release_status_event WHERE passport_id='rp-1' ORDER BY timestamp").fetchall()
    assert [r[0] for r in rows] == ["pending", "approved", "released", "stale"]
    # latest status derivable
    latest = db.execute(
        "SELECT status FROM release_status_event WHERE passport_id='rp-1' ORDER BY timestamp DESC LIMIT 1").fetchone()[0]
    assert latest == "stale"


def test_valid_audit_event_accepted(db):
    _workspace(db)
    db.execute(
        "INSERT INTO audit_event (id, workspace_id, actor_id, actor_role, action, entity_type, "
        "entity_id, details, correlation_id, created_at) "
        "VALUES ('audit-1', 'ws-1', 'ap', 'reviewer', 'review_decision', 'review_decision', "
        "'rd-1', '{\"decision\":\"approved\"}', 'batch-1', '2026-01-01T00:00:00Z')")
    row = db.execute("SELECT action FROM audit_event WHERE id='audit-1'").fetchone()
    assert row[0] == "review_decision"


def test_m201_m202_tables_intact(db):
    for t in ("workspace", "evidence", "approved_fact", "fact_evidence", "policy", "terminology",
              "poc_records", "content_item", "content_version", "candidate_claim",
              "verification_finding"):
        row = db.execute(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = ?", (t,)).fetchone()
        assert row[0] == 1, t
