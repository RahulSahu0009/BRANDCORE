# BRANDCORE — Rollback Procedure

**Owner:** Mritunjay Singh · **Version:** 0.1.0
**Target:** Rollback within 10 minutes of identifying a critical issue.
**Status:** NOT TESTED — test this procedure before any production deployment.

---

## 1. Rollback Triggers

Roll back immediately if:
- A deployed change causes the health endpoint (`GET /api/health`) to return non-200
- A deployed change causes data corruption or incorrect release passport creation
- A secret is exposed in a deployed artifact
- A critical security vulnerability is confirmed in the deployed version

Do not roll back for:
- Minor UI issues that do not affect the primary workflow
- Performance degradation that is not critical
- Issues that can be fixed with a forward patch in under 10 minutes

---

## 2. Worker Rollback Steps

```powershell
# List recent deployments
wrangler deployments list

# Roll back to a previous deployment
wrangler rollback <deployment-id>

# Verify rollback
# Test: GET https://<worker-url>/api/health
# Expected: {"status": "ok"}
```

**Requires:** Cloudflare login and explicit approval from Mritunjay Singh.

---

## 3. Database Migration Safety

- All D1 migrations must be reversible or use the expand → migrate → contract pattern.
- Never run a destructive migration in the same release as the code that stops using the column.
- Test restore before any production migration.

```powershell
# Apply a migration
wrangler d1 migrations apply brandcore-db

# Roll back a migration (requires a down migration file)
# See database/migrations/README.md for the migration approach
```

If a migration cannot be rolled back automatically:
1. Stop the Worker (disable in Cloudflare dashboard).
2. Restore from the last known-good D1 backup (if available).
3. Roll back the Worker deployment.
4. Notify the team.

---

## 4. Recovery Owner

**Primary:** Mritunjay Singh (smritunjay837@gmail.com)
**Backup:** Any team member with Cloudflare account access.

---

## 5. Post-Rollback Steps

1. Confirm the rollback is stable (health endpoint returns 200; primary workflow functional).
2. Identify the root cause of the issue.
3. Fix the issue on a new branch.
4. Add a test that would have caught the issue.
5. Re-deploy through the normal preview → production gate.
6. Record the incident in `docs/DECISIONS.md` as an ADR if an architecture change is needed.

---

## 6. Test Status

This rollback procedure has not been tested. Test it before any production deployment by:
1. Deploying a known-good version.
2. Deploying a version with a deliberate health endpoint failure.
3. Running the rollback steps above.
4. Confirming the health endpoint returns 200 after rollback.
5. Recording the result in this file.
