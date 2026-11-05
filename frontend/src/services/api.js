/**
 * BRANDCORE — API Client
 * All requests use relative /api paths — no hardcoded origins.
 * Clerk session tokens are attached as Authorization: Bearer <token>
 * on every request when a user is signed in.
 *
 * Backend status tracking for honest connectivity display.
 * Auth errors (401/403) are surfaced to the caller — never silently
 * replaced with demo data.
 */
import { getToken } from '@clerk/react'

const BASE = '/api'

let statusListeners = []
let authErrorListeners = []

function notifyStatus(status) {
  statusListeners.forEach((cb) => cb(status))
}

function notifyAuthError(status) {
  authErrorListeners.forEach((cb) => cb(status))
}

export function onBackendStatusChange(callback) {
  statusListeners.push(callback)
  return () => {
    statusListeners = statusListeners.filter((cb) => cb !== callback)
  }
}

export function onAuthError(callback) {
  authErrorListeners.push(callback)
  return () => {
    authErrorListeners = authErrorListeners.filter((cb) => cb !== callback)
  }
}

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  let token = await getToken({ template: 'brandcore-api' })
  // Fallback to default token if template-specific token is unavailable
  if (!token) {
    token = await getToken()
  }
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

    if (res.status === 401) {
      notifyStatus('connected')
      notifyAuthError(401)
      const data = await res.json().catch(() => ({}))
      const err = new Error(data?.error?.message ?? 'Unauthorized')
      err.status = 401
      err.code = data?.error?.code
      throw err
    }

    if (res.status === 403) {
      notifyStatus('connected')
      notifyAuthError(403)
      const data = await res.json().catch(() => ({}))
      const err = new Error(data?.error?.message ?? 'Forbidden')
      err.status = 403
      err.code = data?.error?.code
      throw err
    }

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
    } else if (err.status !== 401 && err.status !== 403) {
      notifyStatus('connected')
    }
    throw err
  }
}

export const api = {
  health: () => request('GET', '/health'),

  listWorkspaces: () => request('GET', '/workspaces'),

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

  provisionWorkspace: (name, slug) =>
    request('POST', '/workspaces/provision', { name, slug }),
}
