# BRANDCORE — Execution Plan

**Version:** 0.1.0 · **Event:** CodeNexus India 2026

Each milestone is a bounded unit of work. Implement one milestone at a time using a focused prompt. Do not skip milestones or implement the full product in one run.

---

## Milestone 0 — Repository Bootstrap ← CURRENT

**Owner:** Mritunjay Singh
**Goal:** Clean, documented repository foundation that all three team members can clone and understand.
**Deliverables:** All 8 core documents, supporting docs, security docs, deployment docs, minimal scaffold code.
**Gate:** All acceptance criteria in `BRANDCORE_CLAUDE_CODE_BUILD_PROMPT.json` pass.

---

## Milestone 1 — Cloudflare Runtime Proof of Concept

**Owner:** Mritunjay Singh
**Goal:** Verify that the Cloudflare Python Workers architecture actually works before any product feature work.
**Deliverables:**
- FastAPI health endpoint running in pywrangler local dev
- Vite build served by the same Worker
- D1 parameterized write/read working
- R2 store/retrieve working
- Workers AI returning a Pydantic-validated response
- All POC results documented in `docs/ARCHITECTURE.md` §9 and `docs/TOOLING_AUDIT.md`

**Gate:** All 5 POC checks in `docs/ARCHITECTURE.md` §9 pass with evidence. If any check fails, open a fallback ADR before proceeding.

---

## Milestone 2 — Data Foundation

**Owner:** Mritunjay Singh
**Goal:** D1 schema, migrations, seed data and repository layer.
**Deliverables:**
- 3 D1 migrations (all entities from `docs/ARCHITECTURE.md` §5)
- Seeded demo workspace with fictional brand data
- Repository layer with parameterized SQL for all entities
- Unit tests for all repository functions

**Gate:** All migrations run and roll back cleanly. Repository unit tests pass. No SQL concatenation.

---

## Milestone 3 — Claim Analysis Engine

**Owner:** Mritunjay Singh
**Goal:** AI-assisted claim extraction and all 7 deterministic finding types.
**Deliverables:**
- Workers AI claim extraction service with Pydantic validation
- Deterministic checks for all 7 finding types
- `POST /api/workspaces/:id/content/:vid/analyze` endpoint
- Unit tests for all 7 finding types (positive and negative cases)

**Gate:** All 7 finding types detectable. T-BE-10 through T-BE-17 pass.

---

## Milestone 4 — Content Review UI

**Owner:** Rahul Sahu
**Goal:** Content submission, findings display and review decision UI.
**Deliverables:**
- Content submission form
- Finding card component (all 7 types)
- Review decision UI (approve / request changes / reject)
- Content version history list
- All loading/empty/error/success states
- Mock fixtures clearly labelled; removed during integration

**Gate:** T-FE-10 through T-FE-15 pass. axe 0 serious/critical on content review page.

---

## Milestone 5 — Brand Governance and Release UI

**Owner:** Arvind Shah
**Goal:** Approved facts management, release passport list and stale impact view.
**Deliverables:**
- Approved facts list and create/edit form
- Evidence reference management UI
- Release Passport list with status badges
- Stale impact view with revalidation action
- All loading/empty/error/success states
- Mock fixtures clearly labelled; removed during integration

**Gate:** T-FE-20 through T-FE-23 pass. axe 0 serious/critical on brand governance page.

---

## Milestone 6 — Integration and Release

**Owner:** All (Mritunjay leads)
**Goal:** End-to-end primary workflow working; all mocks removed; security checklist reviewed; performance measured.
**Deliverables:**
- All 11 steps in `docs/PRD.md` §4 working end-to-end
- All mock fixtures removed from core workflow
- Security checklist updated with evidence
- Lighthouse mobile measurements recorded
- Final PR reviewed and merged to main

**Gate:** M6-01 through M6-04 in `TASKS.md` pass. No TypeScript. No secrets. TASKS and MEMORY current.

---

## Prompt Template

For each milestone after M0, use the template in `docs/IMPLEMENTATION_PROMPT_TEMPLATE.md`.
