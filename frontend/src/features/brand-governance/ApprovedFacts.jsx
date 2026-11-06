import React, { useEffect, useState } from 'react'
import { mockGetFacts, mockCreateFact, mockUpdateFact, MOCK_EVIDENCE } from './__mocks__/facts.js'
import FactForm from './FactForm.jsx'
import EvidenceList from './EvidenceList.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function evidenceTitle(evidenceId) {
  const ev = MOCK_EVIDENCE.find((e) => e.id === evidenceId)
  return ev ? ev.title : evidenceId ?? '—'
}

function scopeLabel(scope) {
  if (!scope) return '—'
  return [scope.product, scope.region].filter(Boolean).join(' · ') || '—'
}

// ── Shared primitives ─────────────────────────────────────────────────────────

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

function Skeleton({ rows = 4 }) {
  return (
    <div className="border border-[#2e2e2e] rounded-lg overflow-hidden">
      <div className="h-9 bg-[#1a1a1a] border-b border-[#2e2e2e]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 border-b border-[#1f1f1f] bg-[#1c1c1c] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
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
      {onRetry && (
        <button onClick={onRetry} className="text-[11px] text-[#f66] underline underline-offset-2 shrink-0 hover:no-underline">Retry</button>
      )}
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
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className="text-[#3ecf8e] opacity-50 hover:opacity-100 text-xs transition-opacity">✕</button>
      )}
    </div>
  )
}

function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#2e2e2e] rounded-lg bg-[#1c1c1c]">
      <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#4a4a4a]" aria-hidden="true">
          <rect x="2" y="2" width="14" height="2" rx="1" fill="currentColor" opacity=".6"/>
          <rect x="2" y="7" width="10" height="2" rx="1" fill="currentColor" opacity=".4"/>
          <rect x="2" y="12" width="7" height="2" rx="1" fill="currentColor" opacity=".25"/>
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[#a1a1a1]">{title}</p>
      <p className="text-[12px] text-[#4a4a4a] mt-1 mb-5 text-center max-w-xs">{description}</p>
      {action && (
        <button onClick={onAction} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#2a9d6e] transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          {action}
        </button>
      )}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'facts',    label: 'Approved Facts' },
    { id: 'evidence', label: 'Evidence' },
  ]
  return (
    <div className="flex border-b border-[#2e2e2e]" role="tablist" aria-label="Brand governance sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          className={`
            px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors duration-100
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ecf8e]
            ${active === tab.id
              ? 'border-[#3ecf8e] text-[#3ecf8e]'
              : 'border-transparent text-[#6b6b6b] hover:text-[#a1a1a1]'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-[18px] font-semibold text-[#ededed] tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-[#4a4a4a] mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#2a9d6e] active:bg-[#1f7a55] transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          {action}
        </button>
      )}
    </div>
  )
}

// ── Facts table ───────────────────────────────────────────────────────────────

function FactsTable({ facts, onEdit }) {
  return (
    <div className="border border-[#2e2e2e] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#1a1a1a] border-b border-[#2e2e2e]">
              <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em] w-[35%]">Claim</th>
              <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Qualifier</th>
              <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Scope</th>
              <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Evidence</th>
              <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em] whitespace-nowrap">Valid until</th>
              <th scope="col" className="text-left px-4 py-2.5 text-[11px] font-medium text-[#6b6b6b] uppercase tracking-[0.07em]">Status</th>
              <th scope="col" className="px-4 py-2.5 w-14"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {facts.map((fact, i) => (
              <tr
                key={fact.id}
                className={`border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors duration-75 group ${i === facts.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="px-4 py-3 align-top">
                  <span className="block text-[#ededed] text-[13px] leading-snug">{fact.text}</span>
                  {(fact.numeric_value || fact.unit) && (
                    <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#6b6b6b] bg-[#262626] border border-[#2e2e2e]">
                      {[fact.numeric_value, fact.unit].filter(Boolean).join(' ')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {fact.qualifier
                    ? <span className="text-[12px] text-[#a1a1a1] px-1.5 py-0.5 rounded bg-[#262626] border border-[#2e2e2e]">{fact.qualifier}</span>
                    : <span className="text-[#3d3d3d]">—</span>}
                </td>
                <td className="px-4 py-3 align-top text-[#6b6b6b] text-[12px] whitespace-nowrap">{scopeLabel(fact.scope)}</td>
                <td className="px-4 py-3 align-top">
                  <span className="text-[#6b6b6b] text-[12px] block max-w-[150px] truncate" title={evidenceTitle(fact.evidence_id)}>
                    {evidenceTitle(fact.evidence_id)}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-[#6b6b6b] text-[12px] whitespace-nowrap">{formatDate(fact.scope?.valid_until)}</td>
                <td className="px-4 py-3 align-top"><StatusDot status={fact.status} /></td>
                <td className="px-4 py-3 align-top text-right">
                  <button
                    onClick={() => onEdit(fact)}
                    aria-label={`Edit fact: ${fact.text.slice(0, 40)}`}
                    className="text-[12px] text-[#6b6b6b] hover:text-[#3ecf8e] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 px-2 py-1 rounded hover:bg-[#1f2e27] transition-all duration-100"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#2e2e2e] flex items-center justify-between">
        <span className="text-[11px] text-[#4a4a4a]">{facts.length} {facts.length === 1 ? 'fact' : 'facts'}</span>
        <span className="text-[11px] text-[#3d3d3d]">Lumora Skincare · Demo workspace</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApprovedFacts({ initialTab = 'facts' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  useEffect(() => { setActiveTab(initialTab) }, [initialTab])

  const [facts, setFacts]               = useState(null)
  const [loadState, setLoadState]       = useState('loading')
  const [loadError, setLoadError]       = useState(null)
  const [formOpen, setFormOpen]         = useState(false)
  const [editingFact, setEditingFact]   = useState(null)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  function load() {
    setLoadState('loading')
    setLoadError(null)
    mockGetFacts()
      .then(({ facts: data }) => { setFacts(data ?? []); setLoadState('ready') })
      .catch((err) => { setLoadError(err.message ?? 'Failed to load facts.'); setLoadState('error') })
  }

  useEffect(() => { load() }, [])

  function openAdd()       { setEditingFact(null); setSubmitError(null); setSuccessMessage(null); setFormOpen(true) }
  function openEdit(fact)  { setEditingFact(fact); setSubmitError(null); setSuccessMessage(null); setFormOpen(true) }
  function closeForm()     { setFormOpen(false); setEditingFact(null); setSubmitError(null) }

  async function handleSubmit(factData) {
    setSubmitting(true); setSubmitError(null)
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
      setFormOpen(false); setEditingFact(null)
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to save fact.')
    } finally {
      setSubmitting(false)
    }
  }

  const pageTitle = activeTab === 'evidence' ? 'Evidence' : 'Approved Facts'

  return (
    <section aria-label="Brand Governance">
      <PageHeader
        title={pageTitle}
        subtitle="Lumora Skincare · Demo workspace"
        action={activeTab === 'facts' ? 'New fact' : undefined}
        onAction={openAdd}
      />

      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Facts panel */}
      <div id="tabpanel-facts" role="tabpanel" aria-labelledby="tab-facts" className={`pt-4 ${activeTab !== 'facts' ? 'hidden' : ''}`}>
        {submitError    && <div className="mb-3"><ErrorBanner message={submitError} /></div>}
        {successMessage && <div className="mb-3"><SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} /></div>}
        {loadState === 'loading' && <Skeleton rows={3} />}
        {loadState === 'error'   && <ErrorBanner message={loadError} onRetry={load} />}
        {loadState === 'ready'   && facts?.length === 0 && (
          <EmptyState title="No approved facts" description="Add a fact to start governing brand claims with evidence-backed statements." action="New fact" onAction={openAdd} />
        )}
        {loadState === 'ready' && facts?.length > 0 && <FactsTable facts={facts} onEdit={openEdit} />}
      </div>

      {/* Evidence panel */}
      <div id="tabpanel-evidence" role="tabpanel" aria-labelledby="tab-evidence" className={`pt-4 ${activeTab !== 'evidence' ? 'hidden' : ''}`}>
        <EvidenceList facts={loadState === 'ready' ? facts : null} />
      </div>

      {formOpen && <FactForm fact={editingFact} onSubmit={handleSubmit} onCancel={closeForm} submitting={submitting} />}
    </section>
  )
}
