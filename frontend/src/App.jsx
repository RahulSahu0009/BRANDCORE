import React, { useEffect, useState } from 'react'
import { api } from './services/api.js'
import ApprovedFacts from './features/brand-governance/ApprovedFacts.jsx'
import ReleasePassports from './features/release-governance/ReleasePassports.jsx'

const NAV_ITEMS = [
  { id: 'facts', label: 'Approved Facts', owner: 'Arvind' },
  { id: 'content', label: 'Content Review', owner: 'Rahul' },
  { id: 'releases', label: 'Releases', owner: 'Arvind' },
]

function StatusBadge({ status }) {
  const styles = {
    ok: 'bg-[#DDF5E7] text-[#137547]',
    error: 'bg-[#EEF2F6] text-[#5C6D80]',
    loading: 'bg-[#EEF2F6] text-[#5C6D80]',
  }
  const labels = { ok: 'API OK', error: 'Backend offline', loading: 'Checking…' }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
      title={status === 'error' ? 'Backend not running — frontend uses mock data' : undefined}
    >
      {labels[status]}
    </span>
  )
}

function Placeholder({ title, owner }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 bg-black text-white rounded-lg">
      <p className="font-medium text-lg">{title}</p>
      <p className="text-gray-400 text-sm mt-1">Owner: {owner} — not yet implemented</p>
    </div>
  )
}

export default function App() {
  const [activeNav, setActiveNav] = useState('content')
  const [healthStatus, setHealthStatus] = useState('loading')

  useEffect(() => {
    api.health()
      .then(() => setHealthStatus('ok'))
      .catch(() => setHealthStatus('error'))
  }, [])

  const active = NAV_ITEMS.find((n) => n.id === activeNav)

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans text-lg">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-green-600 flex items-center justify-center font-bold text-white">
            B
          </div>
          <span className="font-bold text-2xl tracking-wide">BRANDCORE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Demo Brand workspace</span>
          <StatusBadge status={healthStatus} />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-64 bg-black border-r border-gray-800 py-6 shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              aria-current={activeNav === item.id ? 'page' : undefined}
              className={`w-full text-left px-4 py-3 text-lg focus-visible:outline-2 focus-visible:outline-green-600 ${
                activeNav === item.id
                  ? 'bg-green-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto min-w-0">
          {activeNav === 'facts' && <ApprovedFacts />}
          {activeNav === 'releases' && <ReleasePassports />}
          {activeNav !== 'facts' && activeNav !== 'releases' && (
            <>
              <h1 className="text-3xl font-bold mb-6">{active.label}</h1>
              <Placeholder title={active.label} owner={active.owner} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
