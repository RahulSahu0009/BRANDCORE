/**
 * Content-review data access.
 *
 * Single switch point between the labelled mock fixture and the real API so
 * components never import mocks directly. Keep the switch enabled until the
 * proposed content endpoints are deployed.
 */
import { api } from '../../services/api.js'
import {
  mockAnalyzeContent,
  mockGetContentVersions,
  mockSubmitContent,
  mockSubmitReview,
} from './__mocks__/contentApi.mock.js'

// Set VITE_USE_MOCK_API=false only after the proposed content endpoints are deployed.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

/** Seeded fictional demo workspace (deterministic uuid5 from src/app/seed_demo.py). */
export const DEMO_WORKSPACE_ID = 'ece5a803-9018-5e1d-b355-fffc4d41a33b'

/** Limits from docs/API_CONTRACT.md §3.4. The server remains authoritative. */
export const TITLE_MAX = 200
export const BODY_MAX = 10000

export function submitContent(workspaceId, content, { simulateError = false } = {}) {
  if (USE_MOCK_API) {
    return mockSubmitContent(workspaceId, content, { simulateError })
  }
  return api.submitContent(workspaceId, content)
}

export function analyzeContent(workspaceId, contentVersionId) {
  if (USE_MOCK_API) return mockAnalyzeContent(workspaceId, contentVersionId)
  return api.analyzeContent(workspaceId, contentVersionId)
}

export function getContentVersions(workspaceId, contentItemId) {
  if (USE_MOCK_API) return mockGetContentVersions(workspaceId, contentItemId)
  return api.getContentVersions(workspaceId, contentItemId)
}

export function submitReview(workspaceId, contentVersionId, decision) {
  if (USE_MOCK_API) return mockSubmitReview(workspaceId, contentVersionId, decision)
  return api.submitReview(workspaceId, contentVersionId, decision)
}
