# BRANDCORE — Secrets Inventory

**Owner:** Mritunjay Singh · **Date:** 2026-11-04
**Rule:** Never place secret values in this file. Record names, storage locations and rotation procedures only.

---

## 1. Secret Inventory

| Secret Name | Purpose | Storage (local dev) | Storage (production) | Rotation Trigger |
|-------------|---------|--------------------|--------------------|-----------------|
| `WORKERS_AI_API_KEY` | Workers AI binding auth (if required) | `.dev.vars` | Cloudflare Worker secret | Suspected compromise; quarterly |
| `R2_ACCESS_KEY_ID` | R2 bucket access (if using S3-compatible API) | `.dev.vars` | Cloudflare Worker secret | Suspected compromise; quarterly |
| `R2_SECRET_ACCESS_KEY` | R2 bucket access | `.dev.vars` | Cloudflare Worker secret | Suspected compromise; quarterly |
| `DEMO_SEED_KEY` | Seed data signing (if used) | `.dev.vars` | Cloudflare Worker secret | On team member departure |

**Note:** Cloudflare D1 and R2 bindings accessed via the Worker runtime do not require separate API keys — they use the Worker's binding context. The above keys apply only if using the S3-compatible R2 API or external access.

---

## 2. Storage Rules

- **Local development:** `.dev.vars` file in the project root. This file is in `.gitignore` and must never be committed.
- **Production:** Cloudflare Worker secrets via `wrangler secret put <NAME>` or the Cloudflare dashboard.
- **Never store secrets in:** `.env`, source code, `wrangler.jsonc`, `CLAUDE.md`, `MEMORY.md`, chat history, OneDrive-synced folders, or any committed file.
- **Never log secrets** in application logs, error messages or debug output.

---

## 3. `.dev.vars.example`

The file `.dev.vars.example` in the project root lists all required variable names with placeholder values. Copy it to `.dev.vars` and fill in real values for local development.

---

## 4. Rotation Procedure

1. Generate a new secret value using a cryptographically secure method.
2. Update the secret in Cloudflare Worker secrets: `wrangler secret put <NAME>`.
3. Verify the Worker still functions with the new secret.
4. Revoke the old secret at the source (Cloudflare dashboard or provider).
5. Record the rotation date in this file (date only, no values).
6. If the old secret may have been compromised, follow `incident-runbook.md`.

---

## 5. Rotation History

| Secret Name | Rotation Date | Reason | Rotated By |
|-------------|--------------|--------|-----------|
| (none yet) | — | — | — |

---

## 6. Team Member Departure

On any team member departure:
1. Rotate all secrets that the departing member had access to.
2. Remove their access from the Cloudflare account.
3. Record the rotation in §5.
