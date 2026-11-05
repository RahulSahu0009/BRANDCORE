/**
 * BRANDCORE — API Client
 * All requests use relative /api paths — no hardcoded origins.
 *
 * Two request types:
 *   - publicRequest: no Authorization header (for /api/health)
 *   - protectedRequest: Clerk session token as Bearer (all other endpoints)
 *
 * Uses Clerk's default session token (no custom template). Clerk returns 404
 * when a requested JWT template doesn't exist, so we never request one.
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

// Public requests — no Clerk token
async function publicHeaders() {
  return { 'Content-Type': 'application/json' }
}

// Protected requests — Clerk default session token
async function protectedHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  let token = null
  try {
    token = await getToken()
  } catch {
    // Clerk session not available — proceed without Authorization header
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function publicRequest(method, path, body) {
  const options = {
    method,
    headers: await publicHeaders(),
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
    } else if (err.status !== 401 && err.status !== 403) {
      notifyStatus('connected')
    }
    throw err
  }
}

async function protectedRequest(method, path, body) {
  const options = {
    method,
    headers: await protectedHeaders(),
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
  health: () => publicRequest('GET', '/health'),

  listWorkspaces: () => protectedRequest('GET', '/workspaces'),

  getWorkspace: (workspaceId) =>
    protectedRequest('GET', `/workspaces/${workspaceId}`),

  getFacts: (workspaceId) =>
    protectedRequest('GET', `/workspaces/${workspaceId}/facts`),

  createFact: (workspaceId, fact) =>
    protectedRequest('POST', `/workspaces/${workspaceId}/facts`, fact),

  submitContent: (workspaceId, content) =>
    protectedRequest('POST', `/workspaces/${workspaceId}/content`, content),

  getContentVersions: (workspaceId, contentItemId) =>
    protectedRequest('GET', `/workspaces/${workspaceId}/content/${contentItemId}/versions`),

  analyzeContent: (workspaceId, contentVersionId) =>
    protectedRequest('POST', `/workspaces/${workspaceId}/content/${contentVersionId}/analyze`),

  submitReview: (workspaceId, contentVersionId, decision) =>
    protectedRequest('POST', `/workspaces/${workspaceId}/content/${contentVersionId}/review`, decision),

  getReleases: (workspaceId) =>
    protectedRequest('GET', `/workspaces/${workspaceId}/releases`),

  getStaleImpact: (workspaceId, releaseId) =>
    protectedRequest('GET', `/workspaces/${workspaceId}/releases/${releaseId}/stale-impact`),

  provisionWorkspace: (name, slug) =>
    protectedRequest('POST', '/workspaces/provision', { name, slug }),
}
