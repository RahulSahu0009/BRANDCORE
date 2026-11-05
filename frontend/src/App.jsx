import React, { useEffect, useState } from 'react'
import { api, onBackendStatusChange } from './services/api.js'
import { AppShell } from './components/layout/AppShell'
import { ThemeToggle } from './components/ui/theme/ThemeToggle'
import { Button } from './components/ui/Button'
import ApprovedFactsPage from './features/brand-governance/ApprovedFactsPage'
import EvidenceLibraryPage from './features/brand-governance/EvidenceLibraryPage'
import ReleaseGovernancePage from './features/release-governance/ReleaseGovernancePage'
import ContentReviewPage from './features/content-review/ContentReviewPage'

const PAGES = [
  { id: 'facts', label: 'Approved Facts', owner: 'Arvind' },
  { id: 'content', label: 'Content Review', owner: 'Rahul' },
  { id: 'releases', label: 'Releases', owner: 'Arvind' },
  { id: 'evidence', label: 'Evidence Library', owner: 'Arvind' },
]

const PAGE_COMPONENTS = {
  facts: ApprovedFactsPage,
  content: ContentReviewPage,
  releases: ReleaseGovernancePage,
  evidence: EvidenceLibraryPage,
}

export default function App() {
  const [activePage, setActivePage] = useState('content')
  const [healthStatus, setHealthStatus] = useState('loading')
  const [backendStatus, setBackendStatus] = useState('connecting')

  useEffect(() => {
    api.health()
      .then(() => setHealthStatus('ok'))
      .catch(() => setHealthStatus('error'))
  }, [])

  useEffect(() => {
    const unsubscribe = onBackendStatusChange((status) => {
      setBackendStatus(status)
    })
    return unsubscribe
  }, [])

  const PageComponent = PAGE_COMPONENTS[activePage]

  return (
    <AppShell
      workspace={{ id: 'ws_demo', name: 'Demo Brand' }}
      backendStatus={backendStatus}
      header={{
        activeItem: activePage,
        onNavChange: setActivePage,
      }}
    >
      {PageComponent ? <PageComponent /> : null}
    </AppShell>
  )
}
