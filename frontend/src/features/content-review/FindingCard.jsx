import React from 'react'

const FINDING_STYLES = {
  unsupported_claim: ['Unsupported claim', 'border-red-300 bg-red-50 text-red-800'],
  numeric_mismatch: ['Numeric mismatch', 'border-orange-300 bg-orange-50 text-orange-800'],
  claim_stronger_than_evidence: ['Claim stronger than evidence', 'border-orange-300 bg-orange-50 text-orange-800'],
  missing_qualifier: ['Missing qualifier', 'border-yellow-300 bg-yellow-50 text-yellow-800'],
  scope_mismatch: ['Scope mismatch', 'border-yellow-300 bg-yellow-50 text-yellow-800'],
  expired_offer: ['Expired offer', 'border-red-300 bg-red-50 text-red-800'],
  unapproved_terminology: ['Unapproved terminology', 'border-purple-300 bg-purple-50 text-purple-800'],
}

export default function FindingCard({ finding }) {
  const [label, style] = FINDING_STYLES[finding.finding_type] || ['Finding', 'border-border bg-surface-muted text-text-primary']
  return (
    <article className="rounded-lg border border-border bg-surface p-4" aria-labelledby={`finding-${finding.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`finding-${finding.id}`} className="font-semibold text-text-primary">{label}</h3>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>{finding.severity}</span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{finding.explanation}</p>
      {finding.suggested_correction && (
        <p className="mt-2 border-l-2 border-slate-300 pl-3 text-sm text-slate-600">
          <strong>Suggested correction:</strong> {finding.suggested_correction}
        </p>
      )}
    </article>
  )
}
