import React, { useEffect, useState } from 'react'
import { mockGetReleases, mockGetStaleImpact } from './__mocks__/releases.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function shortHash(hash) {
  if (!hash) return '—'
  return hash.slice(0, 12) + '…'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PassportStatusBadge({ status }) {
  const map = {
    valid:    { bg: 'bg-[#DDF5E7]', text: 'text-[#137547]', label: 'VALID' },
    stale:    { bg: 'bg-[#FFF1CC]', text: 'text-[#986000]', label: 'STALE' },
    revoked:  { bg: 'bg-[#FEE4E2]', text: 'text-[#B42318]', label: 'REVOKED' },
    invalid:  { bg: 'bg-[#FEE4E2]', text: 'text-[#B42318]', label: 'INVALID' },
  }
  const s = map[status] ?? { bg: 'bg-[#EEF2F6]', text: 'text-[#42556B]', label: status.toUpperCase() }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading releases" className="flex flex-col gap-2">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-12 rounded bg-[#EEF2F6] animate-pulse" />
      ))}
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded bg-[#FEE4E2] border border-[#B42318]/20">
      <span className="text-[#B42318] text-sm font-medium shrink-0">Error</span>
      <span className="text-sm text-[#B42318] flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-[#B42318] underline underline-offset-2 shrink-0 focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#DCE3EA] rounded bg-white">
      <p className="text-sm font-medium text-[#42556B]">No release passports yet</p>
      <p className="text-xs text-[#718197] mt-1">
        Passports are created when a reviewer approves a content version.
      </p>
    </div>
  )
}

// ── Stale impact panel ────────────────────────────────────────────────────────

function StaleImpactPanel({ releaseId, onClose }) {
  const [state, setState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [impact, setImpact] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setState('loading')
    mockGetStaleImpact(releaseId)
      .then((data) => { setImpact(data); setState('ready') })
      .catch((err) => { setError(err.message ?? 'Failed to load stale impact.'); setState('error') })
  }, [releaseId])

  return (
    <div className="mt-3 border border-[#DCE3EA] rounded bg-[#F5F7FA] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#42556B]">Stale impact</span>
        <button
          onClick={onClose}
          aria-label="Close stale impact"
          className="text-xs text-[#718197] hover:text-[#42556B] focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
        >
          ✕
        </button>
      </div>

      {state === 'loading' && (
        <div aria-busy="true" aria-label="Loading stale impact" className="h-8 rounded bg-[#EEF2F6] animate-pulse" />
      )}

      {state === 'error' && (
        <p role="alert" className="text-xs text-[#B42318]">{error}</p>
      )}

      {state === 'ready' && impact && (
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-xs text-[#718197] w-32 shrink-0">Reason</dt>
            <dd className="text-xs text-[#162638]">{impact.stale_reason}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-xs text-[#718197] w-32 shrink-0">Stale since</dt>
            <dd className="text-xs text-[#162638]">{formatDateTime(impact.stale_since)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-xs text-[#718197] w-32 shrink-0">Revalidation</dt>
            <dd className="text-xs">
              {impact.revalidation_required
                ? <span className="text-[#986000] font-medium">Required</span>
                : <span className="text-[#718197]">Not required</span>}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReleasePassports() {
  const [releases, setReleases] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  function load() {
    setLoadState('loading')
    setLoadError(null)
    mockGetReleases()
      .then(({ releases: data }) => { setReleases(data); setLoadState('ready') })
      .catch((err) => { setLoadError(err.message ?? 'Failed to load releases.'); setLoadState('error') })
  }

  useEffect(() => { load() }, [])

  function toggleStaleImpact(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <section aria-label="Release Passports">
      <h1 className="text-xl font-bold text-[#162638] mb-4">Releases</h1>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-[#718197]">Lumora Skincare · Demo workspace</p>
      </div>

      {loadState === 'loading' && <Skeleton />}

      {loadState === 'error' && (
        <ErrorBanner message={loadError} onRetry={load} />
      )}

      {loadState === 'ready' && releases.length === 0 && <EmptyState />}

      {loadState === 'ready' && releases.length > 0 && (
        <div className="bg-white border border-[#DCE3EA] rounded overflow-hidden overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3EA] bg-[#F5F7FA]">
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Passport ID
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Content version
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Content hash
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Approved by
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Approved at
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#42556B] text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release, idx) => (
                <React.Fragment key={release.id}>
                  <tr className={`border-b border-[#DCE3EA] ${expandedId === release.id ? '' : 'last:border-0'} ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'}`}>
                    <td className="px-4 py-3 text-[#162638] align-top">
                      <span className="font-mono text-xs">{release.id}</span>
                    </td>
                    <td className="px-4 py-3 text-[#42556B] align-top">
                      <span className="font-mono text-xs">{release.content_version_id}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className="font-mono text-xs text-[#42556B]"
                        title={release.content_sha256}
                      >
                        {shortHash(release.content_sha256)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#42556B] align-top">
                      <span className="block">{release.approver_id}</span>
                      <span className="text-xs text-[#718197]">{release.approver_role}</span>
                    </td>
                    <td className="px-4 py-3 text-[#42556B] align-top whitespace-nowrap">
                      {formatDate(release.approved_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <PassportStatusBadge status={release.status} />
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {release.status === 'stale' && (
                        <button
                          onClick={() => toggleStaleImpact(release.id)}
                          aria-expanded={expandedId === release.id}
                          aria-controls={`stale-panel-${release.id}`}
                          className="text-xs text-[#986000] hover:underline focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
                        >
                          {expandedId === release.id ? 'Hide impact' : 'View impact'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === release.id && (
                    <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'}>
                      <td
                        colSpan={7}
                        id={`stale-panel-${release.id}`}
                        className="px-4 pb-4"
                      >
                        <StaleImpactPanel
                          releaseId={release.id}
                          onClose={() => setExpandedId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[#DCE3EA] bg-[#F5F7FA]">
            <span className="text-xs text-[#718197]">
              {releases.length} {releases.length === 1 ? 'passport' : 'passports'}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
