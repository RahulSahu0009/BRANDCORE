# BRANDCORE — Attack Surface

**Owner:** Mritunjay Singh · **Date:** 2026-11-04 · **Tier:** T2
**Status:** Draft — reflects Round 2 scope

---

## 1. Public Routes (Attack Surface)

All routes are served by the single Cloudflare Worker.

| Route | Method | Auth Required | Input | Notes |
|-------|--------|--------------|-------|-------|
| `/` | GET | No | None | Serves React SPA index.html |
| `/assets/*` | GET | No | None | Serves Vite build assets |
| `/api/health` | GET | No | None | Health check; no sensitive data |
| `/api/workspaces/:id/facts` | GET, POST | Demo role | JSON body | Fact CRUD |
| `/api/workspaces/:id/content` | GET, POST | Demo role | JSON body | Content submission |
| `/api/workspaces/:id/content/:vid/analyze` | POST | Demo role | Content version ID | Triggers AI extraction |
| `/api/workspaces/:id/content/:vid/review` | POST | Demo role | JSON body | Human review decision |
| `/api/workspaces/:id/releases` | GET | Demo role | None | Release passport list |
| `/api/workspaces/:id/releases/:rid/stale` | GET | Demo role | None | Stale impact query |

**Round 2 restriction:** No public self-service registration. No production authentication. Demo role switching only.

---

## 2. Input Classes

| Input Class | Entry Point | Validation | Risk |
|-------------|------------|------------|------|
| Content body text | POST `/api/.../content` | Pydantic; max length enforced | Prompt injection, XSS |
| Fact text and qualifier | POST `/api/.../facts` | Pydantic; max length enforced | SQL injection (mitigated by parameterized queries) |
| Evidence URL | POST `/api/.../facts` | URL format validation; no SSRF | SSRF |
| Review decision | POST `/api/.../review` | Pydantic enum; server-side role check | Privilege escalation |
| Workspace ID (path param) | All workspace routes | Server-side existence and scope check | Cross-workspace data access |
| Demo role header | All authenticated routes | Server-side validation; never trusted from client | Spoofing |

---

## 3. Cloudflare Bindings (Internal Surface)

| Binding | Access | Risk | Mitigation |
|---------|--------|------|------------|
| D1 | Backend only | SQL injection | Parameterized statements only |
| R2 | Backend only | Unauthorized object access | Backend-only access; no public URLs |
| Workers AI | Backend only | Prompt injection; cost abuse | Content passed as data; output validated; per-workspace cap |

The browser has no direct access to any binding.

---

## 4. Model Boundary

Workers AI receives content text as a data input, not as system instructions. The model output is:
1. Validated with Pydantic before any use.
2. Treated as advisory only — it cannot trigger state changes directly.
3. Never rendered as raw HTML in the browser.

Prompt injection risk: a malicious content submission could attempt to manipulate the AI's extraction output. Mitigation: deterministic checks are authoritative; AI output is one input to the finding pipeline, not the final word.

---

## 5. Round 2 Restrictions

The following attack surface areas are explicitly restricted in Round 2:

| Area | Restriction |
|------|-------------|
| File uploads | Disabled. Only approved text and seeded assets. |
| Public registration | Disabled. |
| Production authentication | Not implemented. Demo role switching only. |
| External URL fetching | Not implemented. Evidence URLs are stored as references, not fetched. |
| Admin panel | Not implemented. |
| Multi-tenant isolation | Demo workspace only. No real tenant separation. |

---

## 6. Security Headers (Target)

All responses from the Worker should include (NOT VERIFIED — to be implemented):

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` (refine before production) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Status: NOT VERIFIED — implement and verify in a later bounded task.
