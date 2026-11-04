# BRANDCORE — Project Memory State

**Protocol:** This file is the single source of truth for current project state.
**Session start:** Read first; verify status against recent git commits.
**Updates:** After meaningful changes, when blocked, and at session end.
**Rule:** Record only facts. Never store secrets (keys, tokens, passwords, personal data). Keep compact.

---

## Project Overview

**Name:** BRANDCORE
**Objective:** Evidence-linked, explainable and change-aware brand governance.
**Tier / Mode:** T2 · Autonomy A1
**Event:** CodeNexus India 2026 · Team: SMRITUNJAY837

---

## Current State

**Milestone:** M1 — Cloudflare Runtime POC (5/5 checks PASS; M1-06 VERIFIED)
**Status:** M1 COMPLETE. All POC checks passed. Ready for Milestone 2.
**Last verified:** 2026-11-04 @ M1-06 attempt 4 PASS_REMOTE

---

## Verified Architecture & Entry Points

- Frontend: React + Vite + Tailwind CSS (JavaScript/JSX only) — built and served from Worker
- Backend: Python 3.14 FastAPI on Cloudflare Python Workers — running locally via pywrangler
- Worker entry point: `src/worker.py` — `Default = entrypoint(app)` pattern
- App modules: `src/app/main.py`, `src/app/api/health.py`, `src/app/api/poc.py`, `src/app/api/dependencies.py`
- Vendored packages: `python_modules/` (431 modules, 9.4 MB) — managed by `pywrangler sync`
- DB: Cloudflare D1 local simulation — `poc_records` table created, write/read verified
- Storage: Cloudflare R2 local simulation — put/get verified with fixed POC key
- AI: Cloudflare Workers AI — remote only; binding, model and Pydantic validation all verified PASS_REMOTE (attempt 4, 2026-11-04)
- Config: `wrangler.jsonc` — `compatibility_date: 2026-09-08`, `migrations_dir: database/migrations`
- Pyodide runtime: 3.14.2 (CPython 3.14) — confirmed by `pyodide-py==314.0.7`

---

## Completed Work (evidence-based)

- [x] M0: All 8 core docs, scaffold, 61 files — 2026-11-04
- [x] uv 0.13.7 installed (`C:\Users\smrit\.local\bin`)
- [x] `pyproject.toml` updated: uvicorn removed from runtime; workers-py, workers-runtime-sdk, pytest, httpx in dev group
- [x] `uv sync --group dev`: 30 packages installed; `uv.lock` generated — 2026-11-04
- [x] `uv run pytest backend/tests/test_health.py -v`: **3/3 passed** — 2026-11-04
- [x] `npm install` (frontend): 319 packages; `package-lock.json` generated — 2026-11-04
- [x] `npm run build`: **success** — 145.63 kB JS (47.08 kB gzip) — 2026-11-04
- [x] `pywrangler sync`: python_modules/ vendored (431 modules); pylock.toml generated — 2026-11-04
- [x] `wrangler.jsonc`: `compatibility_date` updated to `2026-09-08`; `migrations_dir` added
- [x] `src/worker.py`: `Default = entrypoint(app)` — correct Wrangler export pattern
- [x] `src/app/` created at project root (Worker-canonical location)
- [x] D1 migration `0001_poc_records.sql` applied locally — 2026-11-04
- [x] M1-01 PASS_LOCAL: `GET /api/health` → `{"status":"ok","version":"0.1.0"}` HTTP 200
- [x] M1-02 PASS_LOCAL: `GET /` → HTTP 200 `text/html` from same Worker origin
- [x] M1-03 PASS_LOCAL: `POST /api/poc/d1` → insert + read back via `env.DB`
- [x] M1-04 PASS_LOCAL: `POST /api/poc/r2` → put/get via `env.ASSETS`
- [x] M1-06 VERIFIED: attempt 4 HTTP 200 (4.262s); Pydantic PASS; `claim_type: null`, `numeric_value: 40` (int) accepted; tokens 86+64=150; raw and usage captured — evidence in `docs/evidence/M1-06/attempt-4-final/`
- [x] M1-07 DONE: `docs/ARCHITECTURE.md` §9 and `docs/TOOLING_AUDIT.md` updated with evidence
- [x] M1-08 DONE: POC route guard — `require_development_env` dependency reads `BRANDCORE_ENV` from `request.scope["env"]`; `wrangler.jsonc` `vars.BRANDCORE_ENV` set for default (development) and production; 8 guard tests in `test_poc_guard.py`; security-checklist controls 5, 9, 18 updated — 2026-11-04
- [x] Repository organization: `tools/skill-doctor.mjs`, `docs/archive/bootstrap/`, `docs/prompts/archive/`, `FILE_INVENTORY.json` deleted — 2026-11-04
- [x] `backend/tests/test_ai_schema.py`: 6 schema tests — all PASS (2026-11-04)
- [x] All 17 tests pass: `uv run pytest backend/tests/ -v` (2026-11-04)

---

## Remaining Tasks (prioritized)

1. **M0-02**: Git repository initialization — requires explicit user approval
2. **Gate C**: Repository relocation to `C:\dev\BRANDCORE` — approved but not yet executed
3. **Milestone 2**: Data foundation (D1 schema, migrations, repositories)

---

## Blockers & Decisions Required

- **M1 complete and secured.** All 5 POC checks PASS. POC route guard implemented and tested. Repository organized. Ready for Milestone 2.
- **workers.dev subdomain:** Registered as `brandcore.workers.dev` (2026-11-04).
- **Cloudflare account IDs:** `wrangler.jsonc` still has `<D1_DATABASE_ID>` placeholder. Real ID requires user approval.
- **Repository relocation:** Gate C approved; move `C:\Users\smrit\OneDrive\Desktop\BRANDCORE` → `C:\dev\BRANDCORE` before next heavy install session.
- **Git init:** No git repository. Requires explicit user approval.

---

## Tests & Checks Run

- `uv run pytest backend/tests/ -v`: **17/17 passed** (pytest 9.2.0, Python 3.14.6, 2026-11-04)
- `npm run build`: **success** — 145.63 kB JS / 47.08 kB gzip (2026-11-04)
- `curl GET /api/health`: **HTTP 200** `{"status":"ok","version":"0.1.0"}` (2026-11-04)
- `curl GET /`: **HTTP 200** `text/html` (2026-11-04)
- `curl POST /api/poc/d1`: **PASS_LOCAL** — insert + read back (2026-11-04)
- `curl POST /api/poc/r2`: **PASS_LOCAL** — put + get (2026-11-04)
- TypeScript scan: **0 files** (2026-11-04)
- wrangler.jsonc JSONC parse: **valid** (2026-11-04)
- Workers AI M1-06: **PASS_REMOTE** — attempt 4 HTTP 200 (4.262s); Pydantic valid; tokens 86+64=150; raw and usage captured (2026-11-04)
- POC route guard: **8/8 guard tests pass** — production 404, missing env 404, unknown env 404, development passes through (2026-11-04)
- Deployed preview: **BLOCKED** — no deployment approval; workers.dev subdomain registered

---

## ✅ GATE B — Workers AI (APPROVED 2026-11-04)

Gate B and Gate B-sub approved. `brandcore.workers.dev` registered.

**Model:** `@cf/meta/llama-3.1-8b-instruct-fp8`
**Input:** synthetic claim `"Our platform reduces customer onboarding time by up to 40 percent."`; requested JSON fields `claim_text`, `claim_type`, `numeric_value`, `unit`, `qualifier`, `scope`
**Attempts:**
1. `InferenceUpstreamError` (ref `kpjurgt1no531m46vndh55fu`) — no response.
2. JSON returned (5.17s); Pydantic caught `claim_type=None` and `numeric_value=40` int.
3. Authorized single retry: same model, input and parameters, unchanged source; HTTP 500 (3.994s); parseable JSON; Pydantic caught `numeric_value=40` int only; token usage not captured.

**Result:** M1-06 VERIFIED. Binding, model, Pydantic validation, raw capture and usage capture all confirmed.
**Evidence:** `docs/evidence/M1-06/attempt-4-final/` (`metadata.txt`, `response.headers.txt`, `response.body.txt`).
**Token usage:** prompt_tokens: 86, completion_tokens: 64, total_tokens: 150, cached_tokens: 0.

---

## NEXT ACTION

**Task:** M1 complete. Proceed to Milestone 2 — Data Foundation (D1 schema, migrations, repositories).
**Pre-requisite:** M0-02 git init and Gate C repository relocation require explicit user approval before heavy install work.

*Last updated: 2026-11-04 — M1-08 POC route guard DONE; repository organization complete; 17/17 tests pass*
