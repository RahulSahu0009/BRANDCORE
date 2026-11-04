import React, { useEffect, useState } from 'react'
import { api } from './services/api.js'

const NAV_ITEMS = [
  { id: 'facts', label: 'Approved Facts', owner: 'Arvind' },
  { id: 'content', label: 'Content Review', owner: 'Rahul' },
  { id: 'releases', label: 'Releases', owner: 'Arvind' },
]

function StatusBadge({ status }) {
  const styles = {
    ok: 'bg-[#DDF5E7] text-[#137547]',
    error: 'bg-[#FEE4E2] text-[#B42318]',
    loading: 'bg-[#EEF2F6] text-[#5C6D80]',
  }
  const labels = { ok: 'API OK', error: 'API Error', loading: 'Checking…' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function Placeholder({ title, owner }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#DCE3EA] rounded-lg bg-white">
      <p className="text-[#42556B] font-medium">{title}</p>
      <p className="text-[#718197] text-xs mt-1">Owner: {owner} — not yet implemented</p>
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
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      {/* Top nav */}
      <header className="bg-[#142235] text-white px-6 py-3 flex items-center justify-between">
        <span className="font-semibold tracking-wide">BRANDCORE</span>
        <div className="flex items-center gap-3">
          <span className="text-[#718197] text-xs">Demo Brand workspace</span>
          <StatusBadge status={healthStatus} />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-56 bg-white border-r border-[#DCE3EA] py-4 shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full text-left px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                activeNav === item.id
                  ? 'bg-[#DDF3EF] text-[#147A72] font-medium'
                  : 'text-[#42556B] hover:bg-[#EEF2F6]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          <h1 className="text-xl font-bold text-[#162638] mb-4">{active.label}</h1>
          <Placeholder title={active.label} owner={active.owner} />
        </main>
      </div>
    </div>
  )
}
