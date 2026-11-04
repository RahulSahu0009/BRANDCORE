# BRANDCORE — Product Requirements Document

**Version:** 0.1.0 · **Tier:** T2 · **Event:** CodeNexus India 2026 · **Team:** SMRITUNJAY837
**Status:** Draft — Round 2 scope

---

## 1. Problem

Brand content is produced by multiple people and can contain:
- Inconsistent messaging or unsupported claims
- Claims stronger than the approved evidence allows
- Missing qualifiers, expired offers, or out-of-date facts
- No mechanism to detect which approved content depended on a fact that later changed

Reviewers compare content against scattered guidelines and evidence manually. Teams have no systematic way to know which older approved content is now stale because an underlying fact changed.

---

## 2. Users

| Role | Responsibility |
|------|---------------|
| Brand administrator | Maintains approved facts, evidence references, terminology and policy rules |
| Content creator | Submits copy for review and makes corrections |
| Reviewer / approver | Examines findings and makes the final human decision for a specific content version |
| Brand operations lead | Monitors releases, stale content and revalidation work |

---

## 3. Jobs to Be Done

- **Brand admin:** Define and version approved facts with scope, qualifier and evidence reference.
- **Content creator:** Submit copy and receive structured, explainable findings with suggested corrections.
- **Reviewer:** See exact affected claims, reasons, evidence and make an informed approve/reject decision.
- **Brand ops lead:** Know which releases are stale after a fact changes and queue revalidation.

---

## 4. Round 2 MVP Workflow

1. Open the seeded BRANDCORE demo workspace.
2. View or create an approved fact with scope, qualifier and evidence reference.
3. Submit a content item.
4. Use AI to extract candidate claims into structured data.
5. Validate model output with Pydantic.
6. Run deterministic checks against approved facts and policy rules.
7. Display findings with the exact affected claim, reason, relevant fact/evidence and a suggested correction.
8. Allow a human reviewer to approve, request changes or reject the exact content version.
9. Create an immutable Release Passport bound to the content hash, policy version and evidence/fact versions used.
10. Change an approved fact and find dependent releases.
11. Mark affected releases STALE and queue them for human revalidation without rewriting the historical passport.

---

## 5. Required Finding Types

| Type | Description |
|------|-------------|
| Unsupported claim | Claim has no approved evidence reference |
| Numeric mismatch | Number in content differs from approved fact |
| Claim stronger than evidence | Claim exceeds what the evidence supports |
| Missing qualifier or disclaimer | Required qualifier absent |
| Scope mismatch | Product, region, date or audience outside approved scope |
| Expired offer or date | Date or offer has passed |
| Unapproved terminology | Term not in the approved terminology list |

---

## 6. In Scope (Round 2)

- Seeded fictional demo brand workspace
- Approved facts and evidence references
- Content submission and immutable content versions
- AI-assisted claim extraction with Pydantic schema validation
- Deterministic rule checks for all seven finding types
- Human review and decision recording
- Version-bound Release Passport
- Fact-change impact query and STALE status
- Simple stale-release impact queue and revalidation action

---

## 7. Out of Scope (Round 2)

- Real multi-tenant customer onboarding
- Production authentication, enterprise SSO or advanced organization administration
- Public self-service registration
- Unrestricted public document uploads
- Live social-media or public-web crawling
- Video or audio content review
- Automated logo recognition or full visual brand comparison
- Model fine-tuning or custom training
- Payments, billing and subscription management
- Claims that AI independently proves truth or legal compliance
- Non-essential animation, elaborate onboarding and analytics dashboards

---

## 8. Success Criteria

| Criterion | Measure |
|-----------|---------|
| Primary workflow completes end-to-end | All 11 steps in §4 work in the demo |
| All seven finding types detected | Each type has at least one test case that passes |
| Release Passport is immutable | SHA-256 hash verified; no mutation path exists |
| Stale detection works | Changing a fact marks dependent releases STALE |
| Human approval is required | No automated approval path exists |
| Demo data only | No real customer data in the system |

---

## 9. Performance and Accessibility Targets

| Target | Value | Status |
|--------|-------|--------|
| Mobile LCP | ≤ 2.5 s | NOT MEASURED — measure on deployed build |
| Mobile INP | ≤ 200 ms | NOT MEASURED — measure on deployed build |
| Mobile CLS | ≤ 0.1 | NOT MEASURED — measure on deployed build |
| Initial route JS | ≤ 170 KB compressed | NOT MEASURED — measure on deployed build |
| WCAG | 2.2 AA | NOT VERIFIED — verify with axe on deployed build |

Targets must be measured on the deployed build. Do not report them as achieved until measured.

---

## 10. Cost and Usage Budget

| Item | Budget | Status |
|------|--------|--------|
| Monthly Cloudflare Workers cost | TBD | Not estimated |
| Monthly D1 cost | TBD | Not estimated |
| Monthly R2 cost | TBD | Not estimated |
| Workers AI cost per review | TBD | Not estimated |
| Total monthly budget | TBD | Not estimated |

Set provider spend alerts at 50/80/100% of budget once budget is defined.

---

## 11. Security and Privacy Boundaries

- Demo workspace uses fictional seed data only. Production use is not approved.
- The browser must never access D1, R2 or Workers AI directly.
- All private binding access goes through the backend.
- Do not enable arbitrary public uploads until server-side controls are implemented.
- No real customer confidential information or private documents.
- Demo role switching is a demonstration convenience and must not be represented as production authentication.

---

## 12. Round 3 Direction

1. **Real workspace onboarding** — multi-tenant setup with proper authentication and organization administration.
2. **Richer evidence management** — structured evidence documents, version diffs and evidence expiry tracking.
3. **Audit and compliance reporting** — exportable audit trails, policy coverage reports and revalidation history.
