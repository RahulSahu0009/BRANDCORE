/**
 * BRANDCORE — App
 * Root component managing Clerk authentication, workspace resolution,
 * and page routing. No hardcoded workspace IDs.
 */
import React, { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/react';
import { api, onBackendStatusChange } from './services/api.js';
import { AppShell } from './components/layout/AppShell';
import { ThemeToggle } from './components/ui/theme/ThemeToggle';
import { Button } from './components/ui/Button';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import ApprovedFactsPage from './features/brand-governance/ApprovedFactsPage';
import EvidenceLibraryPage from './features/brand-governance/EvidenceLibraryPage';
import OverviewPage from './features/brand-governance/OverviewPage';
import ReleaseGovernancePage from './features/release-governance/ReleaseGovernancePage';
import ContentReviewPage from './features/content-review/ContentReviewPage';
import { WorkspaceOnboarding } from './components/WorkspaceOnboarding';

const NAV_GROUPS = [
  { label: null, items: [{ id: 'dashboard', label: 'Dashboard', icon: IcoDashboard, owner: 'Mritunjay' }] },
  { label: 'Brand Governance', items: [
    { id: 'facts',    label: 'Approved Facts', icon: IcoFacts,    owner: 'Arvind' },
    { id: 'evidence', label: 'Evidence',        icon: IcoEvidence, owner: 'Arvind' },
  ]},
  { label: 'Content',  items: [{ id: 'content',  label: 'Content Review',    icon: IcoContent,  owner: 'Rahul' }] },
  { label: 'Release',  items: [{ id: 'releases', label: 'Release Passports', icon: IcoReleases, owner: 'Arvind' }] },
  { label: 'System',   items: [{ id: 'settings', label: 'Settings',          icon: IcoSettings, owner: 'Mritunjay' }] },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const PAGES = [
  { id: 'overview', label: 'Overview', owner: 'Shared' },
  { id: 'facts', label: 'Approved Facts', owner: 'Arvind' },
  { id: 'content', label: 'Content Review', owner: 'Rahul' },
  { id: 'releases', label: 'Releases', owner: 'Arvind' },
  { id: 'evidence', label: 'Evidence Library', owner: 'Arvind' },
];

const PAGE_COMPONENTS = {
  overview: OverviewPage,
  facts: ApprovedFactsPage,
  content: ContentReviewPage,
  releases: ReleaseGovernancePage,
  evidence: EvidenceLibraryPage,
};

function AppWithAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();
  const { orgId, workspaceId, workspaceName } = useWorkspace();
  const [activePage, setActivePage] = useState('overview');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Periodic health checking — only when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setBackendStatus('checking');
      return;
    }
    let cancelled = false;
    let timer;
    async function checkHealth() {
      if (cancelled) return;
      try {
        await api.health();
        if (!cancelled) setBackendStatus('connected');
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401 || err.status === 403) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('offline');
        }
      }
    }
    checkHealth();
    timer = setInterval(checkHealth, 30000);
    const unsubscribe = onBackendStatusChange((status) => {
      if (status === 'connecting' && backendStatus !== 'offline') {
        setBackendStatus('checking');
      } else if (status === 'connected') {
        setBackendStatus('connected');
      } else if (status === 'offline') {
        setBackendStatus('offline');
      }
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      unsubscribe();
    };
  }, [isSignedIn, backendStatus]);

  if (!isLoaded) {
    return (
      <AppShell
        workspace={{ id: '', name: 'Loading…' }}
        backendStatus={backendStatus}
        header={{ activeItem: activePage, onNavChange: setActivePage }}
      >
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          Signing in…
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell
        workspace={{ id: '', name: 'Sign in' }}
        backendStatus={backendStatus}
        header={{ activeItem: activePage, onNavChange: setActivePage }}
      >
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <p className="mb-4 text-text-primary">Sign in to continue</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => clerk.openSignIn()}>Sign in</Button>
            <Button variant="ghost" onClick={() => clerk.openSignUp()}>Sign up</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!orgId) {
    return (
      <AppShell
        workspace={{ id: '', name: 'No organization' }}
        backendStatus={backendStatus}
        header={{ activeItem: activePage, onNavChange: setActivePage }}
      >
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <p className="mb-4 text-text-primary">No active organization</p>
          <p className="text-sm text-slate-500 mb-4">Please select an organization from the account menu to continue.</p>
        </div>
      </AppShell>
    );
  }

  if (!workspaceId) {
    return (
      <AppShell
        workspace={{ id: '', name: 'Workspace Setup' }}
        backendStatus={backendStatus}
        header={{ activeItem: activePage, onNavChange: setActivePage }}
      >
        <WorkspaceOnboarding orgId={orgId} />
      </AppShell>
    );
  }

  const PageComponent = PAGE_COMPONENTS[activePage];
  return (
    <AppShell
      workspace={{ id: workspaceId, name: workspaceName || 'Workspace' }}
      backendStatus={backendStatus}
      header={{ activeItem: activePage, onNavChange: setActivePage }}
    >
      {PageComponent ? <PageComponent /> : null}
    </AppShell>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AppWithAuth />
    </WorkspaceProvider>
  );
}
