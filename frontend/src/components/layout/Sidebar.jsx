/**
 * BRANDCORE — Sidebar Navigation
 * Collapsible sidebar with active state indicators and user section.
 */
import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'facts', label: 'Approved Facts', href: '/facts', icon: 'F' },
  { id: 'content', label: 'Content Review', href: '/content', icon: 'C' },
  { id: 'releases', label: 'Releases', href: '/releases', icon: 'R' },
]

export function Sidebar({ activeItem, onItemClick, isCollapsed = false }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside
      className={
        'fixed inset-y-0 left-0 z-20 w-64 bg-surface border-r border-border ' +
        (isCollapsed ? 'translate-x-0 transform transition-transform duration-200' : 'translate-x-0') +
        ' flex flex-col'
      }
      aria-label="Main navigation"
    >
      <div className="flex-1 overflow-y-auto">
        <nav className="px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.id
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ' +
                  (isActive
                    ? 'bg-teal-100 text-teal-700 border border-teal-700/20'
                    : 'text-slate-600 hover:bg-surface-muted hover:text-text-primary')
                }
              >
                <span
                  className={
                    'w-6 h-6 rounded flex items-center justify-center font-bold text-xs ' +
                    (isActive
                      ? 'bg-teal-700 text-white'
                      : 'bg-surface-muted text-slate-500 border border-border')
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border p-3 bg-surface/95 backdrop-blur backdrop-blur-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
        >
          <span>Settings</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isOpen && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:bg-surface-muted hover:text-text-primary rounded-md"
            >
              <span className="w-5 h-5 rounded bg-surface-muted flex items-center justify-center text-slate-500 text-xs">
                ?
              </span>
              Help & documentation
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:bg-surface-muted hover:text-text-primary rounded-md"
            >
              <span className="w-5 h-5 rounded bg-surface-muted flex items-center justify-center text-slate-500 text-xs">
                L
              </span>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
