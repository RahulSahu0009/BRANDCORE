# BRANDCORE — Team Handoff

**Version:** 0.1.0 · **Date:** 2026-11-04

---

## Team

| Name | Role | Branch | Email |
|------|------|--------|-------|
| Mritunjay Singh | Team Lead, AI and Python Backend Lead | `feature/mritunjay/core-api` | smritunjay837@gmail.com |
| Rahul Sahu | Content Review Experience Lead | `feature/rahul/content-review` | — |
| Arvind Shah | Brand Operations and Release Governance Lead | `feature/arvind/brand-governance` | — |

---

## File Ownership

### Mritunjay Singh

```
backend/**
database/**
wrangler.jsonc
pyproject.toml
docs/ARCHITECTURE.md
docs/API_CONTRACT.md
deployment/**
```

- Owns all backend Python code, D1 schema, migrations, repositories, services and API endpoints.
- Owns the Cloudflare configuration and deployment process.
- Proposes all API contract changes before frontend depends on them.

### Rahul Sahu

```
frontend/src/features/content-review/**
frontend/src/components/content/**
```

- Owns the content submission form, findings display, review decision UI and content version history.
- Coordinates frontend shell, global styles and shared UI primitives (shared with Arvind).
- Writes tests for content-review feature components.

### Arvind Shah

```
frontend/src/features/brand-governance/**
frontend/src/features/release-governance/**
frontend/src/components/brand/**
```

- Owns the approved facts management UI, evidence reference UI, release passport list and stale impact view.
- Writes tests for brand governance and release governance feature components.

### Shared (all three)

```
frontend/src/components/ui/**   ← Rahul coordinates
frontend/src/services/api.js    ← Mritunjay owns contract; Rahul implements
docs/DESIGN.md                  ← All three follow; no separate palettes
TASKS.md, MEMORY.md             ← All three update
```

---

## Branch Model

```
main          ← Submission/release-ready. No direct feature work.
  └── develop ← Integration branch. All PRs target develop.
        ├── feature/mritunjay/core-api
        ├── feature/rahul/content-review
        └── feature/arvind/brand-governance
```

---

## First Tasks

### Mritunjay — Start here

1. Clone the repository and create the `develop` branch.
2. Create your feature branch: `git checkout -b feature/mritunjay/core-api develop`
3. Run the Cloudflare Python Workers proof-of-concept (Milestone 1 in `docs/EXECUTION_PLAN.md`).
4. Document results in `docs/ARCHITECTURE.md` §9 and `docs/TOOLING_AUDIT.md`.
5. If POC passes, proceed to Milestone 2 (data foundation).

### Rahul — Start here

1. Clone the repository and create the `develop` branch (coordinate with Mritunjay).
2. Create your feature branch: `git checkout -b feature/rahul/content-review develop`
3. Read `docs/DESIGN.md` and `docs/API_CONTRACT.md` fully.
4. Set up the frontend: `cd frontend && npm install && npm run dev`
5. Build the content submission form with clearly labelled mock fixtures (Milestone 4, task M4-01).
6. Do not implement real API calls until Mritunjay confirms the endpoint is available.

### Arvind — Start here

1. Clone the repository and create the `develop` branch (coordinate with Mritunjay).
2. Create your feature branch: `git checkout -b feature/arvind/brand-governance develop`
3. Read `docs/DESIGN.md` and `docs/API_CONTRACT.md` fully.
4. Set up the frontend: `cd frontend && npm install && npm run dev`
5. Build the approved facts list with clearly labelled mock fixtures (Milestone 5, task M5-01).
6. Do not implement real API calls until Mritunjay confirms the endpoint is available.

---

## Daily Integration Rhythm

1. Each contributor works on their feature branch.
2. At the end of each session: update `TASKS.md` and `MEMORY.md` with what was done and what is next.
3. Open a PR to `develop` when a task is complete. Request review from at least one teammate.
4. Mritunjay merges to `develop` after review.
5. No direct pushes to `main`.

---

## Mock Fixture Rules

- Mock fixtures must be in a clearly labelled location (e.g., `src/features/content-review/__mocks__/`).
- Mock fixtures must be removed from the core workflow during Milestone 6 integration.
- PRs must state which mock fixtures remain and which have been replaced with real API calls.

---

## API Contract Change Process

1. Mritunjay proposes the change in `docs/API_CONTRACT.md` (PR to `develop`).
2. Rahul and Arvind review and confirm their frontend work is compatible.
3. Mritunjay implements the endpoint.
4. Rahul/Arvind update their mock fixtures to match the new contract, then replace with real calls when the endpoint is available.
