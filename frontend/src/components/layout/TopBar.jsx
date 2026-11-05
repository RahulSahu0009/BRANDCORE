/**
 * BRANDCORE — Top Bar
 * Application header with brand, workspace context, backend status, theme toggle, and user menu.
 */
import { Show, UserButton, OrganizationSwitcher, useAuth } from '@clerk/react'
import { ThemeToggle } from '../ui/theme/ThemeToggle'
import { Button } from '../ui/Button'

export function TopBar({ workspace, backendStatus, onWorkspaceChange }) {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <header
      className="sticky top-0 z-10 bg-surface/80 backdrop-blur backdrop-blur-md border-b border-border"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-teal-700 flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="font-bold text-lg text-navy-950 dark:text-navy-dark tracking-tight">
              BRANDCORE
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted border border-border text-xs font-medium text-slate-600 dark:text-slate-dark">
            <span className="w-2 h-2 rounded-full bg-green-700" />
            Workspace: {workspace?.name || 'Demo Brand'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium">
            <span className="w-2 h-2 rounded-full">
              {backendStatus === 'connected' ? (
                <span className="bg-green-700" />
              ) : backendStatus === 'connecting' ? (
                <span className="bg-amber-700 animate-pulse" />
              ) : (
                <span className="bg-red-700" />
              )}
            </span>
            <span className="text-text-secondary">
              {backendStatus === 'connected' ? 'Backend connected' : backendStatus === 'connecting' ? 'Connecting…' : 'Backend offline'}
            </span>
          </div>

          <ThemeToggle />

          {isLoaded && isSignedIn ? (
            <>
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    organizationSwitcherTrigger: 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted focus:ring-focus focus:ring-2 rounded-md px-2 py-1',
                  },
                }}
              />
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonTrigger: 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted focus:ring-focus focus:ring-2 rounded-md px-2 py-1',
                    userButtonMenu: 'bg-surface border border-border shadow-lg',
                    userButtonMenuItem: 'text-text-secondary hover:text-teal-700 hover:bg-teal-100/10',
                    userButtonMenuButton: 'text-text-secondary hover:text-teal-700',
                  },
                }}
              />
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">Sign in</Button>
              <Button variant="primary" size="sm">Sign up</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
