/**
 * BRANDCORE — Workspace Onboarding
 * Shown when a signed-in Clerk user has an active Organization but no
 * BRANDCORE workspace mapping.
 *
 * Organization admins can provision a new workspace.
 * Normal members are directed to ask an admin.
 */
import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/services/api'
import { Button, Card, CardBody, CardTitle, EmptyState } from '@/components/ui'

export function WorkspaceOnboarding({ orgId }) {
  const { orgRole } = useAuth()
  const { workspaceId, setWorkspaceId, setWorkspaceName: ctxSetWorkspaceName, setAuthStatus } = useWorkspace()
  const [provisioning, setProvisioning] = useState(false)
  const [localWorkspaceName, setLocalWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [error, setError] = useState(null)
  const [provisioned, setProvisioned] = useState(false)

  const isAdmin = orgRole === 'org:admin'

  const handleProvision = useCallback(async () => {
    if (!localWorkspaceName.trim()) {
      setError('Please enter a workspace name.')
      return
    }
    setProvisioning(true)
    setError(null)
    try {
      const result = await api.provisionWorkspace(localWorkspaceName.trim(), workspaceSlug.trim() || undefined)
      if (result.provisioned && result.id) {
        setWorkspaceId(result.id)
        ctxSetWorkspaceName(result.name || result.id)
        setAuthStatus('ready')
        setProvisioned(true)
      } else if (result.id) {
        // Already existed
        setWorkspaceId(result.id)
        ctxSetWorkspaceName(result.name || result.id)
        setAuthStatus('ready')
        setProvisioned(true)
      }
    } catch (err) {
      if (err.status === 403) {
        setError('You do not have permission to provision a workspace. Ask an organization administrator.')
      } else if (err.status === 401) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.message || 'Failed to provision workspace. Please try again.')
      }
    } finally {
      setProvisioning(false)
    }
  }, [localWorkspaceName, workspaceSlug, setWorkspaceId, ctxSetWorkspaceName, setAuthStatus])

  if (provisioned) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-8 h-8 text-green-700 dark:text-green-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Workspace ready</h3>
        <p className="text-text-secondary text-sm max-w-xs">
          Your BRANDCORE workspace is set up. You can now explore the application.
        </p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Continue to Workspace
        </Button>
      </div>
    )
  }

  const isMember = !isAdmin

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-8 h-8 text-amber-700 dark:text-amber-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" />
          <path d="M12 12m-3 0l3 3 3-3" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary">Workspace Setup</h3>
      <p className="text-text-secondary text-sm max-w-xs">
        Your Clerk organization is active, but it isn&rsquo;t mapped to a BRANDCORE workspace yet.
      </p>

      {isAdmin && (
        <Card className="w-full max-w-md">
          <CardBody className="p-6">
            <CardTitle>Create Workspace</CardTitle>
            <p className="text-xs text-text-secondary mb-6">
              Provide a name for your new workspace. This will be linked to your Clerk organization.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Workspace name
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-slate-400 focus:ring-2 focus:ring-focus focus:border-transparent transition-colors"
                  placeholder="e.g. Acme Corp Brand Governance"
                  value={localWorkspaceName}
                  onChange={(e) => setLocalWorkspaceName(e.target.value)}
                  disabled={provisioning}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Workspace slug (optional)
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-slate-400 focus:ring-2 focus:ring-focus focus:border-transparent transition-colors"
                  placeholder="e.g. acme-brand"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  disabled={provisioning}
                />
                <p className="text-xs text-slate-500 mt-1">
                  URL-friendly identifier for your workspace.
                </p>
              </div>
              {error && (
                <p className="text-xs text-red-700 dark:text-red-400 mt-3">{error}</p>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleProvision}
                  disabled={provisioning || !localWorkspaceName.trim()}
                >
                  {provisioning ? 'Creating…' : 'Create Workspace'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {isMember && (
        <div className="max-w-md">
          <p className="text-text-secondary text-sm mb-6">
            You&rsquo;re a member of this organization, but not an administrator.
            Only an organization admin can create a BRANDCORE workspace.
          </p>
          <p className="text-text-secondary text-xs mb-6">
            Please ask your organization administrator to set up the workspace,
            then refresh this page.
          </p>
        </div>
      )}
    </div>
  )
}
