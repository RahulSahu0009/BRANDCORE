# BRANDCORE — Task Board

**Living document.** Update after every meaningful change.
**Status values:** `TODO` · `IN PROGRESS` · `BLOCKED` · `DONE` · `VERIFIED`
**Round 2 deadline:** CodeNexus India 2026 (confirm exact date with organizers)

---

## Milestone 0 — Repository Bootstrap

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M0-01 | Create repository structure and all required documents | Mritunjay | DONE | — | All 8 core docs exist; 0 TypeScript files; FILE_INVENTORY.json accurate (61 files); 3/3 tests passed 2026-11-04 |
| M0-02 | Initialize git repository and create develop branch | Mritunjay | TODO | M0-01 | `git status` clean on develop; main and develop branches exist |
| M0-03 | Verify Cloudflare Python Workers proof-of-concept gate | Mritunjay | TODO | M0-01 | All 5 POC checks in `docs/ARCHITECTURE.md` §9 pass with evidence |

---

## Milestone 1 — Runtime Proof of Concept (Mritunjay)

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M1-01 | FastAPI health endpoint runs in pywrangler local dev | Mritunjay | VERIFIED | M0-01 | `GET /api/health` → `{"status":"ok","version":"0.1.0"}` HTTP 200 via `uv run pywrangler dev --local`; wrangler 4.157.0; 2026-11-04 |
| M1-02 | Vite production build served by Worker via Workers Static Assets | Mritunjay | VERIFIED | M1-01 | `npm run build` → 145.63 kB JS (47.08 kB gzip); `GET /` → HTTP 200 `text/html` from same Worker origin; 2026-11-04 |
| M1-03 | D1 binding: parameterized write and read in Python Worker runtime | Mritunjay | VERIFIED | M1-01 | `POST /api/poc/d1` → insert + read back via `env.DB`; migration `0001_poc_records.sql` applied locally; 2026-11-04 |
| M1-04 | R2 binding: store and retrieve a private test object | Mritunjay | VERIFIED | M1-01 | `POST /api/poc/r2` → `env.ASSETS.put/get` verified with fixed POC key; 2026-11-04 |
| M1-06 | Workers AI binding: bounded structured response validated with Pydantic | Mritunjay | **VERIFIED** | M1-01 | Gate B and Gate B-sub approved. `brandcore.workers.dev` registered. Attempts 1–3 failed (upstream error; Pydantic schema mismatch ×2). Schema-fix approval granted 2026-11-04: `claim_type: str \| None`, `numeric_value: str \| int \| float \| None`, raw+usage captured before Pydantic; 9/9 local tests passed. Attempt 4 (final authorization): HTTP 200 (4.262s); Pydantic PASS; `claim_type: null`, `numeric_value: 40` (int) accepted; `unit: "percent"`, `qualifier: "up to"`; prompt_tokens: 86, completion_tokens: 64, total_tokens: 150; raw and usage captured. Evidence: `docs/evidence/M1-06/attempt-4-final/`. 2026-11-04 |
| M1-07 | Document POC results in `docs/ARCHITECTURE.md` and `docs/TOOLING_AUDIT.md` | Mritunjay | DONE | M1-01–M1-06 | §9 updated with evidence for all checks; TOOLING_AUDIT.md updated; 2026-11-04 |
| M1-08 | POC route security guard: `require_development_env` dependency on `/api/poc/*` | Mritunjay | DONE | M1-06 | `src/app/api/dependencies.py` created; `src/app/main.py` updated; `wrangler.jsonc` `vars.BRANDCORE_ENV` set for default (development) and production; 8 new tests in `test_poc_guard.py` — 17/17 total tests pass; security-checklist controls 5, 9, 18 updated; 2026-11-04 |

---

## Milestone 2 — Data Foundation (Mritunjay)

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M2-01 | Write D1 migration: workspace, evidence, approved_fact, policy, terminology | Mritunjay | TODO | M1-03 | Migration runs; tables created; rollback tested |
| M2-02 | Write D1 migration: content_item, content_version, candidate_claim, verification_finding | Mritunjay | TODO | M2-01 | Migration runs; tables created; rollback tested |
| M2-03 | Write D1 migration: claim_fact_dependency, review_decision, release_passport, release_status_event, audit_event | Mritunjay | TODO | M2-02 | Migration runs; tables created; rollback tested |
| M2-04 | Seed demo workspace with fictional brand data | Mritunjay | TODO | M2-03 | Demo workspace loads with facts, evidence and content items |
| M2-05 | Repository layer: workspace, fact, evidence CRUD with parameterized SQL | Mritunjay | TODO | M2-01 | Unit tests pass; no SQL concatenation; workspace-scoped queries |
| M2-06 | Repository layer: content version, claim, finding, review decision | Mritunjay | TODO | M2-02 | Unit tests pass; immutability enforced |
| M2-07 | Repository layer: release passport, status events, dependency traversal | Mritunjay | TODO | M2-03 | Unit tests pass; passport immutability enforced; stale query works |

---

## Milestone 3 — Claim Analysis Engine (Mritunjay)

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M3-01 | AI service: extract candidate claims from content version using Workers AI | Mritunjay | TODO | M1-06, M2-06 | Claims extracted; Pydantic model validates output; test passes |
| M3-02 | Deterministic check: unsupported claim and numeric mismatch | Mritunjay | TODO | M2-05 | Unit tests cover both finding types with positive and negative cases |
| M3-03 | Deterministic check: claim stronger than evidence, missing qualifier | Mritunjay | TODO | M2-05 | Unit tests cover both finding types |
| M3-04 | Deterministic check: scope mismatch, expired offer, unapproved terminology | Mritunjay | TODO | M2-05 | Unit tests cover all three finding types |
| M3-05 | API endpoint: POST /api/workspaces/:id/content/:vid/analyze | Mritunjay | TODO | M3-01–M3-04 | Returns structured findings; all 7 finding types detectable |

---

## Milestone 4 — Content Review UI (Rahul)

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M4-01 | Content submission form (uses mock API until M3-05 is available) | Rahul | TODO | M0-01 | Form submits content; shows loading/error/success states |
| M4-02 | Findings display: finding card component with all 7 finding types | Rahul | TODO | M4-01 | Each finding type renders correctly; color + text label; no dangerouslySetInnerHTML |
| M4-03 | Review decision UI: approve / request changes / reject | Rahul | TODO | M4-02 | Decision recorded; confirmation shown; no auto-approval path |
| M4-04 | Content version history list | Rahul | TODO | M4-01 | Versions listed with status badges; immutability clear in UI |
| M4-05 | Replace mock API with real endpoints (M3-05, M2-06) | Rahul | TODO | M3-05, M2-06 | Mock fixtures removed from core workflow; real API used |
| M4-06 | Accessibility pass: keyboard nav, focus order, axe scan | Rahul | TODO | M4-05 | axe reports 0 serious/critical; full keyboard path works |

---

## Milestone 5 — Brand Governance and Release UI (Arvind)

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M5-01 | Approved facts list and create/edit form (uses mock API) | Arvind | TODO | M0-01 | Facts listed with scope, qualifier, evidence ref; form validates |
| M5-02 | Evidence reference management UI | Arvind | TODO | M5-01 | Evidence records listed; linked to facts |
| M5-03 | Release Passport list with status badges | Arvind | TODO | M0-01 | Passports listed; VALID/STALE/REVOKED/INVALID badges shown |
| M5-04 | Stale impact view: which releases are affected by a fact change | Arvind | TODO | M5-03 | Stale releases listed with reason; revalidation action available |
| M5-05 | Replace mock API with real endpoints (M2-05, M2-07) | Arvind | TODO | M2-05, M2-07 | Mock fixtures removed from core workflow; real API used |
| M5-06 | Accessibility pass: keyboard nav, focus order, axe scan | Arvind | TODO | M5-05 | axe reports 0 serious/critical; full keyboard path works |

---

## Milestone 6 — Integration and Release (All)

| ID | Task | Owner | Status | Depends On | Acceptance Criteria |
|----|------|-------|--------|-----------|---------------------|
| M6-01 | End-to-end workflow test: submit → analyze → review → passport → stale | Mritunjay | TODO | M3-05, M4-05, M5-05 | All 11 steps in `docs/PRD.md` §4 complete without errors |
| M6-02 | Security checklist review: update evidence for all verified controls | Mritunjay | TODO | M6-01 | All applicable controls have evidence; NOT APPLICABLE items documented |
| M6-03 | Performance measurement: Lighthouse mobile on deployed build | Rahul | TODO | M6-01 | LCP, INP, CLS, JS budget measured and recorded in `docs/PRD.md` |
| M6-04 | Final PR review and merge to main | All | TODO | M6-01–M6-03 | All gates pass; no TypeScript; no secrets; TASKS and MEMORY current |

---

## Round 3 Improvements

1. **Real workspace onboarding** — multi-tenant setup with proper authentication, organization administration and production security review.
2. **Richer evidence management** — structured evidence documents, version diffs, evidence expiry tracking and evidence coverage reports.
3. **Audit and compliance reporting** — exportable audit trails, policy coverage reports, revalidation history and a brand operations dashboard.
