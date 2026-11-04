# BRANDCORE — Security Checklist (T2)

**Single source of truth for security control status.**
**Rule:** Tick an item only with evidence (command output, test name, date, link). Do not copy this list into other documents — link to it.
**Tier:** T2 — all 40 items apply.
**Date:** 2026-11-04

---

## Secrets & Configuration

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 1 | Secret keys never in frontend (no `VITE_*` prefixed secrets) | NOT VERIFIED | — |
| 2 | `.env*` and `.dev.vars` in `.gitignore`; never in public or cloud-synced folders | NOT VERIFIED | — |
| 3 | Git history scanned for secrets (gitleaks or equivalent) | NOT VERIFIED | — |
| 4 | Any exposed keys rotated | NOT VERIFIED | — |

## Authentication & Authorization

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 5 | Server-side permission check on every request | PARTIAL | POC route guard implemented: `require_development_env` dependency reads `BRANDCORE_ENV` from `request.scope["env"]` (Cloudflare Workers binding); returns HTTP 404 for production/missing/unknown values. `wrangler.jsonc` sets `vars.BRANDCORE_ENV="production"` in `env.production`. Tests: `test_poc_guard.py` 8/8 pass (2026-11-04). Full per-route auth guard required for product endpoints in M2+. |
| 6 | Never trust client-supplied IDs, roles or prices | NOT VERIFIED | — |
| 7 | Users cannot read each other's data (workspace-scoped queries) | NOT VERIFIED | — |
| 8 | DB and file storage locked down (no public D1/R2 access) | NOT VERIFIED | — |
| 9 | Admin actions protected when called directly | PARTIAL | POC routes (`/api/poc/*`) guarded by `require_development_env` — returns 404 in production. Product admin endpoints not yet implemented (M2+). |
| 10 | Login/logout/reset tested (N/A for demo; document when production auth is added) | NOT APPLICABLE (Round 2 demo) | — |

## Abuse & Cost

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 11 | Rate-limit login, signup, expensive calls (AI analysis endpoint) | NOT VERIFIED | — |
| 12 | Per-workspace AI usage cap | NOT VERIFIED | — |

## Input Validation

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 13 | Server-side validation on all inputs (Pydantic) | NOT VERIFIED | — |
| 14 | Parameterized queries; no SQL concatenation | NOT VERIFIED | — |
| 15 | User content cannot run scripts (no dangerouslySetInnerHTML; output escaped) | NOT VERIFIED | — |
| 16 | Upload type/size limits (uploads disabled in Round 2; verify restriction is enforced) | NOT VERIFIED | — |

## Payments & Production

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 17 | Server-side payment verification (N/A — no payments in Round 2) | NOT APPLICABLE | — |
| 18 | Debug mode off in production; no secrets in errors or logs | PARTIAL | FastAPI `docs_url=None`, `redoc_url=None` — OpenAPI docs disabled. POC routes return HTTP 404 (not 500 with trace) in production via `require_development_env`. Full error-handler hardening required before deployment. |

## Data & Testing

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 19 | Backup and tested restore (N/A for demo; document for production) | NOT APPLICABLE (Round 2 demo) | — |
| 20 | Two-account and logged-out tests | NOT VERIFIED | — |

## Supply Chain

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 21 | Lockfile committed; `npm ci` used; dependency audit in CI | NOT VERIFIED | — |
| 22 | AI tooling supply chain: skills, hooks, MCP servers, npx packages vetted and pinned | NOT VERIFIED | — |

## Security Headers

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 23 | Security headers: CSP, HSTS, `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy` | NOT VERIFIED | — |
| 24 | Cookies `HttpOnly; Secure; SameSite`; CSRF protection on state-changing routes | NOT VERIFIED | — |
| 25 | CORS allowlist; no wildcard with credentials | NOT VERIFIED | — |

## Server-Side Request Forgery & Redirects

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 26 | SSRF and open-redirect: validate outbound URLs and redirect targets | NOT VERIFIED | — |

## Webhooks

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 27 | Webhooks: verify signatures, reject replays, idempotency keys (N/A — no webhooks in Round 2) | NOT APPLICABLE | — |

## Passwords & Sessions

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 28 | Passwords: argon2/bcrypt; no user-enumeration; session rotation on login; MFA for admins (N/A for demo) | NOT APPLICABLE (Round 2 demo) | — |

## Mass Assignment

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 29 | Mass assignment: allow-list writable fields (Pydantic request models) | NOT VERIFIED | — |

## Least Privilege

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 30 | Least privilege: scoped DB roles/tokens/IAM; no shared keys across environments | NOT VERIFIED | — |
| 31 | Separate secrets per environment; stored in host/CI secret store; never in chat or synced folders | NOT VERIFIED | — |

## Logging & Monitoring

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 32 | Security event logging and alerts; no PII in logs | NOT VERIFIED | — |

## Privacy

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 33 | PII inventory, retention, deletion path, consent, privacy policy (India DPDP Act 2023 / GDPR where applicable) | NOT VERIFIED | — |

## LLM / AI Security

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 34 | LLM features: model output and retrieved content are untrusted; prompt-injection defenses; tool allow-lists; no unrestricted code/shell; output validation (OWASP LLM Top 10) | NOT VERIFIED | — |

## Uploads

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 35 | Uploads: sniff content type, malware scan, store outside web root, signed URLs (uploads disabled in Round 2; verify restriction enforced) | NOT VERIFIED | — |

## Third-Party Scripts

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 36 | Third-party scripts minimal, with SRI and consent where required | NOT VERIFIED | — |

## Error Handling

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 37 | Errors fail closed; generic messages to clients | NOT VERIFIED | — |

## Backups

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 38 | Backups encrypted; RPO/RTO written down | NOT APPLICABLE (Round 2 demo) | — |

## Incident Response

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 39 | One-page incident runbook: who, how to rotate keys, how to take the site down | NOT VERIFIED | See `brain/security/incident-runbook.md` |

## Pre-Release

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 40 | Pre-release run: security audit + semgrep + dependency audit + 2-account test; results saved in `brain/security/` | NOT VERIFIED | — |

---

*Last updated: 2026-11-04 — POC route guard implemented (controls 5, 9, 18 updated). Update remaining status fields with evidence before any release.*
