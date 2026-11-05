"""
M3-05 analysis API integration tests.

Tests the AnalysisService end-to-end against a real (in-memory) SQLite database
through the D1-style binding interface, with a fake Workers AI binding. No
remote inference is performed.
"""
import asyncio
import json
import os
import sqlite3

import pytest

from app.services.analysis_service import AnalysisService
from app.services.ai_extraction import ClaimExtractionService, ClaimExtractionError
from app.services.verification_engine import VerificationEngine
from app.repositories.base import SqliteD1Wrapper
from app.repositories.claim_repo import CandidateClaimRepository
from app.repositories.finding_repo import VerificationFindingRepository
from app.repositories.content_repo import ContentVersionRepository, ContentItemRepository
from app.repositories.fact_repo import ApprovedFactRepository
from app.repositories.evidence_repo import EvidenceRepository
from app.repositories.policy_repo import PolicyRepository
from app.repositories.terminology_repo import TerminologyRepository
from app.repositories.dependency_repo import ClaimFactDependencyRepository
from app.repositories.event_repo import AuditEventRepository


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
    # Seed workspace, content item, version, fact, policy, terminology.
    conn.execute(
        "INSERT INTO workspace (id,name,slug,demo_flag,status,created_at,updated_at) "
        "VALUES ('ws-1','W','w',1,'active','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')"
    )
    conn.execute(
        "INSERT INTO content_item (id,workspace_id,title,status,created_by,created_at,updated_at) "
        "VALUES ('ci-1','ws-1','T','active','c','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')"
    )
    conn.execute(
        "INSERT INTO content_version (id,workspace_id,content_item_id,version_number,body_text,sha256_hash,submitted_by,created_at) "
        "VALUES ('cv-1','ws-1','ci-1',1,'Reduces dark spots by 40 percent. Miracle results.','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','c','2026-01-01T00:00:00Z')"
    )
    conn.execute(
        "INSERT INTO approved_fact (id,workspace_id,claim_text,numeric_value,unit,qualifier,scope,version,status,previous_version_id,created_by,created_at) "
        "VALUES ('f-1','ws-1','Reduces dark spots by up to 30 percent.','30','percent','up to','{\"product\":\"Glow\",\"region\":\"IN\"}',1,'active',NULL,'c','2026-01-01T00:00:00Z')"
    )
    conn.execute(
        "INSERT INTO policy (id,workspace_id,name,description,rules_json,version,status,previous_version_id,created_by,created_at) "
        "VALUES ('p-1','ws-1','P','d','[]',1,'active',NULL,'c','2026-01-01T00:00:00Z')"
    )
    conn.execute(
        "INSERT INTO terminology (id,workspace_id,term,status,notes,created_at,updated_at) "
        "VALUES ('t-1','ws-1','miracle','denied','x','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')"
    )
    conn.commit()
    return SqliteD1Wrapper(conn)


def _run(coro):
    return asyncio.run(coro)


class FakeAI:
    def __init__(self, response: str, usage: dict | None = None,
                 raise_on_call: bool = False):
        self._response = response
        self._usage = usage or {}
        self._raise = raise_on_call
        self.calls = 0

    async def run(self, model: str, payload: dict):
        self.calls += 1
        if self._raise:
            raise RuntimeError("AI upstream error")
        return {"response": self._response, "usage": self._usage}


def _service(db, ai):
    return AnalysisService(
        db=db, ai_binding=ai,
        claim_repo=CandidateClaimRepository(db),
        finding_repo=VerificationFindingRepository(db),
        version_repo=ContentVersionRepository(db),
        fact_repo=ApprovedFactRepository(db),
        evidence_repo=EvidenceRepository(db),
        terminology_repo=TerminologyRepository(db),
        dependency_repo=ClaimFactDependencyRepository(db),
        audit_repo=AuditEventRepository(db),
        engine=VerificationEngine(),
        extraction_service=ClaimExtractionService(),
    )


VALID_AI = json.dumps([
    {"claim_text": "Reduces dark spots by 40 percent.", "claim_type": "factual",
     "numeric_value": 40, "unit": "percent", "qualifier": None, "scope": None},
    {"claim_text": "Miracle results for all.", "claim_type": "promotional",
     "numeric_value": None, "unit": None, "qualifier": None, "scope": None},
])


def test_analyze_returns_claims_and_findings():
    db = _db()
    ai = FakeAI(VALID_AI)
    result = _run(_service(db, ai).analyze("ws-1", "cv-1"))
    assert result["content_version_id"] == "cv-1"
    assert result["extraction_batch_id"]
    assert result["analysis_batch_id"]
    assert len(result["claims"]) == 2
    assert result["claims"][0]["text"] == "Reduces dark spots by 40 percent."
    assert result["claims"][0]["numeric_value"] == "40"
    # Findings: numeric_mismatch (40 vs 30) + unapproved_terminology (miracle)
    types = {f["finding_type"] for f in result["findings"]}
    assert "numeric_mismatch" in types
    assert "unapproved_terminology" in types
    # Claims persisted
    claims = _run(db.prepare("SELECT COUNT(*) AS n FROM candidate_claim").first())
    assert claims["n"] == 2
    # Findings persisted
    findings = _run(db.prepare("SELECT COUNT(*) AS n FROM verification_finding").first())
    assert findings["n"] == len(result["findings"])
    # Audit event appended
    audits = _run(db.prepare("SELECT COUNT(*) AS n FROM audit_event WHERE action='run_verification'").first())
    assert audits["n"] == 1
    # No remote AI call beyond one
    assert ai.calls == 1


def test_analyze_claims_not_overwritten_on_rerun():
    db = _db()
    ai = FakeAI(VALID_AI)
    _run(_service(db, ai).analyze("ws-1", "cv-1"))
    count1 = _run(db.prepare("SELECT COUNT(*) AS n FROM candidate_claim").first())["n"]
    # Second analysis with a NEW batch id (AI returns different claims)
    ai2 = FakeAI(json.dumps([{"claim_text": "New claim.", "claim_type": None,
                              "numeric_value": None, "unit": None, "qualifier": None,
                              "scope": None}]))
    _run(_service(db, ai2).analyze("ws-1", "cv-1"))
    count2 = _run(db.prepare("SELECT COUNT(*) AS n FROM candidate_claim").first())["n"]
    assert count2 == count1 + 1  # new claim added, old preserved


def test_analyze_content_version_not_found():
    db = _db()
    ai = FakeAI(VALID_AI)
    with pytest.raises(Exception) as exc:
        _run(_service(db, ai).analyze("ws-1", "cv-missing"))
    from fastapi import HTTPException
    assert isinstance(exc.value, HTTPException)
    assert exc.value.status_code == 404


def test_analyze_cross_workspace_rejected():
    db = _db()
    ai = FakeAI(VALID_AI)
    with pytest.raises(Exception) as exc:
        _run(_service(db, ai).analyze("ws-other", "cv-1"))
    from fastapi import HTTPException
    assert isinstance(exc.value, HTTPException)
    assert exc.value.status_code == 404


def test_analyze_ai_binding_unavailable():
    db = _db()
    with pytest.raises(Exception) as exc:
        _run(_service(db, None).analyze("ws-1", "cv-1"))
    from fastapi import HTTPException
    assert isinstance(exc.value, HTTPException)
    assert exc.value.status_code == 502


def test_analyze_ai_service_error():
    db = _db()
    ai = FakeAI(VALID_AI, raise_on_call=True)
    with pytest.raises(Exception) as exc:
        _run(_service(db, ai).analyze("ws-1", "cv-1"))
    from fastapi import HTTPException
    assert isinstance(exc.value, HTTPException)
    assert exc.value.status_code == 502


def test_analyze_empty_content():
    db = _db()
    # Insert an empty content version
    conn = db._conn
    conn.execute(
        "INSERT INTO content_version (id,workspace_id,content_item_id,version_number,body_text,sha256_hash,submitted_by,created_at) "
        "VALUES ('cv-empty','ws-1','ci-1',2,'','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','c','2026-01-01T00:00:00Z')"
    )
    conn.commit()
    ai = FakeAI(VALID_AI)
    with pytest.raises(Exception) as exc:
        _run(_service(db, ai).analyze("ws-1", "cv-empty"))
    from fastapi import HTTPException
    assert isinstance(exc.value, HTTPException)
    assert exc.value.status_code == 400
