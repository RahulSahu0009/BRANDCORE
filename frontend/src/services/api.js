/**
 * BRANDCORE — API Client
 * All requests use relative /api paths — no hardcoded origins.
 * The browser never accesses D1, R2 or Workers AI directly.
 * Clerk session tokens are attached as Authorization: Bearer <token>
 * on every request when a user is signed in.
 *
 * Backend status tracking for honest connectivity display.
 */
import { getToken } from '@clerk/react'

const BASE = '/api'

let statusListeners = []

function notifyStatus(status) {
  statusListeners.forEach((cb) => cb(status))
}

export function onBackendStatusChange(callback) {
  statusListeners.push(callback)
  return () => {
    statusListeners = statusListeners.filter((cb) => cb !== callback)
  }
}

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = await getToken({ template: 'brandcore-api' })
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function request(method, path, body) {
  const options = {
    method,
    headers: await getAuthHeaders(),
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  notifyStatus('connecting')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    notifyStatus('connected')
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data?.error?.message ?? 'Request failed')
      err.code = data?.error?.code
      err.status = res.status
      throw err
    }
    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      notifyStatus('offline')
    } else {
      notifyStatus('connected')
    }
    throw err
  }
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
