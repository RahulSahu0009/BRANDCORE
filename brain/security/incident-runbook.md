# BRANDCORE — Incident Runbook

**Owner:** Mritunjay Singh · **Date:** 2026-11-04
**Purpose:** Who to notify, safe takedown, credential rotation and recovery steps.

---

## 1. Who to Notify

| Severity | Notify | Contact | Within |
|----------|--------|---------|--------|
| Critical (secret exposed, data breach) | Team Lead | smritunjay837@gmail.com | Immediately |
| High (service down, unauthorized access) | Team Lead + all team members | Team chat | 30 minutes |
| Medium (degraded service, suspicious activity) | Team Lead | Team chat | 2 hours |

For CodeNexus India 2026: notify event organizers if the incident affects demo integrity.

---

## 2. Safe Takedown

If the service must be taken down immediately:

```bash
# Disable the Worker (requires Cloudflare login — get explicit approval first)
# Option 1: Cloudflare dashboard → Workers → BRANDCORE worker → Disable
# Option 2: wrangler (requires credentials)
# wrangler delete --name brandcore-worker

# Do NOT run these commands without explicit approval from Mritunjay Singh.
```

**Before taking down:** confirm the incident warrants it. A degraded demo is not a takedown trigger. A confirmed secret exposure or data breach is.

---

## 3. Credential Rotation

If a secret is suspected compromised:

1. **Identify** which secret is affected (see `brain/security/secrets.md`).
2. **Generate** a new secret value using a cryptographically secure method.
3. **Update** in Cloudflare: `wrangler secret put <SECRET_NAME>` (requires Cloudflare login — get approval).
4. **Revoke** the old secret at the source (Cloudflare dashboard or provider).
5. **Verify** the Worker functions with the new secret.
6. **Record** the rotation date in `brain/security/secrets.md` (date only, no values).
7. **Scan** git history: `gitleaks detect --source . --log-opts="--all"` to confirm the secret was never committed.

---

## 4. Recovery Steps

After an incident is contained:

1. Confirm the attack vector is closed (patch deployed, secret rotated, access revoked).
2. Review audit logs in D1 `audit_event` table for the affected time window.
3. Assess whether any Release Passports or approved facts were tampered with (compare content hashes).
4. If data integrity is in doubt, restore from the last known-good backup (see `deployment/rollback.md`).
5. Update `brain/security/security-checklist.md` with findings and new evidence.
6. Write a brief post-incident note in `docs/DECISIONS.md` as an ADR if an architecture change is needed.

---

## 5. Test Status

This runbook has not been tested. Test it before any real user access.
