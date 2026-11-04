# BRANDCORE — Tooling Audit

**Version:** 0.1.0 · **Date:** 2026-11-04 · **Owner:** Mritunjay Singh

---

## 1. Source Files Read

| File | Status | Notes |
|------|--------|-------|
| `DEVELOPMENT_WORKFLOW.md` v2 | ✅ Read fully | Governs engineering lifecycle |
| `AUDIT_REPORT.md` | ✅ Read fully | Findings resolved in v2 workflow |
| `ECC_INTEGRATION_GUIDE.md` v2 | ✅ Read fully | ECC is on-demand only; no hooks registered |
| `10k-websites/SKILL.md` | ✅ Read fully | Excluded from BRANDCORE (ADR-007) |
| `10k-websites/references/*.md` | ✅ Present | Excluded from BRANDCORE (ADR-007) |
| `tools/skill-doctor.mjs` | ✅ Present | Local dev-machine diagnostic only; moved to `tools/` for root cleanliness; not in application code |

---

## 2. Excluded Skill Workflow

The `10k-websites` skill is a specialised cinematic scroll-driven marketing-site workflow. It prescribes:
- Plain HTML/CSS/vanilla JavaScript (no build step)
- Higgsfield for AI image and video generation
- FFmpeg for video processing
- Hostinger for deployment

**None of these apply to BRANDCORE.** BRANDCORE is a React application with a Python backend on Cloudflare. See ADR-007 in `docs/DECISIONS.md`.

The 10k-websites files remain in the repository as reference material only. They do not govern any BRANDCORE build, deployment or UI decision.

---

## 3. Cloudflare Runtime Verification

**Status:** 5/5 checks PASS — Workers AI PASS_REMOTE (attempt 4, 2026-11-04).

| Check | Official URL | Verified Date | Result |
|-------|-------------|--------------|--------|
| Python Workers ASGI integration | https://developers.cloudflare.com/workers/languages/python/ | 2026-11-04 | **PASS_LOCAL** — `workers.asgi.entrypoint()` pattern confirmed; `Default = entrypoint(app)` required |
| Pywrangler local dev | https://developers.cloudflare.com/workers/languages/python/packages/ | 2026-11-04 | **PASS_LOCAL** — `workers-py==1.17.9` provides `pywrangler 1.17.9`; `uv run pywrangler dev --local` works |
| Workers Static Assets configuration | https://developers.cloudflare.com/workers/static-assets/ | 2026-11-04 | **PASS_LOCAL** — `GET /` returns HTTP 200 `text/html` from same Worker origin |
| D1 Python binding | https://developers.cloudflare.com/d1/ | 2026-11-04 | **PASS_LOCAL** — parameterized insert + read via `env.DB`; migration applied locally |
| R2 Python binding | https://developers.cloudflare.com/r2/ | 2026-11-04 | **PASS_LOCAL** — `env.ASSETS.put()` and `.get()` verified with fixed POC key |
| Workers AI Python binding | https://developers.cloudflare.com/workers-ai/configuration/bindings/ | 2026-11-04 | **PASS_REMOTE** — Gate B and Gate B-sub approved. `brandcore.workers.dev` registered. `wrangler.jsonc` `"ai": {"binding": "AI", "remote": true}` confirmed correct. Four attempts total. Attempts 1–3 failed (upstream error; Pydantic schema mismatch ×2). Schema-fix approval granted: `claim_type: str \| None`, `numeric_value: str \| int \| float \| None`, raw+usage captured before Pydantic. Attempt 4: HTTP 200 (4.262s); Pydantic PASS; tokens 86+64=150; raw and usage captured. Evidence: `docs/evidence/M1-06/attempt-4-final/`. |
| Wrangler JSONC configuration syntax | https://developers.cloudflare.com/workers/wrangler/configuration/ | 2026-11-04 | **PASS** — `node JSON.parse` validates; `migrations_dir` added for D1 |

**Pyodide runtime version:** 3.14.2 (CPython 3.14) — confirmed by `pywrangler sync` output (`pyodide-py==314.0.7`).
**compatibility_date updated:** `2024-12-01` → `2026-09-08` (Python 3.14 default date per Cloudflare docs).

---

## 4. Package Versions (Verified 2026-11-04)

| Package | Resolved Version | Source | Status |
|---------|-----------------|--------|--------|
| react | 18.3.1 | npm (package-lock.json) | **VERIFIED** |
| react-dom | 18.3.1 | npm (package-lock.json) | **VERIFIED** |
| vite | 5.4.21 | npm (package-lock.json) | **VERIFIED** |
| @vitejs/plugin-react | 4.3.4 | npm (package-lock.json) | **VERIFIED** |
| tailwindcss | 3.4.17 | npm (package-lock.json) | **VERIFIED** |
| autoprefixer | 10.4.21 | npm (package-lock.json) | **VERIFIED** |
| postcss | 8.5.6 | npm (package-lock.json) | **VERIFIED** |
| fastapi | 0.162.0 | uv.lock | **VERIFIED** |
| pydantic | 2.14.2 | uv.lock | **VERIFIED** |
| workers-py | 1.17.9 | uv.lock | **VERIFIED** |
| workers-runtime-sdk | 1.9.6 | uv.lock | **VERIFIED** |
| pyodide-py | 314.0.7 | uv.lock (via pywrangler sync) | **VERIFIED** — confirms CPython 3.14 runtime |
| pytest | 9.2.0 | uv.lock | **VERIFIED** |
| httpx | 0.28.1 | uv.lock | **VERIFIED** |
| uvicorn | removed | — | Removed from runtime deps (not used in Worker) |

**npm audit findings (dev tooling only — not in production bundle):**
- esbuild ≤0.24.2 (moderate): Vite dev server only. Fix requires Vite 8.x (breaking change, not approved).
- minimatch <11.0.1 (moderate/high): eslint tooling only. Fix requires eslint 4.x (breaking change, not approved).
- No production bundle vulnerabilities.

---

## 5. ECC Integration

ECC is an on-demand specialist library. No ECC hooks are registered. No ECC skills are auto-activated.

If an ECC specialist is needed (e.g., accessibility audit, e2e testing), invoke it explicitly:
```
"Read C:\Users\smrit\.claude\skills\ECC\skills\accessibility\SKILL.md and apply it to this change."
```

Do not register ECC hooks without reviewing each hook script first. See `ECC_INTEGRATION_GUIDE.md` §4–5.

---

## 6. Unresolved Items

| Item | Owner | Priority | Notes |
|------|-------|----------|-------|
| Workers AI POC (M1-06) | Mritunjay | ~~Critical~~ | **RESOLVED** — PASS_REMOTE 2026-11-04. Attempt 4: HTTP 200 (4.262s); Pydantic valid; tokens 86+64=150; raw and usage captured. Evidence: `docs/evidence/M1-06/attempt-4-final/`. |
| workers.dev subdomain registration | Mritunjay | High | Required before `pywrangler dev` (without `--local`) or any deployment |
| Cloudflare account IDs | Mritunjay | Medium | Placeholder `<D1_DATABASE_ID>` in `wrangler.jsonc`; real ID requires user approval |
| Repository relocation to C:\dev\BRANDCORE | Mritunjay | Medium | Gate C approved but not yet executed; OneDrive lock risk remains for node_modules |
| Git repository initialization | Mritunjay | Medium | Requires explicit user approval |
| httpx deprecation warning | Mritunjay | Low | `starlette.testclient` prefers `httpx2`; tests pass; address before M2 |

---

## 7. Windows Environment Notes

Per `DEVELOPMENT_WORKFLOW.md` §17:
- Project is currently under OneDrive Desktop. This can cause lock errors with `node_modules` and `.git`. Consider moving to `C:\dev\BRANDCORE`.
- Enable long paths: `git config --global core.longpaths true`
- Use PowerShell or cmd.exe consistently; do not mix with bash syntax.
- Line endings: `.gitattributes` sets `* text=auto eol=lf`.
