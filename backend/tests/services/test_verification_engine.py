"""
M3-02 to M3-04 deterministic verification engine tests.

Covers all seven canonical finding types with positive, negative and
boundary/null cases. Uses Decimal for exact numeric comparison and an
injectable clock for expiry tests (no dependence on machine date).
"""
from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.services.verification_engine import (
    FINDING_TYPES,
    SEVERITIES,
    Finding,
    VerificationEngine,
)


def _claim(cid, text, numeric_value_text=None, unit=None, qualifier=None, scope=None,
           cv="cv-1"):
    return {
        "id": cid, "content_version_id": cv,
        "claim_text": text,
        "numeric_value_text": numeric_value_text,
        "unit": unit, "qualifier": qualifier, "scope": scope,
    }


def _fact(fid, text, numeric_value=None, unit=None, qualifier=None, scope=None,
          version=1):
    return {
        "id": fid, "claim_text": text, "numeric_value": numeric_value,
        "unit": unit, "qualifier": qualifier, "scope": scope, "version": version,
    }


def _fixed_clock(dt: datetime):
    return lambda: dt


NOW = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)


def _engine(clock=NOW):
    return VerificationEngine(clock=clock)


# ------------------------------------------------------------------ #
# Fixtures / shared data
# ------------------------------------------------------------------ #
BASE_CLAIMS = [
    _claim("c1", "Reduces dark spots by 40 percent.", "40", "percent", None,
           '{"product": "Glow Cream", "region": "IN"}'),
]
BASE_FACTS = [
    _fact("f1", "Reduces dark spots by up to 30 percent.", "30", "percent",
          "up to", '{"product": "Glow Cream", "region": "IN", "valid_until": "2027-06-30"}'),
]


def _run_engine(claims, facts, deps=None, clock=None, terminology=None):
    eng = VerificationEngine(clock=clock) if clock else VerificationEngine()
    return eng.verify(
        claims=claims, facts=facts, evidence=[], terminology=terminology or [],
        dependencies=deps, analysis_batch_id="batch-1",
        content_version_id="cv-1",
    )


# ------------------------------------------------------------------ #
# Canonical types / severities
# ------------------------------------------------------------------ #
def test_canonical_finding_types():
    assert set(FINDING_TYPES) == {
        "unsupported_claim", "numeric_mismatch", "claim_stronger_than_evidence",
        "missing_qualifier", "scope_mismatch", "expired_offer",
        "unapproved_terminology",
    }


def test_canonical_severities():
    assert set(SEVERITIES) == {"critical", "high", "medium", "low"}


# ------------------------------------------------------------------ #
# Rule 1: unsupported_claim
# ------------------------------------------------------------------ #
def test_unsupported_claim_positive():
    findings = _run_engine([_claim("c1", "Unsubstantiated miracle cure.")], [])
    u = [f for f in findings if f.finding_type == "unsupported_claim"]
    assert len(u) == 1
    assert u[0].severity == "high"
    assert u[0].claim_id == "c1"


def test_unsupported_claim_negative_supported():
    findings = _run_engine(BASE_CLAIMS, BASE_FACTS,
                           deps={"c1": ["f1"]})
    u = [f for f in findings if f.finding_type == "unsupported_claim"]
    assert u == []


# ------------------------------------------------------------------ #
# Rule 2: numeric_mismatch (Decimal exact)
# ------------------------------------------------------------------ #
def test_numeric_mismatch_positive():
    findings = _run_engine(BASE_CLAIMS, BASE_FACTS, deps={"c1": ["f1"]})
    n = [f for f in findings if f.finding_type == "numeric_mismatch"]
    assert len(n) == 1
    assert "40" in n[0].explanation and "30" in n[0].explanation
    assert n[0].related_fact_id == "f1"


def test_numeric_mismatch_negative_equal():
    claims = [_claim("c1", "Reduces by 30 percent.", "30", "percent")]
    facts = [_fact("f1", "Reduces by up to 30 percent.", "30", "percent", "up to")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    n = [f for f in findings if f.finding_type == "numeric_mismatch"]
    assert n == []


def test_numeric_mismatch_integer_preserved():
    # Claim "40" (int-like string) vs fact "40" — exact, no float conversion.
    claims = [_claim("c1", "Reduces by 40 percent.", "40", "percent")]
    facts = [_fact("f1", "Reduces by 40 percent.", "40", "percent")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    n = [f for f in findings if f.finding_type == "numeric_mismatch"]
    assert n == []


def test_numeric_mismatch_decimal_exact():
    # 40.5 vs 40.50 — Decimal treats as equal (no float noise).
    claims = [_claim("c1", "Reduces by 40.5 percent.", "40.5", "percent")]
    facts = [_fact("f1", "Reduces by 40.50 percent.", "40.50", "percent")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    n = [f for f in findings if f.finding_type == "numeric_mismatch"]
    assert n == []


def test_numeric_mismatch_null_values():
    claims = [_claim("c1", "Best platform.", None)]
    facts = [_fact("f1", "Best platform.", None)]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    n = [f for f in findings if f.finding_type == "numeric_mismatch"]
    assert n == []


# ------------------------------------------------------------------ #
# Rule 3: claim_stronger_than_evidence
# ------------------------------------------------------------------ #
def test_claim_stronger_than_evidence_positive():
    claims = [_claim("c1", "Cures dark spots for everyone.", None, None, "universal")]
    facts = [_fact("f1", "May reduce dark spots in a pilot.", None, None, "pilot")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    s = [f for f in findings if f.finding_type == "claim_stronger_than_evidence"]
    assert len(s) == 1
    assert s[0].severity == "medium"


def test_claim_stronger_than_evidence_negative():
    claims = [_claim("c1", "May reduce dark spots.", None, None, "may")]
    facts = [_fact("f1", "Reduces dark spots in a pilot.", None, None, "pilot")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    s = [f for f in findings if f.finding_type == "claim_stronger_than_evidence"]
    assert s == []


# ------------------------------------------------------------------ #
# Rule 4: missing_qualifier
# ------------------------------------------------------------------ #
def test_missing_qualifier_positive():
    claims = [_claim("c1", "Reduces dark spots by 30 percent.", None, None, None)]
    facts = [_fact("f1", "Reduces dark spots by up to 30 percent.", None, None, "up to")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    m = [f for f in findings if f.finding_type == "missing_qualifier"]
    assert len(m) == 1
    assert "up to" in m[0].explanation
    assert m[0].related_fact_id == "f1"


def test_missing_qualifier_negative_present():
    claims = [_claim("c1", "Reduces dark spots by up to 30 percent.", None, None, "up to")]
    facts = [_fact("f1", "Reduces dark spots by up to 30 percent.", None, None, "up to")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    m = [f for f in findings if f.finding_type == "missing_qualifier"]
    assert m == []


def test_missing_qualifier_negative_no_required():
    claims = [_claim("c1", "Reduces dark spots.", None, None, None)]
    facts = [_fact("f1", "Reduces dark spots.", None, None, None)]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    m = [f for f in findings if f.finding_type == "missing_qualifier"]
    assert m == []


# ------------------------------------------------------------------ #
# Rule 5: scope_mismatch
# ------------------------------------------------------------------ #
def test_scope_mismatch_positive():
    claims = [_claim("c1", "Works in all regions.", None, None, None,
                     '{"region": "GLOBAL"}')]
    facts = [_fact("f1", "Works in India.", None, None, None,
                   '{"region": "IN"}')]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    s = [f for f in findings if f.finding_type == "scope_mismatch"]
    assert len(s) == 1


def test_scope_mismatch_negative():
    claims = [_claim("c1", "Works in India.", None, None, None,
                     '{"region": "IN"}')]
    facts = [_fact("f1", "Works in India.", None, None, None,
                   '{"region": "IN"}')]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    s = [f for f in findings if f.finding_type == "scope_mismatch"]
    assert s == []


# ------------------------------------------------------------------ #
# Rule 6: expired_offer (injectable clock)
# ------------------------------------------------------------------ #
def test_expired_offer_positive():
    clock = _fixed_clock(datetime(2026, 7, 1, tzinfo=timezone.utc))  # after expiry
    claims = [_claim("c1", "Limited time offer.")]
    facts = [_fact("f1", "Limited time offer.", None, None, None,
                   '{"valid_until": "2026-06-30"}')]
    findings = VerificationEngine(clock=clock).verify(
        claims=claims, facts=facts, evidence=[], terminology=[],
        dependencies={"c1": ["f1"]}, analysis_batch_id="b",
        content_version_id="cv-1",
    )
    e = [f for f in findings if f.finding_type == "expired_offer"]
    assert len(e) == 1
    assert e[0].severity == "critical"


def test_expired_offer_negative_not_yet_expired():
    clock = _fixed_clock(datetime(2026, 5, 1, tzinfo=timezone.utc))  # before expiry
    claims = [_claim("c1", "Limited time offer.")]
    facts = [_fact("f1", "Limited time offer.", None, None, None,
                   '{"valid_until": "2026-06-30"}')]
    findings = VerificationEngine(clock=clock).verify(
        claims=claims, facts=facts, evidence=[], terminology=[],
        dependencies={"c1": ["f1"]}, analysis_batch_id="b",
        content_version_id="cv-1",
    )
    e = [f for f in findings if f.finding_type == "expired_offer"]
    assert e == []


def test_expired_offer_negative_no_date():
    claims = [_claim("c1", "Offer.")]
    facts = [_fact("f1", "Offer.", None, None, None, {})]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    e = [f for f in findings if f.finding_type == "expired_offer"]
    assert e == []


# ------------------------------------------------------------------ #
# Rule 7: unapproved_terminology (word boundary)
# ------------------------------------------------------------------ #
def test_unapproved_terminology_positive():
    terminology = [{"term": "miracle", "status": "denied"}]
    claims = [_claim("c1", "Miracle results for all.", None)]
    findings = _run_engine(claims, [], terminology=terminology)
    u = [f for f in findings if f.finding_type == "unapproved_terminology"]
    assert len(u) == 1
    assert u[0].severity == "critical"


def test_unapproved_terminology_negative_approved_term():
    terminology = [{"term": "clinically shown", "status": "approved"}]
    claims = [_claim("c1", "Clinically shown results.", None)]
    findings = _run_engine(claims, [], terminology=terminology)
    u = [f for f in findings if f.finding_type == "unapproved_terminology"]
    assert u == []


def test_unapproved_terminology_negative_no_word_boundary():
    # "miraculous" contains "miracle" but is a different word — not flagged.
    terminology = [{"term": "miracle", "status": "denied"}]
    claims = [_claim("c1", "The results are miraculous.", None)]
    findings = _run_engine(claims, [], terminology=terminology)
    u = [f for f in findings if f.finding_type == "unapproved_terminology"]
    assert u == []


# ------------------------------------------------------------------ #
# Finding structure / quality
# ------------------------------------------------------------------ #
def test_finding_structure():
    findings = _run_engine([_claim("c1", "Unsupported.")], [])
    f = findings[0]
    assert isinstance(f, Finding)
    assert f.finding_type in FINDING_TYPES
    assert f.severity in SEVERITIES
    assert f.content_version_id == "cv-1"
    assert f.claim_id == "c1"
    assert f.explanation
    assert f.analysis_batch_id == "batch-1"


def test_dedupe_same_claim_type():
    # Same claim+fact can only produce one finding of a given type.
    claims = [_claim("c1", "Reduces by 40 percent.", "40", "percent")]
    facts = [_fact("f1", "Reduces by up to 30 percent.", "30", "percent", "up to")]
    findings = _run_engine(claims, facts, deps={"c1": ["f1"]})
    types = [f.finding_type for f in findings]
    assert types.count("numeric_mismatch") == 1


def test_all_seven_types_covered():
    """Exercise all seven finding types in a single run."""
    claims = [
        _claim("c1", "Unsupported claim here.", None),
        _claim("c2", "Reduces by 40 percent.", "40", "percent"),
        _claim("c3", "Stronger claim.", None, None, "universal"),
        _claim("c4", "Missing qualifier.", None, None, None),
        _claim("c5", "Wrong region.", None, None, None, '{"region": "GLOBAL"}'),
        _claim("c6", "Expired deal.", None),
        _claim("c7", "Miracle product.", None),
    ]
    facts = [
        _fact("f1", "Supported fact.", "30", "percent", "up to",
              '{"region": "IN", "valid_until": "2025-01-01"}'),
        _fact("f2", "Stronger evidence.", None, None, "pilot"),
    ]
    terminology = [{"term": "miracle", "status": "denied"}]
    clock = _fixed_clock(datetime(2026, 7, 1, tzinfo=timezone.utc))
    findings = VerificationEngine(clock=clock).verify(
        claims=claims, facts=facts, evidence=[], terminology=terminology,
        dependencies={"c1": [], "c2": ["f1"], "c3": ["f2"], "c4": ["f1"],
                      "c5": ["f1"], "c6": ["f1"], "c7": []},
        analysis_batch_id="b", content_version_id="cv-1",
    )
    types_found = {f.finding_type for f in findings}
    assert types_found == set(FINDING_TYPES)
