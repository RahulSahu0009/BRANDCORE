"""
BRANDCORE — M2-04 fictional demo workspace seed.

Idempotent: re-running creates no duplicate data. Uses deterministic
uuid5 identifiers derived from meaningful names so every run targets the
same logical rows. All writes use parameterized SQL.

Designed to work against any D1/sqlite3 Connection object, so it is testable
without a live Cloudflare binding. Pass a sqlite3.Connection (tests) or the
D1 binding connection (runtime) to seed().
"""
import hashlib
import json
import uuid

DEMO_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def _did(name: str) -> str:
    """Deterministic demo id for a named entity."""
    return str(uuid.uuid5(DEMO_NAMESPACE, f"brandcore:demo:{name}"))


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _exec(conn, sql, params=()):
    conn.execute(sql, params)


def _insert_if_missing(conn, table, id_col, id_val, columns, values):
    """Idempotent insert: only when no existing row with id_val in id_col."""
    placeholders = ", ".join(["?"] * len(values))
    cols = ", ".join(columns)
    sql = (
        f"INSERT INTO {table} ({id_col}, {cols}) "
        f"SELECT ?, {placeholders} "
        f"WHERE NOT EXISTS (SELECT 1 FROM {table} WHERE {id_col} = ?)"
    )
    conn.execute(sql, (id_val, *values, id_val))


def seed(conn) -> dict:
    """Seed the fictional demo workspace idempotently. Returns key entity ids."""
    created = _now()
    ws = _did("workspace")

    # ---- Workspace -------------------------------------------------------
    _insert_if_missing(conn, "workspace", "id", ws,
        ["name", "slug", "demo_flag", "status", "created_at", "updated_at"],
        ["Lumora Skincare", "lumora-skincare", 1, "active", created, created])

    # ---- Evidence --------------------------------------------------------
    ev_study = _did("evidence-internal-study")
    ev_report = _did("evidence-third-party-report")
    _insert_if_missing(conn, "evidence", "id", ev_study,
        ["workspace_id", "title", "source_type", "summary", "source_url", "version", "status", "created_at"],
        [ws, "Lumora Glow Cream 8-week clinical study", "internal_study",
         "Double-blind study showing up to 30% dark-spot reduction in 8 weeks.",
         "internal://lumora/study/glow-cream-2026", 1, "active", created])
    _insert_if_missing(conn, "evidence", "id", ev_report,
        ["workspace_id", "title", "source_type", "summary", "source_url", "version", "status", "created_at"],
        [ws, "Dermatology third-party sensitivity report", "third_party_report",
         "Panel of 50 subjects; product rated non-irritating for sensitive skin.",
         "internal://lumora/report/sensitivity-2026", 1, "active", created])

    # ---- Approved facts --------------------------------------------------
    fact_dark_spots = _did("fact-dark-spots")
    fact_sensitive = _did("fact-sensitive-skin")
    fact_spf = _did("fact-spf-50")
    _insert_if_missing(conn, "approved_fact", "id", fact_dark_spots,
        ["workspace_id", "claim_text", "numeric_value", "unit", "qualifier",
         "scope", "version", "status", "previous_version_id", "created_by", "created_at"],
        [ws, "Lumora Glow Cream reduces the appearance of dark spots by up to 30 percent in 8 weeks.",
         "30", "percent", "up to",
         json.dumps({"product": "Lumora Glow Cream", "region": "IN", "valid_until": "2027-06-30"}),
         1, "active", None, "brand_admin", created])
    _insert_if_missing(conn, "approved_fact", "id", fact_sensitive,
        ["workspace_id", "claim_text", "numeric_value", "unit", "qualifier",
         "scope", "version", "status", "previous_version_id", "created_by", "created_at"],
        [ws, "Dermatologist-tested for sensitive skin; non-irritating.",
         None, None, None,
         json.dumps({"product": "Lumora Glow Cream", "region": "IN"}),
         1, "active", None, "brand_admin", created])
    _insert_if_missing(conn, "approved_fact", "id", fact_spf,
        ["workspace_id", "claim_text", "numeric_value", "unit", "qualifier",
         "scope", "version", "status", "previous_version_id", "created_by", "created_at"],
        [ws, "SPF 50 sun protection.", "50", "SPF", None,
         json.dumps({"product": "Lumora Glow Cream", "region": "IN", "valid_until": "2027-06-30"}),
         1, "active", None, "brand_admin", created])

    # ---- Fact-to-evidence ------------------------------------------------
    _insert_if_missing(conn, "fact_evidence", "fact_id", fact_dark_spots,
        ["fact_workspace", "evidence_id", "ev_workspace", "linked_at"],
        [ws, ev_study, ws, created])
    _insert_if_missing(conn, "fact_evidence", "fact_id", fact_sensitive,
        ["fact_workspace", "evidence_id", "ev_workspace", "linked_at"],
        [ws, ev_report, ws, created])

    # ---- Policies --------------------------------------------------------
    policy = _did("policy-brand-voice")
    _insert_if_missing(conn, "policy", "id", policy,
        ["workspace_id", "name", "description", "rules_json", "version", "status",
         "previous_version_id", "created_by", "created_at"],
        [ws, "Lumora brand voice policy",
         "Marketing claims must stay within approved fact scope and qualifiers.",
         "[]", 1, "active", None, "brand_admin", created])

    # ---- Terminology -----------------------------------------------------
    term_approved = _did("term-dermatologist-tested")
    term_denied = _did("term-miracle")
    term_preferred = _did("term-clinically-shown")
    _insert_if_missing(conn, "terminology", "id", term_approved,
        ["workspace_id", "term", "status", "notes", "created_at", "updated_at"],
        [ws, "dermatologist-tested", "approved", "Allowed per sensitivity report.", created, created])
    _insert_if_missing(conn, "terminology", "id", term_denied,
        ["workspace_id", "term", "status", "notes", "created_at", "updated_at"],
        [ws, "miracle", "denied", "Overstates efficacy; not permitted.", created, created])
    _insert_if_missing(conn, "terminology", "id", term_preferred,
        ["workspace_id", "term", "status", "notes", "created_at", "updated_at"],
        [ws, "clinically shown", "preferred", "Preferred over 'proven'.", created, created])

    # ---- Content item ----------------------------------------------------
    content_item = _did("content-summer-campaign")
    _insert_if_missing(conn, "content_item", "id", content_item,
        ["workspace_id", "title", "status", "created_by", "created_at", "updated_at"],
        [ws, "Summer Campaign Launch", "active", "creator", created, created])

    # ---- Content versions (two sequential versions) ----------------------
    body_v1 = ("Lumora Glow Cream reduces dark spots by 40 percent overnight. "
               "Miracle results for all skin types. SPF 50 protection.")
    body_v2 = ("Lumora Glow Cream reduces the appearance of dark spots by up to "
               "30 percent in 8 weeks. Dermatologist-tested for sensitive skin. "
               "SPF 50 sun protection.")
    sha_v1 = _sha(body_v1)
    sha_v2 = _sha(body_v2)
    cv_v1 = _did("content-version-summer-v1")
    cv_v2 = _did("content-version-summer-v2")
    _insert_if_missing(conn, "content_version", "id", cv_v1,
        ["workspace_id", "content_item_id", "version_number", "body_text", "sha256_hash",
         "submitted_by", "created_at"],
        [ws, content_item, 1, body_v1, sha_v1, "creator", created])
    _insert_if_missing(conn, "content_version", "id", cv_v2,
        ["workspace_id", "content_item_id", "version_number", "body_text", "sha256_hash",
         "submitted_by", "created_at"],
        [ws, content_item, 2, body_v2, sha_v2, "creator", created])

    # ---- Candidate claims (extraction batch on v1) -----------------------
    batch = _did("extraction-summer-v1")
    claim_dark = _did("claim-dark-spots-v1")
    claim_miracle = _did("claim-miracle-v1")
    claim_all_skin = _did("claim-all-skin-v1")
    claim_spf = _did("claim-spf-v1")
    _insert_if_missing(conn, "candidate_claim", "id", claim_dark,
        ["workspace_id", "content_version_id", "claim_text", "claim_type",
         "numeric_value_text", "unit", "qualifier", "scope", "extraction_batch_id",
         "extracted_by", "extracted_at"],
        [ws, cv_v1, "Lumora Glow Cream reduces dark spots by 40 percent overnight.",
         "promotional", "40", "percent", None,
         json.dumps({"product": "Lumora Glow Cream", "region": "IN"}), batch, "model", created])
    _insert_if_missing(conn, "candidate_claim", "id", claim_miracle,
        ["workspace_id", "content_version_id", "claim_text", "claim_type",
         "numeric_value_text", "unit", "qualifier", "scope", "extraction_batch_id",
         "extracted_by", "extracted_at"],
        [ws, cv_v1, "Lumora Glow Cream delivers miracle results.", "promotional", None, None, None,
         json.dumps({"product": "Lumora Glow Cream", "region": "IN"}), batch, "model", created])
    _insert_if_missing(conn, "candidate_claim", "id", claim_all_skin,
        ["workspace_id", "content_version_id", "claim_text", "claim_type",
         "numeric_value_text", "unit", "qualifier", "scope", "extraction_batch_id",
         "extracted_by", "extracted_at"],
        [ws, cv_v1, "Works for all skin types.", "general", None, None, None,
         json.dumps({"region": "IN"}), batch, "model", created])
    _insert_if_missing(conn, "candidate_claim", "id", claim_spf,
        ["workspace_id", "content_version_id", "claim_text", "claim_type",
         "numeric_value_text", "unit", "qualifier", "scope", "extraction_batch_id",
         "extracted_by", "extracted_at"],
        [ws, cv_v1, "SPF 50 sun protection.", "factual", "50", "SPF", None,
         json.dumps({"product": "Lumora Glow Cream", "region": "IN"}), batch, "model", created])

    # ---- Verification findings (analysis batch on v1) --------------------
    analysis_batch = _did("analysis-summer-v1")
    finding_numeric = _did("finding-numeric-mismatch")
    finding_terminology = _did("finding-unapproved-terminology")
    finding_qualifier = _did("finding-missing-qualifier")
    finding_scope = _did("finding-scope-mismatch")
    _insert_if_missing(conn, "verification_finding", "id", finding_numeric,
        ["workspace_id", "content_version_id", "claim_id", "finding_type", "severity",
         "explanation", "suggested_correction", "analysis_batch_id", "created_at"],
        [ws, cv_v1, claim_dark, "numeric_mismatch", "high",
         "Claim states 40 percent but approved fact supports up to 30 percent.",
         'Change "40 percent" to "up to 30 percent" to match the approved fact.',
         analysis_batch, created])
    _insert_if_missing(conn, "verification_finding", "id", finding_terminology,
        ["workspace_id", "content_version_id", "claim_id", "finding_type", "severity",
         "explanation", "suggested_correction", "analysis_batch_id", "created_at"],
        [ws, cv_v1, claim_miracle, "unapproved_terminology", "critical",
         'The term "miracle" is on the denied terminology list.',
         'Remove "miracle"; use "clinically shown" instead.',
         analysis_batch, created])
    _insert_if_missing(conn, "verification_finding", "id", finding_qualifier,
        ["workspace_id", "content_version_id", "claim_id", "finding_type", "severity",
         "explanation", "suggested_correction", "analysis_batch_id", "created_at"],
        [ws, cv_v1, claim_dark, "missing_qualifier", "medium",
         'Claim omits the required qualifier "up to" from the approved fact.',
         'Add the qualifier "up to" before the percentage.',
         analysis_batch, created])
    _insert_if_missing(conn, "verification_finding", "id", finding_scope,
        ["workspace_id", "content_version_id", "claim_id", "finding_type", "severity",
         "explanation", "suggested_correction", "analysis_batch_id", "created_at"],
        [ws, cv_v1, claim_all_skin, "scope_mismatch", "high",
         "Claim implies all skin types but the approved fact covers sensitive skin only.",
         "Restrict the claim to sensitive skin per the approved fact scope.",
         analysis_batch, created])

    # ---- Claim-to-fact dependencies --------------------------------------
    _insert_if_missing(conn, "claim_fact_dependency", "id", _did("dep-dark"),
        ["workspace_id", "claim_id", "claim_workspace", "fact_id", "fact_workspace",
         "dependency_type", "created_at"],
        [ws, claim_dark, ws, fact_dark_spots, ws, "supports", created])
    _insert_if_missing(conn, "claim_fact_dependency", "id", _did("dep-sensitive"),
        ["workspace_id", "claim_id", "claim_workspace", "fact_id", "fact_workspace",
         "dependency_type", "created_at"],
        [ws, claim_all_skin, ws, fact_sensitive, ws, "supports", created])
    _insert_if_missing(conn, "claim_fact_dependency", "id", _did("dep-spf"),
        ["workspace_id", "claim_id", "claim_workspace", "fact_id", "fact_workspace",
         "dependency_type", "created_at"],
        [ws, claim_spf, ws, fact_spf, ws, "supports", created])

    # ---- Review decision (human) -----------------------------------------
    review = _did("review-summer-v1")
    audit_review = _did("audit-review-summer-v1")
    _insert_if_missing(conn, "audit_event", "id", audit_review,
        ["workspace_id", "actor_id", "actor_role", "action", "entity_type", "entity_id",
         "details", "correlation_id", "created_at"],
        [ws, "reviewer-1", "reviewer", "review_decision", "review_decision", review,
         "{}", analysis_batch, created])
    _insert_if_missing(conn, "review_decision", "id", review,
        ["workspace_id", "content_version_id", "reviewer_id", "reviewer_role", "decision",
         "rationale", "notes", "analysis_batch_id", "created_at"],
        [ws, cv_v1, "reviewer-1", "reviewer", "changes_requested",
         "Claims exceed approved fact scope and qualifiers. Revise before approval.",
         "Address numeric mismatch, terminology, qualifier and scope findings.",
         analysis_batch, created])

    # ---- Release passport + status event ---------------------------------
    passport = _did("passport-summer-v1")
    audit_passport = _did("audit-passport-summer-v1")
    _insert_if_missing(conn, "audit_event", "id", audit_passport,
        ["workspace_id", "actor_id", "actor_role", "action", "entity_type", "entity_id",
         "details", "correlation_id", "created_at"],
        [ws, "reviewer-1", "reviewer", "release_passport", "release_passport", passport,
         "{}", analysis_batch, created])
    _insert_if_missing(conn, "release_passport", "id", passport,
        ["workspace_id", "content_item_id", "content_version_id", "content_sha256",
         "policy_version_id", "fact_evidence_versions", "finding_ids_and_dispositions",
         "approver_id", "approver_role", "decision_timestamp", "audit_reference", "status",
         "created_at"],
        [ws, content_item, cv_v2, sha_v2, policy, "[]", "[]", "reviewer-1", "reviewer",
         created, audit_passport, "valid", created])
    _insert_if_missing(conn, "release_status_event", "id", _did("event-passport-approved"),
        ["workspace_id", "passport_id", "passport_workspace", "status", "reason", "timestamp"],
        [ws, passport, ws, "approved", "Human reviewer approved content version 2.", created])

    conn.commit()

    return {
        "workspace": ws,
        "evidence_study": ev_study,
        "evidence_report": ev_report,
        "fact_dark_spots": fact_dark_spots,
        "fact_sensitive": fact_sensitive,
        "fact_spf": fact_spf,
        "policy": policy,
        "content_item": content_item,
        "content_version_v1": cv_v1,
        "content_version_v2": cv_v2,
        "sha_v1": sha_v1,
        "sha_v2": sha_v2,
        "extraction_batch": batch,
        "analysis_batch": analysis_batch,
        "claim_dark_spots": claim_dark,
        "claim_miracle": claim_miracle,
        "claim_all_skin": claim_all_skin,
        "claim_spf": claim_spf,
        "finding_numeric": finding_numeric,
        "finding_terminology": finding_terminology,
        "finding_qualifier": finding_qualifier,
        "finding_scope": finding_scope,
        "review_decision": review,
        "release_passport": passport,
    }


if __name__ == "__main__":
    import os
    import sqlite3

    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    mig_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "database", "migrations"))
    for name in sorted(os.listdir(mig_dir)):
        if name.endswith(".sql"):
            with open(os.path.join(mig_dir, name), encoding="utf-8") as f:
                conn.executescript(f.read())
    result = seed(conn)
    print("Seeded demo workspace:", result["workspace"])
    for k, v in result.items():
        if k != "workspace":
            print(f"  {k}: {v}")
