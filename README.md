# BRANDCORE

**Evidence-linked, explainable and change-aware brand governance.**
Team: SMRITUNJAY837 · Event: CodeNexus India 2026

> **Demo status:** This is a hackathon demo using fictional seed data. Production use is not approved. See `docs/PRD.md` §11.

---

## What it does

BRANDCORE helps teams keep brand content accurate and consistent with approved facts, evidence and guidelines. It identifies approved content that may need revalidation when the facts behind it change.

Primary workflow: submit content → AI extracts claims → deterministic checks run → findings shown with evidence → human reviewer approves or rejects → immutable Release Passport created → fact changes trigger stale detection.

---

## Team

| Name | Role | Branch |
|------|------|--------|
| Mritunjay Singh | Team Lead, AI and Python Backend Lead | `feature/mritunjay/core-api` |
| Rahul Sahu | Content Review Experience Lead | `feature/rahul/content-review` |
| Arvind Shah | Brand Operations and Release Governance Lead | `feature/arvind/brand-governance` |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS (JavaScript/JSX only — no TypeScript) |
| Backend | Python 3.13+ FastAPI on Cloudflare Python Workers (Beta) |
| Database | Cloudflare D1 (SQLite-compatible) |
| Storage | Cloudflare R2 (private) |
| AI | Cloudflare Workers AI |
| Deployment | Wrangler — one Worker for API and static assets |

---

## Setup

```powershell
# Prerequisites: Node.js 18+, Python 3.13+, uv

# Frontend
cd frontend
npm install
npm run dev        # → http://localhost:5173

# Backend (separate terminal)
cd ..
uv sync
pywrangler dev     # → http://localhost:8787

# Backend tests
uv run pytest backend/tests/ -v
```

> **Note:** `pywrangler` is the Cloudflare Python Workers local dev tool. Verify the current package name at https://developers.cloudflare.com/workers/languages/python/ before running `uv sync`.

---

## Repository Map

```
BRANDCORE/
├── CLAUDE.md                    # Claude Code entry point (≤150 lines)
├── RULES.md                     # Non-negotiable implementation rules
├── TASKS.md                     # Living work board
├── MEMORY.md                    # Current verified project state
├── CONTRIBUTING.md              # Branching, PR and review rules
├── wrangler.jsonc               # Cloudflare Worker configuration (placeholder IDs)
├── pyproject.toml               # Python backend dependencies (uv)
├── package.json                 # Root workspace scripts
├── .env.example                 # Environment variable names (no values)
├── .dev.vars.example            # Worker local dev secret names (no values)
├── .gitignore / .gitattributes
│
├── docs/
│   ├── PRD.md                   # Product requirements
│   ├── ARCHITECTURE.md          # System design and data flows
│   ├── DESIGN.md                # Design system (sole UI authority)
│   ├── DECISIONS.md             # Append-only ADRs
│   ├── API_CONTRACT.md          # Endpoint contract (PROPOSED)
│   ├── TEST_PLAN.md             # Test scenarios and gates
│   ├── EXECUTION_PLAN.md        # Bounded milestones
│   ├── TEAM_HANDOFF.md          # Ownership and first tasks
│   ├── TOOLING_AUDIT.md         # Source interpretation and unresolved items
│   └── IMPLEMENTATION_PROMPT_TEMPLATE.md
│
├── brain/security/
│   ├── threat-model.md
│   ├── secrets.md
│   ├── attack-surface.md
│   ├── security-checklist.md    # 40-control T2 checklist
│   └── incident-runbook.md
│
├── deployment/
│   ├── cloudflare.md
│   └── rollback.md
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Shell with nav and health status
│       ├── styles.css           # Tailwind + design tokens
│       ├── services/api.js      # Shared API client
│       ├── components/ui/       # Shared UI primitives (Rahul coordinates)
│       ├── components/content/  # Content components (Rahul)
│       ├── components/brand/    # Brand components (Arvind)
│       ├── features/content-review/    # Rahul
│       ├── features/brand-governance/  # Arvind
│       └── features/release-governance/ # Arvind
│
├── backend/
│   ├── src/
│   │   ├── worker.py            # Cloudflare Worker ASGI entry point
│   │   └── app/
│   │       ├── main.py          # FastAPI app factory
│   │       ├── api/health.py    # GET /api/health
│   │       ├── core/            # Config, logging, error handling
│   │       ├── domain/          # Pydantic models
│   │       ├── repositories/    # D1 access (parameterized SQL only)
│   │       └── services/        # Business logic, AI, deterministic checks
│   └── tests/
│       └── test_health.py
│
└── database/
    └── migrations/
        └── README.md
```

---

## Demo Boundaries

- Uses invented sample brand data only.
- No real customer confidential information or private documents.
- Demo role switching is a demonstration convenience, not production authentication.
- Cloudflare Python Workers are Beta — architecture is conditional on the proof-of-concept gate.

---

## Current Status

| Item | Status |
|------|--------|
| Repository structure and documents | ✅ Created |
| Cloudflare Python Workers POC | ❌ NOT VERIFIED |
| D1 schema and migrations | ❌ Not started |
| Claim analysis engine | ❌ Not started |
| Content review UI | ❌ Not started |
| Brand governance UI | ❌ Not started |
| End-to-end workflow | ❌ Not started |

See `TASKS.md` and `MEMORY.md` for the current work board.
