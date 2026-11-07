/**
 * MOCK DATA — brand-governance/evidence
 * Replace with real API calls in M5-05.
 *
 * IDs are imported from facts.js to keep a single source of truth.
 * MOCK_EVIDENCE in facts.js holds the minimal shape needed by FactForm.
 * This file extends those same records with the full evidence shape.
 */

import { MOCK_EVIDENCE as EVIDENCE_STUBS, MOCK_WORKSPACE_ID } from './facts.js'

const [EV_STUDY_ID, EV_REPORT_ID] = EVIDENCE_STUBS.map((e) => e.id)

export { MOCK_WORKSPACE_ID }

export const MOCK_EVIDENCE_FULL = [
  {
    id: EV_STUDY_ID,
    workspace_id: MOCK_WORKSPACE_ID,
    title: 'Lumora Glow Cream 8-week clinical study',
    source_type: 'internal_study',
    summary:
      'Double-blind study showing up to 30% dark-spot reduction in 8 weeks across a panel of 120 subjects.',
    source_url: 'internal://lumora/study/glow-cream-2026',
    version: 1,
    status: 'active',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: EV_REPORT_ID,
    workspace_id: MOCK_WORKSPACE_ID,
    title: 'Dermatology third-party sensitivity report',
    source_type: 'third_party_report',
    summary:
      'Panel of 50 subjects; product rated non-irritating for sensitive skin by independent dermatology lab.',
    source_url: 'internal://lumora/report/sensitivity-2026',
    version: 1,
    status: 'active',
    created_at: '2026-11-01T10:00:00Z',
  },
]

export const SOURCE_TYPE_LABELS = {
  internal_study: 'Internal study',
  third_party_report: 'Third-party report',
  regulatory_filing: 'Regulatory filing',
  peer_reviewed_paper: 'Peer-reviewed paper',
  other: 'Other',
}

export const SOURCE_TYPE_OPTIONS = Object.entries(SOURCE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
)

/** Simulates GET /api/workspaces/:id/evidence */
export function mockGetEvidence() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ evidence: MOCK_EVIDENCE_FULL }), 400)
  })
}

/** Simulates POST /api/workspaces/:id/evidence */
export function mockCreateEvidence(record) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...record,
        id: `ev-${Date.now()}`,
        workspace_id: MOCK_WORKSPACE_ID,
        version: 1,
        status: 'active',
        created_at: new Date().toISOString(),
      })
    }, 500)
  })
}

/** Simulates edit — creates a new version row server-side */
export function mockUpdateEvidence(record) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...record, version: record.version + 1 }), 500)
  })
}
