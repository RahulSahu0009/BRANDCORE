/**
 * BRANDCORE — Mobile Menu Toggle
 * Hamburger / close button for mobile sidebar.
 */
import { useState } from 'react'

const HAMBURGER_ICON = (
  <>
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </>
)

const CLOSE_ICON = (
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
)

export function MobileMenuToggle({ isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      className="
        fixed inset-y-0 left-0 z-30 w-14 flex items-center pl-3 pr-1 md:hidden
        text-slate-600 hover:text-text-primary hover:bg-surface/50
        focus:ring-focus focus:ring-2 rounded-r-md
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        {isOpen ? CLOSE_ICON : HAMBURGER_ICON}
      </svg>
    </button>
  )
}

/**
 * BRANDCORE — AppShell
 * Main application layout shell combining Sidebar, TopBar, and content area.
 */
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell({ workspace, backendStatus, children, header }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark flex flex-col">
      <TopBar workspace={workspace} backendStatus={backendStatus} />

      <div className="flex-1 relative">
        <MobileMenuToggle isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <Sidebar
          activeItem={header?.activeItem || 'content'}
          onItemClick={(id) => {
            setSidebarOpen(false)
            if (header?.onNavChange) {
              header.onNavChange(id)
            }
          }}
          isCollapsed={false}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
