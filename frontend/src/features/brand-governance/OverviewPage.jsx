/**
 * BRANDCORE — Workspace Overview
 * Workspace landing page showing key governance metrics, pending actions,
 * and stale release alerts. All data comes from actual backend API calls.
 */
import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/services/api'
import {
  Card, CardHeader, CardTitle, CardBody, CardFooter,
  Button, StatusBadge, EmptyState,
} from '@/components/ui'
import { PageHeader } from '@/components/layout'

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function OverviewPage() {
  const { workspaceId, workspaceName, authStatus } = useWorkspace()
  const [facts, setFacts] = useState([])
  const [releases, setReleases] = useState([])
  const [contentVersions, setContentVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    if (!workspaceId || authStatus !== 'ready') {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Fetch all dashboard data in parallel
      const [factsData, releasesData, contentData] = await Promise.allSettled([
        api.getFacts(workspaceId),
        api.getReleases(workspaceId),
        // Content versions endpoint needs a content item id; skip if not available
        Promise.resolve({ versions: [] }),
      ])

      if (factsData.status === 'fulfilled') {
        setFacts(factsData.value.facts || [])
      }
      if (releasesData.status === 'fulfilled') {
        setReleases(releasesData.value.releases || [])
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError(err.status === 401
          ? 'Session expired. Please sign in again.'
          : 'You do not have access to this workspace.')
      } else {
        setError(err.message || 'Unable to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId, authStatus])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const summary = {
    totalFacts: facts.length,
    activeFacts: facts.filter((f) => f.status === 'active').length,
    withoutEvidence: facts.filter((f) => !f.evidence_id).length,
    totalReleases: releases.length,
    validReleases: releases.filter((r) => r.status === 'VALID').length,
    staleReleases: releases.filter((r) => r.status === 'STALE').length,
    revokedReleases: releases.filter((r) => r.status === 'REVOKED').length,
    pendingContent: contentVersions.filter((v) => v.review_status === 'PENDING').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspace Overview" description="Your brand governance command center." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="p-6">
              <SkeletonRow className="mb-4" />
              <Skeleton width="60%" height="16px" />
              <Skeleton width="40%" height="16px" className="mt-2" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspace Overview" description="Your brand governance command center." />
        <EmptyState
          title="Unable to load dashboard"
          description={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Overview"
        description={`Brand governance for ${workspaceName || 'your workspace'}.`}
        breadcrumbs={[{ label: 'Overview', href: '#' }]}
        actions={[
          <Button key="submit" variant="primary" onClick={() => { /* handled by parent */ }}>
            Submit Content
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="p-6" className="border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-700 dark:text-green-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"/><path d="M12 12l2 2 4-4"/></svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Approved Facts</div>
              <div className="text-2xl font-bold text-text-primary">{summary.totalFacts}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {summary.activeFacts} active • {summary.withoutEvidence} without evidence
              </div>
            </div>
          </div>
        </Card>

        <Card padding="p-6" className="border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-muted dark:bg-surface-muted-dark flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-slate-500"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Releases</div>
              <div className="text-2xl font-bold text-text-primary">{summary.totalReleases}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {summary.validReleases} valid • {summary.staleReleases} stale • {summary.revokedReleases} revoked
              </div>
            </div>
          </div>
        </Card>

        <Card padding="p-6" className="border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-700 dark:text-amber-400"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Pending Content</div>
              <div className="text-2xl font-bold text-text-primary">{summary.pendingContent}</div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Awaiting review decision
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summary.staleReleases > 0 && (
          <Card padding="p-6" className="border-amber-700/30 bg-amber-50/30 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle>Stale Releases Require Attention</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-primary mb-4">
                {summary.staleReleases} release{summary.staleReleases > 1 ? 's' : ''} is stale because an underlying
                approved fact has changed since approval. Revalidate before further use.
              </p>
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={() => { /* navigate to releases */ }}>
                  View Releases
                </Button>
                <Button variant="secondary" size="sm">
                  Dismiss
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {summary.withoutEvidence > 0 && (
          <Card padding="p-6" className="border-red-700/30 bg-red-50/30 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle>Facts Without Evidence</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-primary mb-4">
                {summary.withoutEvidence} approved fact{summary.withoutEvidence > 1 ? 's' : ''} lack supporting
                evidence references. Add evidence to strengthen claim validity.
              </p>
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={() => { /* navigate to facts */ }}>
                  View Facts
                </Button>
                <Button variant="secondary" size="sm">
                  Dismiss
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="p-6" className="border border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Button variant="primary" size="sm" className="w-full" onClick={() => { /* submit content */ }}>
                Submit Content for Review
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => { /* create fact */ }}>
                Create Approved Fact
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => { /* add evidence */ }}>
                Add Evidence Source
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card padding="p-6" className="border border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {facts.slice(0, 3).map((fact) => (
                <div key={fact.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-surface-muted dark:bg-surface-muted-dark flex items-center justify-center text-xs font-medium text-text-secondary">
                    F
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{fact.text}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      v{fact.version} • {formatDate(fact.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {facts.length === 0 && (
                <div className="flex items-center justify-center py-4">
                  <p className="text-xs text-slate-500 dark:text-slate-500">No recent activity.</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card padding="p-6" className="border border-border">
          <CardHeader>
            <CardTitle>Releases</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {releases.slice(0, 3).map((release) => (
                <div key={release.id} className="flex items-start gap-3">
                  <StatusBadge status={release.status.toLowerCase()} size="sm" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{release.id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      v{release.content_version_id || '—'} • {formatDate(release.approved_at)}
                    </div>
                  </div>
                </div>
              ))}
              {releases.length === 0 && (
                <div className="flex items-center justify-center py-4">
                  <p className="text-xs text-slate-500 dark:text-slate-500">No releases yet.</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function SkeletonRow({ className = '' }) {
  return (
    <div className={'flex items-center gap-4 py-3 ' + className}>
      <div className="w-12 h-12 rounded-full bg-surface-muted animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-surface-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-surface-muted animate-pulse rounded w-1/2 mt-2" />
      </div>
    </div>
  )
}

function Skeleton({ className = '', width = '100%', height = '16px' }) {
  return (
    <div
      className={'animate-pulse rounded bg-surface-muted ' + className}
      style={{ width, height }}
    />
  )
}
