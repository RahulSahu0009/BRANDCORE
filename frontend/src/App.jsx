import React, { useEffect, useState } from 'react'
import { api } from './services/api.js'
import ApprovedFacts from './features/brand-governance/ApprovedFacts.jsx'
import ReleasePassports from './features/release-governance/ReleasePassports.jsx'

function Ico({ d, size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {d ? <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : children}
    </svg>
  )
}

const IcoDashboard = () => <Ico><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/></Ico>
const IcoFacts    = () => <Ico d="M2.5 4h11M2.5 7.5h8M2.5 11h5.5" />
const IcoEvidence = () => <Ico><path d="M9.5 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 2z" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 2v3.5H13" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 8.5h5M5.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Ico>
const IcoContent  = () => <Ico><rect x="2" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Ico>
const IcoReleases = () => <Ico><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5.5V8.2l2 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></Ico>
const IcoSettings = () => <Ico><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></Ico>
const IcoMenu     = () => <Ico d="M2 4.5h12M2 8h12M2 11.5h12" />
const IcoChevron  = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3.5 2.5L6 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>

function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="#3ecf8e"/>
      <path d="M7 20V8h6a4 4 0 010 8H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 16h2.5a2.5 2.5 0 000-5H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const NAV_GROUPS = [
  { label: null, items: [{ id: 'dashboard', label: 'Dashboard', icon: IcoDashboard, owner: 'Mritunjay' }] },
  { label: 'Brand Governance', items: [
    { id: 'facts',    label: 'Approved Facts', icon: IcoFacts,    owner: 'Arvind' },
    { id: 'evidence', label: 'Evidence',        icon: IcoEvidence, owner: 'Arvind' },
  ]},
  { label: 'Content',  items: [{ id: 'content',  label: 'Content Review',    icon: IcoContent,  owner: 'Rahul'     }] },
  { label: 'Release',  items: [{ id: 'releases', label: 'Release Passports', icon: IcoReleases, owner: 'Arvind'    }] },
  { label: 'System',   items: [{ id: 'settings', label: 'Settings',          icon: IcoSettings, owner: 'Mritunjay' }] },
]

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

function ApiStatus({ status }) {
  if (status === 'ok') return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-50" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3ecf8e]" />
      </span>
      <span className="text-[11px] text-[#3ecf8e] font-medium">Connected</span>
    </div>
  )
  if (status === 'loading') return (
    <div className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-[#888] animate-pulse" />
      <span className="text-[11px] text-[#888]">Connecting…</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5" title="Backend not running — using mock data">
      <span className="h-1.5 w-1.5 rounded-full bg-[#555]" />
      <span className="text-[11px] text-[#888]">Offline</span>
    </div>
  )
}

function Placeholder({ title, owner }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#2e2e2e] rounded-lg bg-[#1c1c1c]">
      <div className="w-9 h-9 rounded-lg bg-[#262626] flex items-center justify-center mb-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="#555" strokeWidth="1.3" strokeDasharray="2.5 2"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-[#888] mt-1">Assigned to {owner} · Not yet implemented</p>
    </div>
  )
}

function Sidebar({ active, onNav, collapsed }) {
  return (
    <nav
      className={`${collapsed ? 'w-[52px]' : 'w-[220px]'} bg-[#111111] border-r border-[#1f1f1f] flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden`}
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-2.5 h-[52px] border-b border-[#1f1f1f] shrink-0 px-3.5">
        <BrandMark size={26} />
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="text-[13px] font-semibold text-white leading-none tracking-tight truncate">BRANDCORE</p>
            <p className="text-[11px] text-[#888] mt-0.5 leading-none truncate">Lumora Skincare</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {!collapsed && group.label && (
              <p className="px-3.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#666] select-none">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-2.5 text-left transition-colors duration-100
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ecf8e] focus-visible:ring-inset
                    ${collapsed ? 'justify-center py-2.5 px-0' : 'px-3 py-1.5 mx-1 rounded-md w-[calc(100%-8px)]'}
                    ${isActive ? 'bg-[#1f2e27] text-[#3ecf8e]' : 'text-[#bbb] hover:text-white hover:bg-[#1a1a1a]'}
                  `}
                >
                  <span className={`shrink-0 ${isActive ? 'text-[#3ecf8e]' : ''}`}><Icon /></span>
                  {!collapsed && (
                    <span className={`text-[13px] truncate ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className={`border-t border-[#1f1f1f] ${collapsed ? 'py-2.5 flex justify-center' : 'px-3.5 py-3'}`}>
        {collapsed ? (
          <div className="w-6 h-6 rounded-full bg-[#3ecf8e] flex items-center justify-center text-[#0f0f0f] text-[10px] font-bold">A</div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#3ecf8e] flex items-center justify-center text-[#0f0f0f] text-[10px] font-bold shrink-0">A</div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white truncate leading-none">Arvind Shah</p>
              <p className="text-[11px] text-[#888] mt-0.5 leading-none">Brand Ops Lead</p>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  const [activeNav, setActiveNav]               = useState('facts')
  const [healthStatus, setHealthStatus]         = useState('loading')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    api.health().then(() => setHealthStatus('ok')).catch(() => setHealthStatus('error'))
  }, [])

  const activeItem = ALL_ITEMS.find((n) => n.id === activeNav)

  function renderMain() {
    if (activeNav === 'facts')    return <ApprovedFacts initialTab="facts" />
    if (activeNav === 'evidence') return <ApprovedFacts initialTab="evidence" />
    if (activeNav === 'releases') return <ReleasePassports />
    return <Placeholder title={activeItem.label} owner={activeItem.owner} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      <header className="h-[52px] bg-[#111111] border-b border-[#1f1f1f] flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 flex items-center justify-center rounded text-[#888] hover:text-white hover:bg-[#1f1f1f] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ecf8e]"
          >
            <IcoMenu />
          </button>
          <div className="w-px h-4 bg-[#2e2e2e]" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px]">
            <span className="text-[#888]">Lumora Skincare</span>
            <IcoChevron />
            <span className="text-white font-medium">{activeItem?.label ?? 'Dashboard'}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatus status={healthStatus} />
          <div className="w-px h-4 bg-[#2e2e2e]" />
          <div className="w-6 h-6 rounded-full bg-[#3ecf8e] flex items-center justify-center text-[#0f0f0f] text-[10px] font-bold">A</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeNav} onNav={setActiveNav} collapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#0f0f0f]">
          <div className="max-w-[1100px] mx-auto px-6 py-6">
            {renderMain()}
          </div>
        </main>
      </div>
    </div>
  )
}
