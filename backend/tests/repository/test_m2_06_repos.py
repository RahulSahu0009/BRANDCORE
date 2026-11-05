"""
M2-06 content/claim/finding/review repository tests.

Runs real repositories against an in-memory SQLite database through
SqliteD1Wrapper. Verifies immutability, version ordering, workspace isolation,
and batch grouping against SQLite itself.
"""
import asyncio
import hashlib
import os
import sqlite3

import pytest

from app.domain.models import (
    CandidateClaimCreate,
    ContentItemCreate,
    ContentVersionCreate,
    ReviewDecisionCreate,
    VerificationFindingCreate,
)
from app.repositories.base import SqliteD1Wrapper
from app.repositories.claim_repo import CandidateClaimRepository
from app.repositories.content_repo import ContentItemRepository, ContentVersionRepository
from app.repositories.finding_repo import VerificationFindingRepository
from app.repositories.review_repo import ReviewDecisionRepository


def _db():
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    mig_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "database", "migrations")
    )
    for name in sorted(os.listdir(mig_dir)):
        if name.endswith(".sql"):
            with open(os.path.join(mig_dir, name), encoding="utf-8") as f:
                conn.executescript(f.read())
    # Seed a workspace so content_item FKs resolve.
    conn.execute(
        "INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at) "
        "VALUES ('ws-1', 'Workspace One', 'ws-one', 1, 'active', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')"
    )
    conn.commit()
    return SqliteD1Wrapper(conn)


def _run(coro):
    return asyncio.run(coro)


@pytest.fixture
def repos():
    db = _db()
    return {
        "items": ContentItemRepository(db),
        "versions": ContentVersionRepository(db),
        "claims": CandidateClaimRepository(db),
        "findings": VerificationFindingRepository(db),
        "reviews": ReviewDecisionRepository(db),
    }


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def test_content_item_and_version_flow(repos):
    item = _run(repos["items"].create("ci-1", "ws-1", ContentItemCreate(title="Campaign Q3")))
    assert item.id == "ci-1" and item.workspace_id == "ws-1"

    v1 = _run(repos["versions"].create(
        "cv-1", "ws-1", ContentVersionCreate(
            content_item_id="ci-1", body_text="version one", submitted_by="creator"
        )
    ))
    assert v1.version_number == 1
    assert v1.sha256_hash == _sha("version one")

    v2 = _run(repos["versions"].create(
        "cv-2", "ws-1", ContentVersionCreate(
            content_item_id="ci-1", body_text="version two", submitted_by="creator"
        )
    ))
    assert v2.version_number == 2
    assert v2.sha256_hash == _sha("version two")

    # Ascending order
    asc = _run(repos["versions"].list_by_item("ci-1", "ws-1", "asc"))
    assert [r.version_number for r in asc.items] == [1, 2]
    # Descending order
    desc = _run(repos["versions"].list_by_item("ci-1", "ws-1", "desc"))
    assert [r.version_number for r in desc.items] == [2, 1]
    # Latest
    latest = _run(repos["versions"].get_latest("ci-1", "ws-1"))
    assert latest.version_number == 2


def test_version_immutability(repos):
    _run(repos["items"].create("ci-1", "ws-1", ContentItemCreate(title="Campaign Q3")))
    _run(repos["versions"].create(
        "cv-1", "ws-1", ContentVersionCreate(
            content_item_id="ci-1", body_text="body one", submitted_by="creator"
        )
    ))
    # Repository has no update path; DB trigger rejects direct mutation.
    with pytest.raises(Exception):
        _run(repos["versions"].db.prepare(
            "UPDATE content_version SET body_text = 'changed' WHERE id = 'cv-1'"
        ).run())
    fetched = _run(repos["versions"].get("cv-1", "ws-1"))
    assert fetched.body_text == "body one"


def test_version_cross_workspace_rejected(repos):
    _run(repos["items"].create("ci-1", "ws-1", ContentItemCreate(title="Campaign Q3")))
    # content_item in ws-1; version requests ws-2 -> item lookup fails -> None
    result = _run(repos["versions"].create(
        "cv-x", "ws-2", ContentVersionCreate(
            content_item_id="ci-1", body_text="body", submitted_by="creator"
        )
    ))
    assert result is None


def test_claims_by_version_and_batch(repos):
    _run(repos["items"].create("ci-1", "ws-1", ContentItemCreate(title="Campaign Q3")))
    _run(repos["versions"].create(
        "cv-1", "ws-1", ContentVersionCreate(
            content_item_id="ci-1", body_text="body", submitted_by="creator"
        )
    ))
    _run(repos["claims"].create("cc-1", "ws-1", CandidateClaimCreate(
        content_version_id="cv-1", claim_text="claim one", claim_type="factual",
        numeric_value_text="40", unit="percent", qualifier=None, scope=None,
        extraction_batch_id="batch-1", extracted_by="model"
    )))
    _run(repos["claims"].create("cc-2", "ws-1", CandidateClaimCreate(
        content_version_id="cv-1", claim_text="claim two", claim_type=None,
        numeric_value_text=None, unit=None, qualifier=None, scope=None,
        extraction_batch_id="batch-1", extracted_by="model"
    )))

    by_version = _run(repos["claims"].list_by_version("cv-1", "ws-1"))
    assert by_version.total == 2
    by_batch = _run(repos["claims"].list_by_batch("batch-1", "ws-1"))
    assert by_batch.total == 2


def test_findings_by_version_and_batch(repos):
    _run(repos["items"].create("ci-1", "ws-1", ContentItemCreate(title="Campaign Q3")))
    _run(repos["versions"].create(
        "cv-1", "ws-1", ContentVersionCreate(
            content_item_id="ci-1", body_text="body", submitted_by="creator"
        )
    ))
    _run(repos["claims"].create("cc-1", "ws-1", CandidateClaimCreate(
        content_version_id="cv-1", claim_text="claim one", claim_type=None,
        numeric_value_text=None, unit=None, qualifier=None, scope=None,
        extraction_batch_id="batch-1", extracted_by="model"
    )))
    _run(repos["findings"].create("vf-1", "ws-1", VerificationFindingCreate(
        content_version_id="cv-1", claim_id="cc-1",
        finding_type="numeric_mismatch", severity="high",
        explanation="number differs", suggested_correction="fix it",
        analysis_batch_id="batch-1"
    )))
    _run(repos["findings"].create("vf-2", "ws-1", VerificationFindingCreate(
        content_version_id="cv-1", claim_id=None,
        finding_type="expired_offer", severity="medium",
        explanation="offer expired", suggested_correction=None,
        analysis_batch_id="batch-1"
    )))

    by_version = _run(repos["findings"].list_by_version("cv-1", "ws-1"))
    assert by_version.total == 2
    by_batch = _run(repos["findings"].list_by_batch("batch-1", "ws-1"))
    assert by_batch.total == 2
    by_type = _run(repos["findings"].list_by_version_and_type("cv-1", "ws-1", "numeric_mismatch"))
    assert by_type.total == 1


def test_review_decisions(repos):
    _run(repos["items"].create("ci-1", "ws-1", ContentItemCreate(title="Campaign Q3")))
    _run(repos["versions"].create(
        "cv-1", "ws-1", ContentVersionCreate(
            content_item_id="ci-1", body_text="body", submitted_by="creator"
        )
    ))
    _run(repos["reviews"].create("rd-1", "ws-1", ReviewDecisionCreate(
        content_version_id="cv-1", reviewer_id="rev-1", reviewer_role="reviewer",
        decision="changes_requested", rationale="needs fixes", notes=None,
        analysis_batch_id="batch-1"
    )))
    by_version = _run(repos["reviews"].list_by_version("cv-1", "ws-1"))
    assert by_version.total == 1
    assert by_version.items[0].decision == "changes_requested"
    approved = _run(repos["reviews"].list_by_decision("ws-1", "approved"))
    assert approved.total == 0
