/**
 * BRANDCORE — Content Review Page
 * Content submission, analysis findings display, and review decision workflow.
 * Distinguishes AI-extracted claims from deterministic verification results.
 *
 * Demo mode: When backend endpoints are unavailable, displays clearly labeled
 * demo fixtures. No data is faked as live backend data.
 */
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import {
  Card, CardHeader, CardTitle, CardBody, CardFooter,
  Button, StatusBadge, EmptyState, ErrorState, Skeleton, SkeletonRow,
  FormField, FormInput, FormTextarea,
} from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { DEMO_CONTENT_VERSIONS, DEMO_FINDINGS, DEMO_WORKSPACE } from '../brand-governance/__mocks__/demo-data'

const WORKSPACE_ID = 'ws_demo'

const FINDING_TYPE_CONFIG = {
  UNSUPPORTED_CLAIM: { label: 'Unsupported claim', color: 'red', severity: 'critical' },
  NUMERIC_MISMATCH: { label: 'Numeric mismatch', color: 'red', severity: 'critical' },
  CLAIM_STRONGER_THAN_EVIDENCE: { label: 'Claim stronger than evidence', color: 'amber', severity: 'high' },
  MISSING_QUALIFIER: { label: 'Missing qualifier', color: 'amber', severity: 'medium' },
  SCOPE_MISMATCH: { label: 'Scope mismatch', color: 'amber', severity: 'medium' },
  EXPIRED_OFFER: { label: 'Expired offer', color: 'red', severity: 'high' },
  UNAPPROVED_TERMINOLOGY: { label: 'Unapproved terminology', color: 'amber', severity: 'medium' },
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function ContentReviewPage() {
  const [contentVersions, setContentVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ title: '', body_text: '' })

  const fetchContentVersions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getContentVersions(WORKSPACE_ID, 'ci_demo')
      setContentVersions(data.versions || [])
      setDemoMode(false)
    } catch (err) {
      setDemoMode(true)
      setContentVersions(DEMO_CONTENT_VERSIONS)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContentVersions()
  }, [fetchContentVersions])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await api.submitContent(WORKSPACE_ID, {
        title: formData.title,
        body_text: formData.body_text,
      })
      setContentVersions([{
        id: result.content_version_id,
        version_number: 1,
        sha256_hash: result.sha256_hash,
        created_at: result.created_at,
        review_status: 'PENDING',
        title: formData.title,
      }, ...contentVersions])
      setFormData({ title: '', body_text: '' })
    } catch (err) {
      setDemoMode(true)
      // In demo mode, simulate a successful submission with mock data
      const mockId = 'cv_demo_' + Date.now()
      setContentVersions([{
        id: mockId,
        version_number: contentVersions.length + 1,
        sha256_hash: 'mock_' + mockId,
        created_at: new Date().toISOString(),
        review_status: 'PENDING',
        title: formData.title,
      }, ...contentVersions])
      setFormData({ title: '', body_text: '' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnalyze = (versionId) => {
    // Analysis endpoint is implemented (M3-05)
    // In demo mode, show demo findings
    setDemoMode(true)
    setSelectedVersion({
      id: versionId,
      findings: DEMO_FINDINGS,
    })
  }

  const handleReviewDecision = (decision) => {
    // Review decision endpoint not yet implemented
    setDemoMode(true)
    setSelectedVersion(null)
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Content Review" description="Submit content, review AI-extracted claims, and record review decisions." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="p-4">
              <SkeletonRow className="mb-4" />
              <Skeleton width="60%" height="16px" />
              <Skeleton width="40%" height="16px" className="mt-2" />
            </Card>
          ))}
        </div>
        <div className="h-80">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Review"
        description="Submit content for review, examine AI-extracted claims and verification findings, and record review decisions."
        breadcrumbs={[{ label: 'Content Review', href: '#' }]}
        actions={[
          <Button key="submit" variant="primary" onClick={() => setSelectedVersion('submit')}>
            Submit Content
          </Button>,
        ]}
      />

      {demoMode && (
        <Card padding="p-4" className="border-amber-700/20 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-amber-700 flex items-center justify-center text-white text-xs">
              !
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">Demo mode — content endpoints not yet implemented</p>
              <p className="text-xs text-amber-600 mt-1">
                Displaying fictional demo data. Analysis results are simulated.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!demoMode && error && (
        <ErrorState message="Unable to load content versions" onRetry={fetchContentVersions} />
      )}

      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Submission Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Submit Content</CardTitle>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    label="Title"
                    required
                    helperText="Content item title (max 200 characters)"
                  >
                    <FormInput
                      id="content-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </FormField>
                  <FormField
                    label="Body text"
                    required
                    helperText="Content body for claim extraction and analysis (max 10000 characters)"
                  >
                    <FormTextarea
                      id="content-body"
                      rows={8}
                      value={formData.body_text}
                      onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                    />
                  </FormField>
                  <CardFooter className="pt-0">
                    <Button variant="primary" disabled={submitting} type="submit">
                      {submitting ? 'Submitting…' : 'Submit for Analysis'}
                    </Button>
                  </CardFooter>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Content Versions List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Versions</CardTitle>
              </CardHeader>
              <CardBody>
                {contentVersions.length === 0 ? (
                  <EmptyState
                    title="No content submitted"
                    description="Submit your first content item to begin the review workflow."
                    action="Submit Content"
                    onAction={() => setSelectedVersion('submit')}
                  />
                ) : (
                  <div className="space-y-3">
                    {contentVersions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-colors cursor-pointer"
                        onClick={() => {
                          if (version.review_status === 'PENDING') {
                            handleAnalyze(version.id)
                          } else {
                            setSelectedVersion(version)
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-text-primary">{version.title}</span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              version.review_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              version.review_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-surface-muted text-slate-500'
                            }`}>
                              {version.review_status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            v{version.version_number} • {formatDate(version.created_at)}
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center text-slate-500 text-xs">
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {selectedVersion === 'submit' && (
        <ContentSubmissionDialog
          onSubmit={handleSubmit}
          onClose={() => setSelectedVersion(null)}
          submitting={submitting}
          formData={formData}
          onFormChange={setFormData}
        />
      )}

      {selectedVersion && selectedVersion !== 'submit' && (
        <AnalysisResultsDialog
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
          onReviewDecision={handleReviewDecision}
          demoMode={demoMode}
        />
      )}
    </div>
  )
}

/**
 * Content Submission Dialog — Form for submitting new content items.
 */
function ContentSubmissionDialog({ onSubmit, onClose, submitting, formData, onFormChange }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Submit content"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-lg shadow-lg w-full max-w-xl p-6 mx-4 animate-slide-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-text-primary">Submit Content</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </Button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Title" required>
              <FormInput
                id="dialog-content-title"
                value={formData.title}
                onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Body text" required helperText="Content for AI claim extraction and verification">
            <FormTextarea
              id="dialog-content-body"
              rows={6}
              value={formData.body_text}
              onChange={(e) => onFormChange({ ...formData, body_text: e.target.value })}
            />
          </FormField>
          <CardFooter className="justify-end pt-0 mt-6 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Submitting…' : 'Submit for Analysis'}
            </Button>
          </CardFooter>
        </form>
      </div>
    </div>
  )
}

/**
 * Analysis Results Dialog — Shows extracted claims, verification findings,
 * severity presentation, and review decision UI.
 */
function AnalysisResultsDialog({ version, onClose, onReviewDecision, demoMode }) {
  const [reviewDecision, setReviewDecision] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const findings = version.findings || []
  const criticalCount = findings.filter((f) => f.severity === 'critical').length
  const highCount = findings.filter((f) => f.severity === 'high').length

  const handleDecision = (decision) => {
    setReviewDecision(decision)
    onReviewDecision(decision)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Analysis results"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-lg shadow-2xl w-full max-w-3xl p-6 mx-4 md:mx-0 animate-slide-in">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Analysis Results</h2>
            <p className="text-text-secondary text-sm mt-1">
              Content version: <span className="font-mono text-text-primary">{version.id}</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Findings Summary */}
          <Card className="border-t-2 border-red-700/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${
                  criticalCount > 0 ? 'bg-red-700' : highCount > 0 ? 'bg-amber-700' : 'bg-green-700'
                } flex items-center justify-center text-white text-xs`}>
                  {criticalCount + highCount > 0 ? '!' : '✓'}
                </span>
                <CardTitle className={criticalCount > 0 ? 'text-red-700' : 'text-green-700'}>
                  {criticalCount > 0 ? `${criticalCount} critical finding${criticalCount > 1 ? 's' : ''}` : 'No critical findings'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total findings</p>
                  <p className="text-xl font-bold text-text-primary">{findings.length}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical</p>
                  <p className="text-xl font-bold text-red-700">{criticalCount}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High</p>
                  <p className="text-xl font-bold text-amber-700">{highCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Findings List */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Findings</CardTitle>
            </CardHeader>
            <CardBody>
              {findings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-text-secondary text-sm">No findings detected. All claims verified against approved facts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {findings
                    .slice()
                    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
                    .map((finding) => {
                      const config = FINDING_TYPE_CONFIG[finding.finding_type] || { label: finding.finding_type, color: 'slate', severity: 'medium' }
                      return (
                        <Card key={finding.id} padding="p-4" className="border-l-4 border-l-transparent">
                          <div className="flex items-start gap-3">
                            <StatusBadge
                              status={finding.severity === 'critical' ? 'invalid' : finding.severity === 'high' ? 'stale' : 'pending'}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-text-primary truncate">{config.label}</span>
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  config.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                  config.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                                  'bg-surface-muted text-slate-500'
                                }`}>
                                  {config.severity}
                                </span>
                              </div>
                              <p className="text-sm text-text-primary mb-1">{finding.reason}</p>
                              {finding.suggestion && (
                                <div className="bg-green-50 rounded p-2 text-xs text-green-700 border border-green-100">
                                  <span className="font-semibold text-xs uppercase tracking-wider">Suggested correction:</span>{' '}
                                  {finding.suggestion}
                                </div>
                              )}
                              {finding.evidence_id && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Evidence: <span className="font-mono">{finding.evidence_id}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Review Decision */}
          {findings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviewer Decision</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-text-secondary mb-4">
                  Human approval is required. AI explanations are clearly distinguished from verified evidence and deterministic rule results.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDecision('APPROVED')}
                    disabled={reviewDecision === 'APPROVED'}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDecision('CHANGES_REQUESTED')}
                    disabled={reviewDecision === 'CHANGES_REQUESTED'}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDecision('REJECTED')}
                    disabled={reviewDecision === 'REJECTED'}
                  >
                    Reject
                  </Button>
                </div>
                {reviewDecision && (
                  <div className="mt-4 p-3 rounded bg-surface-muted text-xs text-text-secondary">
                    Decision: <span className="font-semibold text-text-primary">{reviewDecision}</span>
                    {reviewNotes && <br />}
                    {reviewNotes && <span className="text-slate-500">{reviewNotes}</span>}
                  </div>
                )}
                {!reviewDecision && (
                  <FormField
                    label="Reviewer notes"
                    helperText="Optional justification for your decision"
                  >
                    <FormTextarea
                      id="review-notes"
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </FormField>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <CardFooter className="justify-end pt-0 mt-6 border-t border-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </div>
    </div>
  )
}
