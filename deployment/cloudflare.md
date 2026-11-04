# BRANDCORE — Cloudflare Deployment

**Owner:** Mritunjay Singh · **Version:** 0.1.0
**Status:** NOT VERIFIED — verify all steps against current official Cloudflare documentation before running.

---

## 1. Prerequisites

Before deploying:

- [ ] Cloudflare account created (free tier sufficient for demo)
- [ ] Wrangler CLI installed: `npm install -g wrangler` (verify current version at https://developers.cloudflare.com/workers/wrangler/)
- [ ] Logged in: `wrangler login`
- [ ] Cloudflare Python Workers Beta enabled on the account (verify at https://developers.cloudflare.com/workers/languages/python/)
- [ ] Proof-of-concept gate passed (all 5 checks in `docs/ARCHITECTURE.md` §9)
- [ ] `wrangler.jsonc` updated with real account ID, D1 database ID and R2 bucket name (requires explicit user approval)

---

## 2. Resource Names and Bindings

| Resource | Binding Name | Placeholder ID | Real ID |
|----------|-------------|---------------|---------|
| D1 database | `DB` | `<D1_DATABASE_ID>` | TBD — requires user approval |
| R2 bucket | `ASSETS` | `brandcore-assets` | TBD — requires user approval |
| Workers AI | `AI` | (no ID needed) | — |

**Do not create Cloudflare resources without explicit user approval.**

---

## 3. Local Development Commands

```powershell
# Frontend dev server (Vite)
cd frontend
npm install
npm run dev
# → http://localhost:5173

# Backend / Worker local dev (pywrangler)
cd backend
uv sync
pywrangler dev
# → http://localhost:8787

# Run backend tests
cd backend
uv run pytest backend/tests/ -v

# Build frontend for production
cd frontend
npm run build
# → frontend/dist/
```

---

## 4. Preview Deployment

```powershell
# Build frontend first
cd frontend && npm run build && cd ..

# Deploy to Cloudflare preview
wrangler deploy --env preview

# Verify preview URL (shown in wrangler output)
# Test: GET https://<preview-url>/api/health
# Test: Open https://<preview-url>/ in browser
```

**Requires:** Cloudflare login, real account ID in `wrangler.jsonc`, D1 database created.
**Do not run without explicit user approval.**

---

## 5. Production Deployment Gate

Before deploying to production:

- [ ] All critical-path tests pass (see `docs/TEST_PLAN.md` §5)
- [ ] Security checklist reviewed (`brain/security/security-checklist.md`)
- [ ] No secrets in any committed file
- [ ] No TypeScript files
- [ ] `TASKS.md` and `MEMORY.md` current
- [ ] Preview deployment tested and verified
- [ ] Explicit user approval obtained

```powershell
# Production deploy (requires all gates above)
wrangler deploy --env production
```

---

## 6. Cost and Abuse Controls

| Control | Setting | Status |
|---------|---------|--------|
| Cloudflare spend alert at 50% | Set in Cloudflare dashboard | NOT SET |
| Cloudflare spend alert at 80% | Set in Cloudflare dashboard | NOT SET |
| Workers AI per-workspace cap | Implemented in backend service | NOT IMPLEMENTED |
| D1 row limits | Enforced in repository layer | NOT IMPLEMENTED |

Set spend alerts before any production deployment.

---

## 7. Secrets Management

```powershell
# Set a Worker secret (requires Cloudflare login)
wrangler secret put SECRET_NAME

# List secrets (names only, no values)
wrangler secret list
```

Never put secret values in `wrangler.jsonc`, source code or chat. See `brain/security/secrets.md`.

---

## 8. Official References

Verify these URLs are current before using them:

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Python Workers: https://developers.cloudflare.com/workers/languages/python/
- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- D1: https://developers.cloudflare.com/d1/
- R2: https://developers.cloudflare.com/r2/
- Workers AI: https://developers.cloudflare.com/workers-ai/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/

*Last checked: 2026-11-04 — verify current content before implementation.*
