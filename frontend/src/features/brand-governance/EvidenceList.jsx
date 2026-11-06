import React, { useEffect, useState } from 'react'
import { mockGetEvidence, mockCreateEvidence, mockUpdateEvidence, SOURCE_TYPE_LABELS } from './__mocks__/evidence.js'
import { MOCK_FACTS } from './__mocks__/facts.js'
import EvidenceForm from './EvidenceForm.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────

function usedByCount(evidenceId, facts) {
  return facts.filter((f) => f.evidence_id === evidenceId).length
}

function truncate(str, max) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ── Primitives ────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const map = {
    active:     { dot: 'bg-[#3ecf8e]', text: 'text-[#3ecf8e]', bg: 'bg-[rgba(62,207,142,0.1)]',   border: 'border-[rgba(62,207,142,0.2)]',   label: 'Active' },
    superseded: { dot: 'bg-[#6b6b6b]', text: 'text-[#6b6b6b]', bg: 'bg-[rgba(107,107,107,0.1)]', border: 'border-[rgba(107,107,107,0.2)]', label: 'Superseded' },
    retracted:  { dot: 'bg-[#f66]',    text: 'text-[#f66]',    bg: 'bg-[rgba(255,102,102,0.1)]',  border: 'border-[rgba(255,102,102,0.2)]',  label: 'Retracted' },
  }
  const s = map[status] ?? map.active
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  )
}

const SOURCE_TYPE_STYLES = {
  internal_study:      'bg-[rgba(59,130,246,0.1)] text-[#60a5fa] border-[rgba(59,130,246,0.2)]',
  third_party_report:  'bg-[rgba(139,92,246,0.1)] text-[#a78bfa] border-[rgba(139,92,246,0.2)]',
  regulatory_filing:   'bg-[rgba(245,158,11,0.1)] text-[#fbbf24] border-[rgba(245,158,11,0.2)]',
  peer_reviewed_paper: 'bg-[rgba(62,207,142,0.1)] text-[#3ecf8e] border-[rgba(62,207,142,0.2)]',
  other:               'bg-[rgba(107,107,107,0.1)] text-[#6b6b6b] border-[rgba(107,107,107,0.2)]',
}

function SourceChip({ sourceType }) {
  const label = SOURCE_TYPE_LABELS[sourceType] ?? sourceType
  const cls   = SOURCE_TYPE_STYLES[sourceType] ?? SOURCE_TYPE_STYLES.other
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="border border-[#2e2e2e] rounded-lg overflow-hidden">
      <div className="h-9 bg-[#1a1a1a] border-b border-[#2e2e2e]" />
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-11 border-b border-[#1f1f1f] bg-[#1c1c1c] animate-pulse" style={{ animationDelay: `${(n-1)*60}ms` }} />
      ))}
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[rgba(255,102,102,0.08)] border border-[rgba(255,102,102,0.2)]">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#f66] shrink-0 mt-0.5" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 4.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="9.5" r="0.7" fill="currentColor"/>
      </svg>
      <span className="text-[12px] text-[#f66] flex-1">{message}</span>
      {onRetry && <button onClick={onRetry} className="text-[11px] text-[#f66] underline underline-offset-2 shrink-0 hover:no-underline">Retry</button>}
    </div>
  )
}

function SuccessBanner({ message, onDismiss }) {
  return (
    <div role="status" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[rgba(62,207,142,0.08)] border border-[rgba(62,207,142,0.2)]">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#3ecf8e] shrink-0" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4.5 7l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[12px] text-[#3ecf8e] flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss" className="text-[#3ecf8e] opacity-50 hover:opacity-100 text-xs transition-opacity">✕</button>}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#2e2e2e] rounded-lg bg-[#1c1c1c]">
      <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#4a4a4a]" aria-hidden="true">
          <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M11 2v4h4" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[#a1a1a1]">No evidence records</p>
      <p className="text-[12px] text-[#4a4a4a] mt-1 mb-5 text-center max-w-xs">Add evidence to back approved facts with verifiable sources.</p>
      <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#2a9d6e] transition-colors">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        Add evidence
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EvidenceList({ facts }) {
  const liveFacts = facts ?? MOCK_FACTS

  const [records, setRecords]               = useState([])
  const [loadState, setLoadState]           = useState('loading')
  const [loadError, setLoadError]           = useState(null)
  const [formOpen, setFormOpen]             = useState(false)
  const [editingRecord, setEditingRecord]   = useState(null)
  const [submitting, setSubmitting]         = useState(false)
  const [submitError, setSubmitError]       = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  function load() {
    setLoadState('loading'); setLoadError(null)
    mockGetEvidence()
      .then(({ evidence }) => { setRecords(evidence); setLoadState('ready') })
      .catch((err) => { setLoadError(err.message ?? 'Failed to load evidence.'); setLoadState('error') })
  }

  useEffect(() => { load() }, [])

  function openAdd()        { setEditingRecord(null); setSubmitError(null); setSuccessMessage(null); setFormOpen(true) }
  function openEdit(record) { setEditingRecord(record); setSubmitError(null); setSuccessMessage(null); setFormOpen(true) }
  function closeForm()      { setFormOpen(false); setEditingRecord(null); setSubmitError(null) }

  async function handleSubmit(recordData) {
    setSubmitting(true); setSubmitError(null)
    try {
      if (editingRecord) {
        const updated = await mockUpdateEvidence({ ...editingRecord, ...recordData })
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        setSuccessMessage('Evidence updated. A new version has been recorded.')
      } else {
        const created = await mockCreateEvidence(recordData)
        setRecords((prev) => [...prev, created])
        setSuccessMessage('Evidence added successfully.')
      }
      setFormOpen(false); setEditingRecord(null)
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to save evidence.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-label="Evidence Records">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#2a9d6e] active:bg-[#1f7a55] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          New evidence
        </button>
      </div>

      {submitError    && <div className="mb-3"><ErrorBanner message={submitError} /></div>}
      {successMessage && <div className="mb-3"><SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} /></div>}

      {loadState === 'loading' && <Skeleton />}
      {loadState === 'error'   && <ErrorBanner message={loadError} onRetry={load} />}
      {loadState === 'ready'   && records.length === 0 && <EmptyState onAdd={openAdd} />}

      {loadState === 'ready' && records.length > 0 && (
        <div className="border border-[#2e2e2e] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-[#2e2e2e]">
                  <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em] w-[26%]">Title</th>
                  <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Source type</th>
                  <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em] w-[28%]">Summary</th>
                  <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Used by</th>
                  <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Ver.</th>
                  <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Status</th>
                  <th scope="col" className="px-4 py-2.5 w-14"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, i) => {
                  const count = usedByCount(record.id, liveFacts)
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors duration-75 group ${i === records.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-4 py-3 align-top">
                        <span className="block text-[#ededed] text-[13px] leading-snug">{record.title}</span>
                        {record.source_url && (
                          <a
                            href={record.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Source URL for ${record.title}`}
                            className="text-[11px] text-[#4a4a4a] mt-0.5 block truncate max-w-[180px] hover:text-[#3ecf8e] transition-colors"
                          >
                            {record.source_url}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <SourceChip sourceType={record.source_type} />
                      </td>
                      <td className="px-4 py-3 align-top text-[#6b6b6b] text-[12px]">
                        <span title={record.summary}>{truncate(record.summary, 80)}</span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3ecf8e] bg-[rgba(62,207,142,0.1)] px-2 py-0.5 rounded border border-[rgba(62,207,142,0.2)]">
                            {count} {count === 1 ? 'fact' : 'facts'}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#3d3d3d]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-[11px] font-mono text-[#4a4a4a] bg-[#262626] px-1.5 py-0.5 rounded border border-[#2e2e2e]">v{record.version}</span>
                      </td>
                      <td className="px-4 py-3 align-top"><StatusDot status={record.status} /></td>
                      <td className="px-4 py-3 align-top text-right">
                        <button
                          onClick={() => openEdit(record)}
                          aria-label={`Edit evidence: ${record.title.slice(0, 40)}`}
                          className="text-[12px] text-[#6b6b6b] hover:text-[#3ecf8e] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 px-2 py-1 rounded hover:bg-[#1f2e27] transition-all duration-100"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#2e2e2e] flex items-center justify-between">
            <span className="text-[11px] text-[#4a4a4a]">{records.length} {records.length === 1 ? 'record' : 'records'}</span>
            <span className="text-[11px] text-[#3d3d3d]">Lumora Skincare · Demo workspace</span>
          </div>
        </div>
      )}

      {formOpen && <EvidenceForm record={editingRecord} onSubmit={handleSubmit} onCancel={closeForm} submitting={submitting} />}
    </section>
  )
}
