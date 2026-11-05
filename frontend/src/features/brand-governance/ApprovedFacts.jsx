import React, { useEffect, useState } from 'react'
import { mockGetFacts, mockCreateFact, mockUpdateFact, MOCK_EVIDENCE } from './__mocks__/facts.js'
import FactForm from './FactForm.jsx'
import EvidenceList from './EvidenceList.jsx'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function evidenceTitle(evidenceId) {
  const ev = MOCK_EVIDENCE.find((e) => e.id === evidenceId)
  return ev ? ev.title : evidenceId ?? '—'
}

function scopeLabel(scope) {
  if (!scope) return '—'
  const parts = [scope.product, scope.region].filter(Boolean)
  return parts.join(' · ') || '—'
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
    <div aria-busy="true" aria-label="Loading facts" className="flex flex-col gap-2">
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
      <p className="text-sm font-medium text-[#42556B]">No approved facts yet</p>
      <p className="text-xs text-[#718197] mt-1 mb-4">
        Add a fact to start governing brand claims.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 text-sm rounded text-white bg-[#147A72] hover:bg-[#0f6560] focus-visible:outline-2 focus-visible:outline-[#2563EB]"
      >
        Add fact
      </button>
    </div>
  )
}

// ── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'facts', label: 'Approved Facts' },
    { id: 'evidence', label: 'Evidence' },
  ]
  return (
    <div className="flex gap-0 border-b border-[#DCE3EA] mb-6" role="tablist" aria-label="Brand governance sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm border-b-2 -mb-px focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
            active === tab.id
              ? 'border-[#147A72] text-[#147A72] font-medium'
              : 'border-transparent text-[#42556B] hover:text-[#162638] hover:border-[#DCE3EA]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApprovedFacts() {
  const [activeTab, setActiveTab] = useState('facts')
  const [facts, setFacts] = useState([])
  const [loadState, setLoadState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingFact, setEditingFact] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  function load() {
    setLoadState('loading')
    setLoadError(null)
    mockGetFacts()
      .then(({ facts: data }) => {
        setFacts(data)
        setLoadState('ready')
      })
      .catch((err) => {
        setLoadError(err.message ?? 'Failed to load facts.')
        setLoadState('error')
      })
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditingFact(null)
    setSubmitError(null)
    setSuccessMessage(null)
    setFormOpen(true)
  }

  function openEdit(fact) {
    setEditingFact(fact)
    setSubmitError(null)
    setSuccessMessage(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingFact(null)
    setSubmitError(null)
  }

  function dismissSuccess() {
    setSuccessMessage(null)
  }

  async function handleSubmit(factData) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editingFact) {
        const updated = await mockUpdateFact({ ...editingFact, ...factData })
        setFacts((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
        setSuccessMessage('Fact updated. A new version has been recorded.')
      } else {
        const created = await mockCreateFact(factData)
        setFacts((prev) => [...prev, created])
        setSuccessMessage('Fact added successfully.')
      }
      setFormOpen(false)
      setEditingFact(null)
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to save fact. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-label="Brand Governance">
      <h1 className="text-xl font-bold text-[#162638] mb-4">Approved Facts</h1>
      <TabBar active={activeTab} onChange={setActiveTab} />

      <div
        id="tabpanel-evidence"
        role="tabpanel"
        aria-labelledby="tab-evidence"
        hidden={activeTab !== 'evidence'}
      >
        <EvidenceList facts={loadState === 'ready' ? facts : null} />
      </div>

      {activeTab === 'facts' && (
      <div
        id="tabpanel-facts"
        role="tabpanel"
        aria-labelledby="tab-facts"
      >
      <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-[#718197] mt-0.5">
            Lumora Skincare · Demo workspace
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 text-sm rounded text-white bg-[#147A72] hover:bg-[#0f6560] focus-visible:outline-2 focus-visible:outline-[#2563EB]"
        >
          Add fact
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
              onClick={dismissSuccess}
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

      {loadState === 'ready' && facts.length === 0 && (
        <EmptyState onAdd={openAdd} />
      )}

      {loadState === 'ready' && facts.length > 0 && (
        <div className="bg-white border border-[#DCE3EA] rounded overflow-hidden overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3EA] bg-[#F5F7FA]">
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B] w-[40%]">
                  Claim
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Qualifier
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Scope
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Evidence
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#42556B]">
                  Valid until
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
              {facts.map((fact, idx) => (
                <tr
                  key={fact.id}
                  className={`border-b border-[#DCE3EA] last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'
                  }`}
                >
                  <td className="px-4 py-3 text-[#162638] align-top">
                    <span className="block leading-snug">{fact.text}</span>
                    {(fact.numeric_value || fact.unit) && (
                      <span className="text-xs text-[#718197] mt-0.5 block">
                        {[fact.numeric_value, fact.unit].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#42556B] align-top">
                    {fact.qualifier ?? <span className="text-[#718197]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#42556B] align-top">
                    {scopeLabel(fact.scope)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className="text-[#42556B] text-xs leading-snug block max-w-[160px]"
                      title={evidenceTitle(fact.evidence_id)}
                    >
                      {evidenceTitle(fact.evidence_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#42556B] align-top whitespace-nowrap">
                    {formatDate(fact.scope?.valid_until)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={fact.status} />
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      onClick={() => openEdit(fact)}
                      aria-label={`Edit fact: ${fact.text.slice(0, 40)}`}
                      className="text-xs text-[#147A72] hover:underline focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[#DCE3EA] bg-[#F5F7FA]">
            <span className="text-xs text-[#718197]">
              {facts.length} {facts.length === 1 ? 'fact' : 'facts'}
            </span>
          </div>
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <FactForm
          fact={editingFact}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      )}
      </>
      </div>
      )}
    </section>
  )
}
