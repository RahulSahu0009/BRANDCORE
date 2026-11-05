"""
M2-02 schema, relationship, immutability and constraint tests.

These tests run against the real SQLite runtime (D1 is SQLite-compatible) by
applying migrations 0001, 0002 and 0003 to an in-memory database with
foreign_keys = ON. They are not mocks: every FK, CHECK, UNIQUE and trigger
behaviour below is exercised against SQLite itself.
"""
import sqlite3

import pytest

MIGRATION_DIR = "database/migrations"
M001 = "0001_poc_records.sql"
M201 = "0002_core_data_foundation.sql"
M202 = "0003_content_claims_verification.sql"


def _read(name):
    with open(f"{MIGRATION_DIR}/{name}", encoding="utf-8") as f:
        return f.read()


def _migrate(conn):
    """Apply 0001, 0002 and 0003 to `conn` (foreign_keys already ON)."""
    conn.execute("PRAGMA foreign_keys = ON")
    for name in (M001, M201, M202):
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


def _workspace(conn, wid="ws-1", slug="ws-one"):
    conn.execute(
        "INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 1, 'active', ?, ?)",
        (wid, "Workspace One", slug, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
    )


def _other_workspace(conn, wid="ws-2", slug="ws-two"):
    conn.execute(
        "INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at) "
        "VALUES (?, ?, ?, 1, 'active', ?, ?)",
        (wid, "Workspace Two", slug, "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
    )


def _content_item(conn, cid="ci-1", wid="ws-1", title="Campaign Q3"):
    conn.execute(
        "INSERT INTO content_item (id, workspace_id, title, status, created_by, created_at, updated_at) "
        "VALUES (?, ?, ?, 'active', 'creator', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')",
        (cid, wid, title),
    )


def _content_version(conn, vid="cv-1", cid="ci-1", wid="ws-1", version_number=1,
                     body="Hello world", submitted_by="creator"):
    import hashlib
    sha = hashlib.sha256(body.encode("utf-8")).hexdigest()
    conn.execute(
        "INSERT INTO content_version (id, workspace_id, content_item_id, version_number, "
        "body_text, sha256_hash, submitted_by, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, '2026-01-01T00:00:00Z')",
        (vid, wid, cid, version_number, body, sha, submitted_by),
    )
    return sha


# ---------------------------------------------------------------------------
# Schema and relationships
# ---------------------------------------------------------------------------

def test_all_four_tables_exist(db):
    tables = {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'")}
    for t in ("content_item", "content_version", "candidate_claim", "verification_finding"):
        assert t in tables, t


def test_required_columns_exist(db):
    expected = {
        "content_item": {"id", "workspace_id", "title", "status", "created_by", "created_at", "updated_at"},
        "content_version": {"id", "workspace_id", "content_item_id", "version_number", "body_text",
                            "sha256_hash", "submitted_by", "created_at"},
        "candidate_claim": {"id", "workspace_id", "content_version_id", "claim_text", "claim_type",
                            "numeric_value_text", "unit", "qualifier", "scope", "extraction_batch_id",
                            "extracted_by", "extracted_at"},
        "verification_finding": {"id", "workspace_id", "content_version_id", "claim_id", "finding_type",
                                 "severity", "explanation", "suggested_correction", "analysis_batch_id",
                                 "created_at"},
    }
    for table, cols in expected.items():
        actual = {r[1] for r in db.execute(f"PRAGMA table_info({table})")}
        assert cols.issubset(actual), f"{table}: missing {cols - actual}"


def test_expected_indexes_exist(db):
    indexes = {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='index'")}
    for idx in ("idx_content_item_workspace", "idx_content_item_workspace_status",
                "idx_content_version_workspace", "idx_content_version_item_version",
                "idx_candidate_claim_workspace", "idx_candidate_claim_content_version",
                "idx_candidate_claim_batch",
                "idx_verification_finding_workspace", "idx_verification_finding_content_version",
                "idx_verification_finding_claim", "idx_verification_finding_type",
                "idx_verification_finding_batch"):
        assert idx in indexes, idx


def test_expected_triggers_exist(db):
    triggers = {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='trigger'")}
    for trig in ("trg_content_version_no_update", "trg_content_version_no_delete",
                 "trg_verification_finding_claim_version_match",
                 "trg_verification_finding_claim_version_match_upd"):
        assert trig in triggers, trig


def test_valid_content_item_and_version_accepted(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    row = db.execute("SELECT COUNT(*) FROM content_version").fetchone()[0]
    assert row == 1


def test_invalid_workspace_relationship_rejected(db):
    _workspace(db)
    _other_workspace(db)
    _content_item(db, cid="ci-1", wid="ws-1")
    # content_version whose workspace_id differs from its content_item's workspace -> FK violation
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO content_version (id, workspace_id, content_item_id, version_number, "
            "body_text, sha256_hash, submitted_by, created_at) "
            "VALUES ('cv-x', 'ws-2', 'ci-1', 1, 'b', 'deadbeef', 'creator', '2026-01-01T00:00:00Z')")
    db.rollback()


def test_claim_cannot_reference_content_version_from_another_workspace(db):
    _workspace(db)
    _other_workspace(db)
    _content_item(db, wid="ws-1")
    _content_version(db, vid="cv-1", wid="ws-1")
    # claim in ws-2 referencing cv-1 (ws-1) -> composite FK violation
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO candidate_claim (id, workspace_id, content_version_id, claim_text, "
            "extraction_batch_id, extracted_by, extracted_at) "
            "VALUES ('cc-1', 'ws-2', 'cv-1', 'text', 'batch-1', 'model', '2026-01-01T00:00:00Z')")
    db.rollback()


def test_finding_cannot_reference_claim_from_different_content_version(db):
    _workspace(db)
    _content_item(db)
    _content_version(db, vid="cv-1", version_number=1)
    _content_version(db, vid="cv-2", version_number=2)
    # claim belongs to cv-1
    db.execute(
        "INSERT INTO candidate_claim (id, workspace_id, content_version_id, claim_text, "
        "extraction_batch_id, extracted_by, extracted_at) "
        "VALUES ('cc-1', 'ws-1', 'cv-1', 'text', 'batch-1', 'model', '2026-01-01T00:00:00Z')")
    # finding references cc-1 but points at cv-2 -> trigger rejection
    with pytest.raises(sqlite3.Error):
        db.execute(
            "INSERT INTO verification_finding (id, workspace_id, content_version_id, claim_id, "
            "finding_type, severity, explanation, analysis_batch_id, created_at) "
            "VALUES ('vf-1', 'ws-1', 'cv-2', 'cc-1', 'unsupported_claim', 'high', 'why', 'batch-1', "
            "'2026-01-01T00:00:00Z')")
    db.rollback()


def test_finding_cannot_reference_claim_from_different_workspace(db):
    _workspace(db)
    _other_workspace(db)
    _content_item(db, wid="ws-1")
    _content_item(db, cid="ci-2", wid="ws-2")
    _content_version(db, vid="cv-1", wid="ws-1", cid="ci-1")
    _content_version(db, vid="cv-2", wid="ws-2", cid="ci-2")
    db.execute(
        "INSERT INTO candidate_claim (id, workspace_id, content_version_id, claim_text, "
        "extraction_batch_id, extracted_by, extracted_at) "
        "VALUES ('cc-1', 'ws-1', 'cv-1', 'text', 'batch-1', 'model', '2026-01-01T00:00:00Z')")
    # finding in ws-2 references cc-1 (ws-1) -> composite FK violation
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(
            "INSERT INTO verification_finding (id, workspace_id, content_version_id, claim_id, "
            "finding_type, severity, explanation, analysis_batch_id, created_at) "
            "VALUES ('vf-1', 'ws-2', 'cv-2', 'cc-1', 'unsupported_claim', 'high', 'why', 'batch-1', "
            "'2026-01-01T00:00:00Z')")
    db.rollback()


# ---------------------------------------------------------------------------
# Immutability
# ---------------------------------------------------------------------------

def test_content_version_update_rejected(db):
    _workspace(db)
    _content_item(db)
    _content_version(db, vid="cv-1")
    db.commit()  # persist setup; each test gets a fresh in-memory DB, so no rollback needed
    with pytest.raises(sqlite3.IntegrityError) as excinfo:
        db.execute("UPDATE content_version SET body_text = 'changed' WHERE id = 'cv-1'")
    assert "immutable" in str(excinfo.value).lower()
    assert "updates are not permitted" in str(excinfo.value)
    body = db.execute("SELECT body_text FROM content_version WHERE id = 'cv-1'").fetchone()[0]
    assert body == "Hello world"


def test_content_version_delete_rejected(db):
    _workspace(db)
    _content_item(db)
    _content_version(db, vid="cv-1")
    db.commit()
    with pytest.raises(sqlite3.IntegrityError) as excinfo:
        db.execute("DELETE FROM content_version WHERE id = 'cv-1'")
    assert "immutable" in str(excinfo.value).lower()
    assert "deletes are not permitted" in str(excinfo.value)
    assert db.execute("SELECT COUNT(*) FROM content_version").fetchone()[0] == 1


def test_existing_versions_unchanged_after_inserting_later_version(db):
    _workspace(db)
    _content_item(db)
    sha1 = _content_version(db, vid="cv-1", version_number=1, body="version one")
    _content_version(db, vid="cv-2", version_number=2, body="version two")
    row = db.execute("SELECT body_text, sha256_hash FROM content_version WHERE id = 'cv-1'").fetchone()
    assert row[0] == "version one"
    assert row[1] == sha1
    versions = [r[0] for r in db.execute(
        "SELECT version_number FROM content_version WHERE content_item_id = 'ci-1' "
        "ORDER BY version_number")]
    assert versions == [1, 2]


def test_content_item_can_have_multiple_sequential_versions(db):
    _workspace(db)
    _content_item(db)
    for n in range(1, 6):
        _content_version(db, vid=f"cv-{n}", version_number=n, body=f"body {n}")
    count = db.execute("SELECT COUNT(*) FROM content_version WHERE content_item_id = 'ci-1'").fetchone()[0]
    assert count == 5


# ---------------------------------------------------------------------------
# Candidate claims
# ---------------------------------------------------------------------------

def _claim(db, cid="cc-1", cv="cv-1", wid="ws-1", claim_type=None, numeric_value_text=None,
           batch="batch-1"):
    db.execute(
        "INSERT INTO candidate_claim (id, workspace_id, content_version_id, claim_text, claim_type, "
        "numeric_value_text, unit, qualifier, scope, extraction_batch_id, extracted_by, extracted_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-01T00:00:00Z')",
        (cid, wid, cv, "Reduces time by 40 percent.", claim_type, numeric_value_text,
         "percent", "up to", "B2B", batch, "@cf/meta/llama-3.1-8b-instruct-fp8"))


def test_null_claim_type_accepted(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db, claim_type=None)
    row = db.execute("SELECT claim_type FROM candidate_claim WHERE id = 'cc-1'").fetchone()
    assert row[0] is None


def test_null_numeric_value_accepted(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db, numeric_value_text=None)
    row = db.execute("SELECT numeric_value_text FROM candidate_claim WHERE id = 'cc-1'").fetchone()
    assert row[0] is None


def test_numeric_value_stored_as_text(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db, numeric_value_text="40")
    row = db.execute("SELECT numeric_value_text FROM candidate_claim WHERE id = 'cc-1'").fetchone()
    assert row[0] == "40"
    assert isinstance(row[0], str)


def test_40_preserved_without_float_conversion(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db, numeric_value_text="40")
    val = db.execute("SELECT numeric_value_text FROM candidate_claim WHERE id = 'cc-1'").fetchone()[0]
    assert val == "40" and val != "40.0"


def test_multiple_claims_same_extraction_batch(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db, cid="cc-1", batch="batch-1")
    _claim(db, cid="cc-2", batch="batch-1")
    count = db.execute(
        "SELECT COUNT(*) FROM candidate_claim WHERE extraction_batch_id = 'batch-1'").fetchone()[0]
    assert count == 2


# ---------------------------------------------------------------------------
# Verification findings
# ---------------------------------------------------------------------------

def _finding(db, fid="vf-1", cv="cv-1", claim_id="cc-1", wid="ws-1",
             ftype="unsupported_claim", severity="high", batch="batch-1"):
    db.execute(
        "INSERT INTO verification_finding (id, workspace_id, content_version_id, claim_id, "
        "finding_type, severity, explanation, suggested_correction, analysis_batch_id, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-01T00:00:00Z')",
        (fid, wid, cv, claim_id, ftype, severity, "explanation", "correction", batch))


def test_claim_level_finding_references_valid_claim(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    _finding(db)
    row = db.execute("SELECT finding_type FROM verification_finding WHERE id = 'vf-1'").fetchone()
    assert row[0] == "unsupported_claim"


def test_content_level_finding_without_claim(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _finding(db, fid="vf-1", claim_id=None)
    row = db.execute("SELECT claim_id FROM verification_finding WHERE id = 'vf-1'").fetchone()
    assert row[0] is None


def test_finding_cannot_reference_claim_from_different_content_version(db):
    _workspace(db)
    _content_item(db)
    _content_version(db, vid="cv-1")
    _content_version(db, vid="cv-2", version_number=2)
    _claim(db, cid="cc-1", cv="cv-1")
    with pytest.raises(sqlite3.Error):
        _finding(db, fid="vf-1", cv="cv-2", claim_id="cc-1")
    db.rollback()


def test_canonical_finding_types_enforced(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    valid_types = ("unsupported_claim", "numeric_mismatch", "claim_stronger_than_evidence",
                   "missing_qualifier", "scope_mismatch", "expired_offer", "unapproved_terminology")
    for ftype in valid_types:
        _finding(db, fid=f"vf-{ftype}", ftype=ftype)
    assert db.execute("SELECT COUNT(*) FROM verification_finding").fetchone()[0] == 7
    with pytest.raises(sqlite3.IntegrityError):
        _finding(db, fid="vf-bad", ftype="not-a-real-type")
    db.rollback()


def test_canonical_severity_enforced(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    for severity in ("critical", "high", "medium", "low"):
        _finding(db, fid=f"vf-{severity}", severity=severity)
    assert db.execute("SELECT COUNT(*) FROM verification_finding").fetchone()[0] == 4
    with pytest.raises(sqlite3.IntegrityError):
        _finding(db, fid="vf-bad-sev", severity="extreme")
    db.rollback()


def test_multiple_findings_same_content_version(db):
    _workspace(db)
    _content_item(db)
    _content_version(db)
    _claim(db)
    _finding(db, fid="vf-1", ftype="unsupported_claim")
    _finding(db, fid="vf-2", ftype="numeric_mismatch", claim_id="cc-1")
    _finding(db, fid="vf-3", ftype="missing_qualifier", claim_id=None)
    assert db.execute(
        "SELECT COUNT(*) FROM verification_finding WHERE content_version_id = 'cv-1'").fetchone()[0] == 3


# ---------------------------------------------------------------------------
# Regression: M2-01 tables intact under M2-02 migration
# ---------------------------------------------------------------------------

def test_m201_tables_remain_intact(db):
    for t in ("workspace", "evidence", "approved_fact", "fact_evidence", "policy", "terminology",
              "poc_records"):
        row = db.execute(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = ?", (t,)).fetchone()
        assert row[0] == 1, t
