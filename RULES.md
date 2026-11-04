# BRANDCORE — Rules

**Version:** 0.1.0 · **Tier:** T2 · **Autonomy:** A1
**These rules are non-negotiable. Priority order resolves conflicts.**

---

## 1. Priority Order

When two rules conflict, the higher one wins:

1. **Security and user safety** — secrets, auth, data, bindings
2. **Correctness** — tests, verified behavior, evidence-based claims
3. **Accessibility and UX** — WCAG 2.2 AA, keyboard access, performance
4. **Maintainability** — clear structure, ADRs, docs
5. **Simplicity** — smallest correct implementation
6. **Delivery speed**
7. **Novelty**

---

## 2. Language and Framework

- **Frontend:** React with JavaScript and JSX only. No TypeScript, no `.ts`/`.tsx`, no `tsconfig.json`, no type-generation steps.
- **Allowed extensions:** `.js`, `.jsx`, `.css`, `.html`, `.json`
- **Build tool:** Vite
- **Styling:** Tailwind CSS with tokens from `docs/DESIGN.md`
- **Backend:** Python 3.13+, FastAPI, Pydantic, uv
- **No large UI libraries** without an ADR

---

## 3. Cloudflare Architecture Boundaries

- One Worker serves both frontend static assets and the `/api/*` backend.
- The browser must never access D1, R2 or Workers AI directly.
- All private binding access goes through the FastAPI backend.
- Frontend uses relative `/api/*` paths only — no hardcoded origins.
- No PostgreSQL, Neo4j, Hostinger, Higgsfield or FFmpeg in BRANDCORE.
- No SQLAlchemy with a PostgreSQL connection string.
- Any new database or hosting service requires an ADR and explicit user approval.

---

## 4. Data Access

- Use parameterized/prepared D1 statements. Never concatenate untrusted values into SQL.
- SQL lives only in `backend/src/app/repositories/`. Never in route handlers, services or React components.
- Every repository query and mutation is scoped by `workspace_id`. Never trust client-supplied workspace scope.
- D1 is not a conventional network PostgreSQL server. Do not treat it as one.

---

## 5. AI — Untrusted and Advisory

- AI (Workers AI) may extract candidate claims, classify language, explain findings and suggest corrections.
- AI output is always validated with Pydantic before any use.
- AI cannot declare a claim factually true, create or approve facts, approve/reject/publish content, change release status, or write to the database outside validated application services.
- Deterministic Python code is authoritative for all exact comparisons, dates, terminology, scope, content hashes, version IDs, dependency traversal and release state transitions.
- Model output and retrieved content are untrusted. Design against prompt injection and unsafe HTML rendering.

---

## 6. Immutable Versions and Passports

- Content submitted for review is immutable. Editing creates a new version.
- Release Passport snapshots are immutable. No UPDATE path on passport rows.
- A changed fact/evidence version creates a new status event and stale impact record. It never rewrites the historical passport.
- Revalidation creates a new review and, if approved, a new release record.
- Content hashes (SHA-256) are computed server-side from the stored content version body.

---

## 7. Human Approval Authority

- Humans retain final approval authority. No automated approval path.
- A content creator cannot be the approver for the same content version.
- Review decisions are recorded server-side with timestamp and reviewer identity.

---

## 8. Upload Restriction

- Do not enable arbitrary public uploads until server-side size limits, file-type sniffing, access control, private R2 storage, safe parsing and appropriate scanning are implemented.
- For Round 2: approved text and allow-listed references plus seeded private assets only.

---

## 9. Dependencies

- No new dependency without a concise ADR covering necessity, compatibility, version, license, size and known vulnerabilities.
- No unpinned `@latest` installs. No blind `npx -y` execution. No new global tools.
- Lockfile (`package-lock.json`, `uv.lock`) must be committed.
- Use `npm ci` in CI, not `npm install`.

---

## 10. Testing

- All tests that exist for changed behavior must pass.
- Aim for ≥ 80% line coverage on critical data/auth/write paths once implemented.
- Never claim browser, deployment, security or performance checks passed if they were not run.
- Add unit tests for deterministic comparisons and release-state transitions in later implementation phases.

---

## 11. Security

- Never commit `.env`, `.dev.vars`, tokens, API keys, real documents or real personal/customer data.
- No secrets in `VITE_*` prefixed environment variables.
- Do not expose debug traces, private content or secrets in client errors or logs.
- Use explicit CSP/security headers, least-privilege bindings and separate preview/production configuration.
- Do not implement production authentication casually. If production auth is introduced, stop and create a separately reviewed security task with tests.
- All 40 T2 security checklist controls apply. See `brain/security/security-checklist.md`.

---

## 12. Review and Documentation

- All work enters `develop` through a pull request and at least one teammate review.
- No direct pushes to `main`. No force pushes.
- PRs must state what changed, files touched, tests run, results, mock data remaining and known gaps.
- Update `TASKS.md` and `MEMORY.md` for meaningful changes.
- `DECISIONS.md` is append-only. Never delete or rewrite ADR history.
- API contract changes must be proposed by Mritunjay and communicated before frontend implementation depends on them.
- Rahul and Arvind may use clearly labelled mock fixtures until endpoints are available, but must remove mocks from the core workflow during integration.

---

## 13. Product Naming

- Use **BRANDCORE** as the only product name in every document, screen, diagram, package name and user-facing string.
- Do not introduce a separate product or module brand name.

---

## 14. Demo Boundary

- Use invented sample brand data only.
- Do not enter real customer confidential information or private documents.
- Demo role switching is a demonstration convenience and must not be represented as production authentication.
- The demo is clearly labelled as a demo in the UI.
