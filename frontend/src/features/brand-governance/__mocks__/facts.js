/**
 * MOCK DATA — brand-governance/facts
 * Replace with api.getFacts() / api.createFact() calls in M5-05.
 */

export const MOCK_WORKSPACE_ID = 'ws-lumora-demo'

export const MOCK_EVIDENCE = [
  {
    id: 'ev-internal-study',
    title: 'Lumora Glow Cream 8-week clinical study',
    source_type: 'internal_study',
  },
  {
    id: 'ev-third-party-report',
    title: 'Dermatology third-party sensitivity report',
    source_type: 'third_party_report',
  },
]

export const MOCK_FACTS = [
  {
    id: 'fact-dark-spots',
    workspace_id: MOCK_WORKSPACE_ID,
    text: 'Lumora Glow Cream reduces the appearance of dark spots by up to 30 percent in 8 weeks.',
    numeric_value: '30',
    unit: 'percent',
    qualifier: 'up to',
    scope: { product: 'Lumora Glow Cream', region: 'IN', valid_until: '2027-06-30' },
    evidence_id: 'ev-internal-study',
    version: 1,
    status: 'active',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'fact-sensitive-skin',
    workspace_id: MOCK_WORKSPACE_ID,
    text: 'Dermatologist-tested for sensitive skin; non-irritating.',
    numeric_value: null,
    unit: null,
    qualifier: null,
    scope: { product: 'Lumora Glow Cream', region: 'IN', valid_until: null },
    evidence_id: 'ev-third-party-report',
    version: 1,
    status: 'active',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'fact-spf-50',
    workspace_id: MOCK_WORKSPACE_ID,
    text: 'SPF 50 sun protection.',
    numeric_value: '50',
    unit: 'SPF',
    qualifier: null,
    scope: { product: 'Lumora Glow Cream', region: 'IN', valid_until: '2027-06-30' },
    evidence_id: 'ev-internal-study',
    version: 1,
    status: 'active',
    created_at: '2026-11-01T10:00:00Z',
  },
]

/** Simulates GET /api/workspaces/:id/facts */
export function mockGetFacts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ facts: MOCK_FACTS }), 400)
  })
}

/** Simulates POST /api/workspaces/:id/facts */
export function mockCreateFact(fact) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...fact,
        id: `fact-${Date.now()}`,
        workspace_id: MOCK_WORKSPACE_ID,
        version: 1,
        status: 'active',
        created_at: new Date().toISOString(),
      })
    }, 500)
  })
}

/** Simulates edit — creates a new version row server-side */
export function mockUpdateFact(fact) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...fact, version: fact.version + 1 }), 500)
  })
}
