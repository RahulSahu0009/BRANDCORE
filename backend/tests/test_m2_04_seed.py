"""
M2-04 demo workspace seed tests.

Applies all migrations then runs seed() against an in-memory SQLite DB.
Verifies idempotency, FK integrity, and retrievability of demo data.
"""
import os
import sqlite3

import pytest

from app.seed_demo import seed

MIGRATION_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "database", "migrations")
)


def _migrated_conn():
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    for name in sorted(os.listdir(MIGRATION_DIR)):
        if name.endswith(".sql"):
            with open(os.path.join(MIGRATION_DIR, name), encoding="utf-8") as f:
                conn.executescript(f.read())
    return conn


def test_seed_succeeds_and_returns_ids():
    conn = _migrated_conn()
    result = seed(conn)
    assert result["workspace"]
    assert result["fact_dark_spots"]
    assert result["content_version_v1"]
    assert result["content_version_v2"]
    assert result["release_passport"]


def test_repeated_seed_creates_no_duplicates():
    conn = _migrated_conn()
    first = seed(conn)
    counts_before = {
        t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in ("workspace", "evidence", "approved_fact", "fact_evidence",
                  "policy", "terminology", "content_item", "content_version",
                  "candidate_claim", "verification_finding", "claim_fact_dependency",
                  "review_decision", "release_passport", "release_status_event",
                  "audit_event")
    }
    seed(conn)
    seed(conn)
    counts_after = {
        t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        for t in counts_before
    }
    assert counts_after == counts_before, counts_after


def test_seed_satisfies_foreign_keys():
    # foreign_keys = ON already enforced during inserts; verify rows are linked.
    conn = _migrated_conn()
    result = seed(conn)
    ws = result["workspace"]
    # every content_version references a content_item in the same workspace
    bad = conn.execute(
        "SELECT COUNT(*) FROM content_version cv "
        "JOIN content_item ci ON ci.id = cv.content_item_id "
        "WHERE cv.workspace_id != ci.workspace_id"
    ).fetchone()[0]
    assert bad == 0
    # every claim references a content_version in the same workspace
    bad = conn.execute(
        "SELECT COUNT(*) FROM candidate_claim cc "
        "JOIN content_version cv ON cv.id = cc.content_version_id "
        "WHERE cc.workspace_id != cv.workspace_id"
    ).fetchone()[0]
    assert bad == 0
    # dependency fact belongs to same workspace as claim
    bad = conn.execute(
        "SELECT COUNT(*) FROM claim_fact_dependency d "
        "WHERE d.claim_workspace != d.fact_workspace OR d.claim_workspace != ?",
        (ws,)
    ).fetchone()[0]
    assert bad == 0


def test_demo_data_retrievable():
    conn = _migrated_conn()
    result = seed(conn)
    # workspace retrievable
    ws = conn.execute("SELECT name FROM workspace WHERE id = ?", (result["workspace"],)).fetchone()
    assert ws[0] == "Lumora Skincare"
    # two sequential versions
    versions = conn.execute(
        "SELECT version_number FROM content_version WHERE content_item_id = ? ORDER BY version_number",
        (result["content_item"],)
    ).fetchall()
    assert [r[0] for r in versions] == [1, 2]
    # facts present
    fact_count = conn.execute(
        "SELECT COUNT(*) FROM approved_fact WHERE workspace_id = ?", (result["workspace"],)
    ).fetchone()[0]
    assert fact_count >= 2
    # terminology present
    term = conn.execute(
        "SELECT status FROM terminology WHERE term = 'miracle' AND workspace_id = ?",
        (result["workspace"],)
    ).fetchone()
    assert term[0] == "denied"
    # release passport present with correct hash
    rp = conn.execute(
        "SELECT content_sha256, status FROM release_passport WHERE id = ?",
        (result["release_passport"],)
    ).fetchone()
    assert rp[1] == "valid"
    assert rp[0] == result["sha_v2"]


def test_seed_works_on_fresh_db_each_time():
    # Seed against a brand-new migrated DB each time (simulates fresh local D1).
    for _ in range(3):
        conn = _migrated_conn()
        result = seed(conn)
        assert conn.execute("SELECT COUNT(*) FROM workspace WHERE id = ?", (result["workspace"],)).fetchone()[0] == 1
        conn.close()
