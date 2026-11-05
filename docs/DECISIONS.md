# BRANDCORE — Architecture Decision Records

**Rule:** This file is append-only. Never delete or rewrite history. To supersede a decision, add a new ADR with `Status: Supersedes ADR-00X` and mark the old one `Status: Superseded by ADR-00Y`.

---

## ADR-001 — React with JavaScript/JSX; no TypeScript

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** The team needs a frontend framework for a B2B governance workspace UI. TypeScript adds compile-time safety but also build complexity, type-generation steps and a steeper learning curve for a hackathon timeline.

**Decision:** Use React with JavaScript and JSX only. No TypeScript, no `.ts`/`.tsx` files, no `tsconfig.json`, no type-generation steps.

**Consequences:**
- Simpler build pipeline (Vite with JS only).
- No type-generation steps for API contracts.
- Runtime validation via Pydantic on the backend and PropTypes or JSDoc comments on the frontend where needed.
- Any future TypeScript migration requires a new ADR and explicit team approval.

---

## ADR-002 — Cloudflare as the deployment platform

**Date:** 2026-11-04
**Status:** Accepted — conditional on proof-of-concept gate (see `docs/ARCHITECTURE.md` §9)
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** The project needs a deployment platform that supports a Python backend, a React frontend, a relational database, object storage and AI inference — ideally on a single platform with a generous free tier for a hackathon demo.

**Decision:** Use Cloudflare as the sole deployment platform: Cloudflare Workers (Python), Workers Static Assets, D1, R2 and Workers AI.

**Consequences:**
- Single platform reduces operational complexity.
- Python Workers are Beta; architecture is conditional on the proof-of-concept gate.
- No PostgreSQL, no separate hosting provider, no Hostinger.
- If the Python Workers Beta proves incompatible, a new ADR will document the fallback.

---

## ADR-003 — One Worker serving both API and frontend static assets

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** Serving the frontend and API from separate origins adds CORS complexity and deployment overhead.

**Decision:** One Cloudflare Worker serves the Vite-built frontend via Workers Static Assets and routes `/api/*` to the FastAPI ASGI app.

**Consequences:**
- No CORS configuration needed for same-origin API calls.
- Frontend uses relative `/api/*` paths only.
- Single `wrangler.jsonc` manages both concerns.

---

## ADR-004 — D1 relational model; no graph database

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** The dependency chain (evidence → fact → claim → content version → release passport) could be modelled as a graph. However, D1 is the only database available on Cloudflare Workers without adding an external service.

**Decision:** Use Cloudflare D1 (SQLite-compatible relational database) with a normalized schema and explicit foreign keys. No Neo4j, no graph database, no external PostgreSQL.

**Consequences:**
- Dependency traversal is done with SQL joins and recursive CTEs.
- Adding any other database requires a new ADR and explicit user approval.
- D1 is not a conventional network PostgreSQL server; do not use SQLAlchemy with a PostgreSQL connection string.

---

## ADR-005 — LLM output is advisory; deterministic checks are authoritative

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** AI-assisted claim extraction is useful for semantic tasks but cannot be trusted for exact values, dates, terminology or scope constraints.

**Decision:** AI (Workers AI) may extract candidate claims, classify language, explain findings and suggest corrections. Deterministic Python code is authoritative for all exact comparisons, dates, terminology, scope, content hashes, version IDs, dependency traversal and release state transitions. AI cannot approve content or change release status.

**Consequences:**
- All AI output is validated with Pydantic before use.
- Findings shown to users are always backed by deterministic evidence.
- The system never claims AI proved a fact is true.

---

## ADR-006 — Fictional demo data and constrained uploads

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** This is a hackathon demo. Production authentication, multi-tenant onboarding and unrestricted uploads are out of scope.

**Decision:** Use invented sample brand data only. Do not enter real customer confidential information or private documents. Demo role switching is a demonstration convenience and must not be represented as production authentication. Do not enable arbitrary public uploads until server-side size limits, file-type sniffing, access control, private R2 storage, safe parsing and appropriate scanning are implemented.

**Consequences:**
- The demo is clearly labelled as a demo.
- Production use is not approved until a separately reviewed security task is completed.
- Upload functionality is restricted to approved text and allow-listed references plus seeded private assets.

---

## ADR-007 — Exclude the 10k-websites cinematic pipeline

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** The `10k-websites` skill is present in the repository as a reference. It prescribes plain HTML/CSS/vanilla JavaScript, generated hero video, Higgsfield, FFmpeg and Hostinger for cinematic marketing sites.

**Decision:** Do not apply the 10k-websites fixed tool pipeline, no-build-step rule, video-scrubbing architecture, FFmpeg recipes, Higgsfield workflow or Hostinger deployment process to BRANDCORE. BRANDCORE is a React application, not a cinematic marketing page.

**Consequences:**
- BRANDCORE uses React + Vite + Tailwind CSS.
- No Higgsfield, FFmpeg, Hostinger or plain-HTML-no-build-step in BRANDCORE.
- The 10k-websites skill files remain in the repository as reference material only.

---

## ADR-008 — Browser cannot access Cloudflare bindings directly

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** Cloudflare D1, R2 and Workers AI bindings are available in the Worker runtime. Exposing them directly to the browser would bypass all server-side validation, authorization and audit logging.

**Decision:** The browser must never access D1, R2 or Workers AI directly. All private binding access goes through the FastAPI backend. The browser communicates only with `/api/*` routes.

**Consequences:**
- All data access is server-side validated and authorized.
- Audit events are recorded server-side.
- No client-side D1 SDK, R2 SDK or Workers AI SDK in the frontend.

---

## ADR-009 — Many-to-many fact-to-evidence relationship via join table

**Date:** 2026-11-04
**Status:** Accepted
**Deciders:** Mritunjay Singh (Team Lead)

**Context:** `docs/ARCHITECTURE.md` §5 showed a single `evidence_id` FK on `approved_fact`, implying one evidence record per fact. The PRD §4 describes "approved facts with scope, qualifier and evidence reference" and the dependency chain in §6 implies a fact may be supported by multiple sources (e.g. an internal study plus a third-party report). A single FK would require duplicating fact rows to cite additional evidence, which breaks versioning semantics.

**Decision:** Implement a `fact_evidence` join table providing a many-to-many relationship between `approved_fact` and `evidence`. Composite foreign keys on both sides reference `(id, workspace_id)` on the parent tables. A `CHECK (fact_workspace = ev_workspace)` constraint enforces workspace isolation at the database level.

**Consequences:**
- A fact can cite one or more evidence records without duplicating the fact row.
- Workspace isolation is enforced at the DB level, not only in application code.
- The conceptual single `evidence_id` column shown in the earlier architecture sketch is superseded by this join table.
- Repository queries for "all evidence supporting a fact" use a simple join on `fact_evidence`.
