# BRANDCORE
**Tier:** T2 · **Autonomy:** A1 · **Team:** SMRITUNJAY837 · **Event:** CodeNexus India 2026

## Read first
@docs/PRD.md
@docs/ARCHITECTURE.md
@docs/DESIGN.md
@RULES.md
@MEMORY.md

Read on demand (not every session):
- TASKS.md — current work board
- brain/security/security-checklist.md — T2 controls
- docs/API_CONTRACT.md — endpoint contract
- docs/DECISIONS.md — ADR history

## Stack
- Frontend: React + Vite + Tailwind CSS (JavaScript/JSX only — no TypeScript)
- Backend: Python 3.13+ FastAPI on Cloudflare Python Workers (Beta)
- DB: Cloudflare D1 · Storage: Cloudflare R2 · AI: Cloudflare Workers AI
- Config: wrangler.jsonc · Deps: uv (Python), npm (frontend)

## Commands
```
# Frontend
cd frontend && npm install    # install
npm run dev                   # dev server → http://localhost:5173
npm run build                 # production build → frontend/dist/
npm run lint                  # lint

# Backend
cd backend && uv sync         # install
pywrangler dev                # local Worker → http://localhost:8787
uv run pytest backend/tests/ -v  # tests

# Validation
node -e "JSON.parse(require('fs').readFileSync('wrangler.jsonc','utf8').replace(/\/\/.*/g,''))"
```

## Non-negotiables
- Priority: security > correctness > a11y/UX > maintainability > simplicity > speed
- JavaScript/JSX only in frontend. No .ts, .tsx, tsconfig.json, type-generation.
- Browser never accesses D1, R2 or Workers AI directly. All binding access through backend.
- Parameterized D1 queries only. Never concatenate untrusted values into SQL.
- AI output is advisory. Validated with Pydantic. Cannot approve content or change release status.
- Content versions and Release Passports are immutable. No UPDATE paths.
- Never commit .env, .dev.vars, tokens, API keys or real personal/customer data.
- No new dependency without a concise ADR.
- Product name is BRANDCORE everywhere. No other product/module brand name.

## Definition of done
All T2 gates for the current task pass; tests added for new behavior; TASKS.md and MEMORY.md updated; no TypeScript files; no secrets committed; docs touched only if facts changed.

## Cloudflare runtime caveat
Python Workers are Beta. Architecture is conditional on the proof-of-concept gate in docs/ARCHITECTURE.md §9. Do not implement product features until the POC gate passes.

## Do not
- Deploy, push to GitHub or create Cloudflare resources without explicit user approval.
- Implement the full product in one run. One milestone at a time (docs/EXECUTION_PLAN.md).
- Use the 10k-websites cinematic pipeline (ADR-007).
- Add PostgreSQL, Neo4j, Hostinger, Higgsfield or FFmpeg.
