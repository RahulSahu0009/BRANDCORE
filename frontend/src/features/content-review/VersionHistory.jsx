import React from 'react'

const STATUS_STYLES = {
  PENDING: 'bg-slate-100 text-slate-700',
  APPROVED: 'bg-green-100 text-green-800',
  CHANGES_REQUESTED: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function VersionHistory({ versions, loading, error }) {
  return (
    <section aria-labelledby="version-history-heading" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="version-history-heading" className="text-lg font-semibold text-text-primary">Version history</h2>
      <p className="mt-1 text-sm text-slate-600">Versions are immutable. Edits create a new version instead of changing an existing one.</p>
      {loading && <p role="status" className="mt-3 text-sm text-slate-600">Loading versions…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && (
        <ol className="mt-3 space-y-2">
          {versions.map((version) => (
            <li key={version.content_version_id || version.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm">
              <span><strong>Version {version.version_number}</strong> <time className="text-slate-600" dateTime={version.created_at}>{new Date(version.created_at).toLocaleString()}</time></span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[version.review_status] || STATUS_STYLES.PENDING}`}>{version.review_status || 'PENDING'}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
