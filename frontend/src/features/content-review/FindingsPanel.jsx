import React from 'react'
import FindingCard from './FindingCard.jsx'

export default function FindingsPanel({ findings, loading, error }) {
  return (
    <section aria-labelledby="findings-heading" className="space-y-3">
      <div>
        <h2 id="findings-heading" className="text-lg font-semibold text-text-primary">Review findings</h2>
        <p className="text-sm text-slate-600">Deterministic checks and AI extraction are advisory; a reviewer makes the final decision.</p>
      </div>
      {loading && <p role="status" className="text-sm text-slate-600">Analyzing content…</p>}
      {error && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!loading && !error && findings.length === 0 && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">No findings were returned.</p>
      )}
      {!loading && !error && findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}
    </section>
  )
}
