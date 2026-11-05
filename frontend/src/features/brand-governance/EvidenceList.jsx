import React, { useEffect, useState } from 'react'
import { mockGetEvidence, mockCreateEvidence, mockUpdateEvidence, SOURCE_TYPE_LABELS } from './__mocks__/evidence.js'
import { MOCK_FACTS } from './__mocks__/facts.js'
import EvidenceForm from './EvidenceForm.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function usedByCount(evidenceId, facts) {
  return facts.filter((f) => f.evidence_id === evidenceId).length
}

function truncate(str, max) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    active:     { bg: 'bg-[#DDF5E7]', text: 'text-[#137547]', label: 'Active' },
    superseded: { bg: 'bg-[#EEF2F6]', text: 'text-[#42556B]', label: 'Superseded' },
    retracted:  { bg: 'bg-[#FEE4E2]', text: 'text-[#B42318]', label: 'Retracted' },
  }
  const s = map[status] ?? map.active
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading evidence records" className="flex flex-col gap-2">
      {[1, 2, 3].map((n) => (
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

function SuccessBanner({ message }) {
  return (
    <div role="status" className="flex items-center gap-3 px-4 py-3 rounded bg-[#DDF5E7] border border-[#137547]/20">
      <span className="text-[#137547] text-sm font-medium">✓</span>
      <span className="text-sm text-[#137547]">{message}</span>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#DCE3EA] rounded bg-white">
      <p className="text-sm font-medium text-[#42556B]">No evidence records yet</p>
      <p className="text-xs text-[#718197] mt-1 mb-4">
        Add an evidence record to support approved facts.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 text-sm rounded text-white bg-[#147A72] hover:bg-[#0f6560] focus-visible:outline-2 focus-visible:outline-[#2563EB]"
      >
        Add evidence
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EvidenceList({ facts }) {
  // facts prop passed from parent so used-by count stays in sync with live facts state
  const liveFacts = facts ?? MOCK_FACTS

  const [records, setRecords] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  function load() {
    setLoadState('loading')
    setLoadError(null)
    mockGetEvidence()
      .then(({ evidence }) => {
        setRecords(evidence)
        setLoadState('ready')
      })
      .catch((err) => {
        setLoadError(err.message ?? 'Failed to load evidence records.')
        setLoadState('error')
      })
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditingRecord(null)
    setSubmitError(null)
    setSuccessMessage(null)
    setFormOpen(true)
  }

  function openEdit(record) {
    setEditingRecord(record)
    setSubmitError(null)
    setSuccessMessage(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingRecord(null)
    setSubmitError(null)
  }

  async function handleSubmit(recordData) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editingRecord) {
        const updated = await mockUpdateEvidence({ ...editingRecord, ...recordData })
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        setSuccessMessage('Evidence record updated. A new version has been recorded.')
      } else {
        const created = await mockCreateEvidence(recordData)
        setRecords((prev) => [...prev, created])
        setSuccessMessage('Evidence record added successfully.')
      }
      setFormOpen(false)
      setEditingRecord(null)
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to save evidence record. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-label="Evidence Records">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-[#718197]">Lumora Skincare · Demo workspace</p>
        <button
          onClick={openAdd}
          className="px-4 py-2 text-sm rounded text-white bg-[#147A72] hover:bg-[#0f6560] focus-visible:outline-2 focus-visible:outline-[#2563EB]"
        >
          Add evidence
        </button>
      </div>

      {/* Feedback banners */}
      <div className="flex flex-col gap-3 mb-4">
        {submitError && <ErrorBanner message={submitError} />}
        {successMessage && (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SuccessBanner message={successMessage} />
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss success message"
              className="text-xs text-[#718197] shrink-0 focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Content states */}
      {loadState === 'loading' && <Skeleton />}

      {loadState === 'error' && (
        <ErrorBanner message={loadError} onRetry={load} />
      )}

      {loadState === 'ready' && records.length === 0 && (
        <EmptyState onAdd={openAdd} />
      )}

      {loadState === 'ready' && records.length > 0 && (
        <div className="bg-white border border-[#DCE3EA] rounded overflow-hidden overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3EA] bg-[#F5F7FA]">
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B] w-[28%]">
                  Title
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Source type
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B] w-[28%]">
                  Summary
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Used by
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Version
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
              {records.map((record, idx) => {
                const count = usedByCount(record.id, liveFacts)
                return (
                  <tr
                    key={record.id}
                    className={`border-b border-[#DCE3EA] last:border-0 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'
                    }`}
                  >
                    <td className="px-4 py-3 text-[#162638] align-top">
                      <span className="block leading-snug">{record.title}</span>
                      {record.source_url && (
                        <a
                          href={record.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Source URL for ${record.title}: ${record.source_url}`}
                          className="text-xs text-[#718197] mt-0.5 block truncate max-w-[200px] hover:underline focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
                        >
                          {record.source_url}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#42556B] align-top whitespace-nowrap">
                      {SOURCE_TYPE_LABELS[record.source_type] ?? record.source_type}
                    </td>
                    <td className="px-4 py-3 text-[#42556B] align-top">
                      <span title={record.summary}>
                        {truncate(record.summary, 80)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {count > 0 ? (
                        <span className="text-xs font-medium text-[#147A72]">
                          {count} {count === 1 ? 'fact' : 'facts'}
                        </span>
                      ) : (
                        <span className="text-xs text-[#718197]">Not linked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#42556B] align-top">
                      v{record.version}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        onClick={() => openEdit(record)}
                        aria-label={`Edit evidence: ${record.title.slice(0, 40)}`}
                        className="text-xs text-[#147A72] hover:underline focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[#DCE3EA] bg-[#F5F7FA]">
            <span className="text-xs text-[#718197]">
              {records.length} {records.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <EvidenceForm
          record={editingRecord}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      )}
    </section>
  )
}
