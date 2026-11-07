/**
 * MOCK DATA — release-governance/releases
 * Replace with api.getReleases() / api.getStaleImpact() calls in M5-05.
 */

import { MOCK_WORKSPACE_ID } from '../../brand-governance/__mocks__/facts.js'

export { MOCK_WORKSPACE_ID }

export const MOCK_RELEASES = [
  {
    id: 'rp-summer-v2',
    workspace_id: MOCK_WORKSPACE_ID,
    content_version_id: 'cv-summer-v2',
    content_sha256: 'a3f1c2e4b5d6a7f8e9c0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    policy_version_id: 'policy-brand-voice',
    status: 'valid',
    approver_id: 'reviewer-1',
    approver_role: 'reviewer',
    approved_at: '2026-11-05T14:30:00Z',
    fact_evidence_versions: [
      { type: 'fact', id: 'fact-dark-spots', version: 1 },
      { type: 'fact', id: 'fact-sensitive-skin', version: 1 },
      { type: 'evidence', id: 'ev-internal-study', version: 1 },
    ],
  },
  {
    id: 'rp-winter-v1',
    workspace_id: MOCK_WORKSPACE_ID,
    content_version_id: 'cv-winter-v1',
    content_sha256: 'b4e2d3f5c6a7b8e9f0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
    policy_version_id: 'policy-brand-voice',
    status: 'stale',
    approver_id: 'reviewer-1',
    approver_role: 'reviewer',
    approved_at: '2026-10-20T09:00:00Z',
    fact_evidence_versions: [
      { type: 'fact', id: 'fact-dark-spots', version: 1 },
      { type: 'evidence', id: 'ev-internal-study', version: 1 },
    ],
  },
  {
    id: 'rp-spring-v1',
    workspace_id: MOCK_WORKSPACE_ID,
    content_version_id: 'cv-spring-v1',
    content_sha256: 'c5f3e4a6d7b8c9f0e1a2b3d4e5f6a7c8d9e0f1b2c3d4e5f6a7b8c9d0e1f2a3b4',
    policy_version_id: 'policy-brand-voice',
    status: 'revoked',
    approver_id: 'reviewer-2',
    approver_role: 'reviewer',
    approved_at: '2026-09-15T11:00:00Z',
    fact_evidence_versions: [
      { type: 'fact', id: 'fact-spf-50', version: 1 },
    ],
  },
  {
    id: 'rp-promo-v1',
    workspace_id: MOCK_WORKSPACE_ID,
    content_version_id: 'cv-promo-v1',
    content_sha256: 'd6a4f5b7e8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    policy_version_id: 'policy-brand-voice',
    status: 'invalid',
    approver_id: 'reviewer-2',
    approver_role: 'reviewer',
    approved_at: '2026-08-01T08:00:00Z',
    fact_evidence_versions: [],
  },
]

export const MOCK_STALE_IMPACT = {
  'rp-winter-v1': {
    release_id: 'rp-winter-v1',
    status: 'stale',
    stale_reason: 'Approved fact fact-dark-spots version 1 was superseded by version 2.',
    stale_since: '2026-11-03T10:00:00Z',
    revalidation_required: true,
  },
}

/** Simulates GET /api/workspaces/:id/releases */
export function mockGetReleases() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ releases: MOCK_RELEASES }), 400)
  })
}

/** Simulates GET /api/workspaces/:id/releases/:id/stale-impact */
export function mockGetStaleImpact(releaseId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const impact = MOCK_STALE_IMPACT[releaseId]
      if (impact) resolve(impact)
      else reject(new Error('No stale impact data found for this release.'))
    }, 350)
  })
}
