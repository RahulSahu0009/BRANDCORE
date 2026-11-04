/**
 * BRANDCORE API client.
 * All requests use relative /api paths — no hardcoded origins.
 * The browser never accesses D1, R2 or Workers AI directly.
 */

const BASE = '/api'

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, options)
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? 'Request failed')
    err.code = data?.error?.code
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  health: () => request('GET', '/health'),

  getWorkspace: (workspaceId) =>
    request('GET', `/workspaces/${workspaceId}`),

  getFacts: (workspaceId) =>
    request('GET', `/workspaces/${workspaceId}/facts`),

  createFact: (workspaceId, fact) =>
    request('POST', `/workspaces/${workspaceId}/facts`, fact),

  submitContent: (workspaceId, content) =>
    request('POST', `/workspaces/${workspaceId}/content`, content),

  getContentVersions: (workspaceId, contentItemId) =>
    request('GET', `/workspaces/${workspaceId}/content/${contentItemId}/versions`),

  analyzeContent: (workspaceId, contentVersionId) =>
    request('POST', `/workspaces/${workspaceId}/content/${contentVersionId}/analyze`),

  submitReview: (workspaceId, contentVersionId, decision) =>
    request('POST', `/workspaces/${workspaceId}/content/${contentVersionId}/review`, decision),

  getReleases: (workspaceId) =>
    request('GET', `/workspaces/${workspaceId}/releases`),

  getStaleImpact: (workspaceId, releaseId) =>
    request('GET', `/workspaces/${workspaceId}/releases/${releaseId}/stale-impact`),
}
