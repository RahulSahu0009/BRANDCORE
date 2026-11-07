/**
 * Content-review API access.
 * The backend content, analysis, version, and review routes are now live.
 */
import { api } from '../../services/api.js'

export const USE_MOCK_API = false
export const TITLE_MAX = 200
export const BODY_MAX = 10000

export function submitContent(workspaceId, content) {
  return api.submitContent(workspaceId, content)
}

export function analyzeContent(workspaceId, contentVersionId) {
  return api.analyzeContent(workspaceId, contentVersionId)
}

export function getContentVersions(workspaceId, contentItemId) {
  return api.getContentVersions(workspaceId, contentItemId)
}

export function submitReview(workspaceId, contentVersionId, decision) {
  return api.submitReview(workspaceId, contentVersionId, decision)
}
