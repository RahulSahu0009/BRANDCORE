# Contributing to BRANDCORE

**Team:** SMRITUNJAY837 · **Event:** CodeNexus India 2026

---

## Branch Model

```
main          ← Submission/release-ready. No direct feature work. No force pushes.
develop       ← Integration branch. All PRs target develop.
feature/*     ← Short-lived feature branches.
```

Feature branches:
- `feature/mritunjay/core-api`
- `feature/rahul/content-review`
- `feature/arvind/brand-governance`

Start from `develop`. Keep branches short-lived. Merge via PR only.

---

## Task Ownership

See `docs/TEAM_HANDOFF.md` for file ownership and first tasks.

---

## Pull Request Requirements

Every PR must include:

1. **What changed** — one paragraph describing the change
2. **Files touched** — list of modified files
3. **Tests run** — exact commands and results (e.g., `pytest backend/tests/ — 12 passed`)
4. **Mock data remaining** — which mock fixtures are still in place and why
5. **Known gaps** — anything incomplete or deferred

PRs should be under 400 changed lines where possible. If a PR is larger, explain why in the description.

Use the PR template at `.github/pull_request_template.md`.

---

## Review Rules

- At least one teammate must review and approve before merging.
- The author must not merge their own PR without a review (except for documentation-only changes in an emergency, with a note).
- Reviewers check: correctness, security rules (no secrets, no SQL concatenation, no TypeScript), test coverage, `docs/DESIGN.md` compliance, and `TASKS.md`/`MEMORY.md` updated.

---

## Commit Style

Use Conventional Commits:

```
feat(content-review): add finding card component
fix(api): correct workspace scope in fact query
docs(architecture): update POC gate status
test(deterministic): add numeric mismatch test cases
```

No secrets, tokens, API keys, real documents or real personal data in commits.

---

## After Each Task

1. Update `TASKS.md` — mark the task DONE or VERIFIED with evidence.
2. Update `MEMORY.md` — record what was completed and what is next.
3. If an architecture decision was made, add an ADR to `docs/DECISIONS.md`.

---

## API Contract Changes

API contract changes must be proposed by Mritunjay in `docs/API_CONTRACT.md` before frontend code depends on them. See `docs/TEAM_HANDOFF.md` for the process.

---

## Forbidden

- Direct pushes to `main`
- Force pushes to any branch
- Committing `.env`, `.dev.vars`, tokens, API keys, real documents or real personal data
- TypeScript files (`.ts`, `.tsx`, `tsconfig.json`)
- Unpinned `@latest` package installs
- Blind `npx -y` execution
