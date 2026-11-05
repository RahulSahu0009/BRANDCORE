import React, { useEffect, useState } from 'react'
import ContentSubmissionForm from './ContentSubmissionForm.jsx'
import FindingsPanel from './FindingsPanel.jsx'
import ReviewDecisionForm from './ReviewDecisionForm.jsx'
import VersionHistory from './VersionHistory.jsx'
import {
  analyzeContent,
  DEMO_WORKSPACE_ID,
  getContentVersions,
  submitReview,
  USE_MOCK_API,
} from './contentReviewApi.js'

/**
 * Content Review feature entry (owner: Rahul).
 * The content review workflow remains intentionally workspace-scoped. The
 * mock switch is removed once the proposed backend content routes are live.
 */
export default function ContentReviewPage() {
  const [submission, setSubmission] = useState(null)
  const [findings, setFindings] = useState([])
  const [analysisState, setAnalysisState] = useState({ loading: false, error: null })
  const [versions, setVersions] = useState([])
  const [versionState, setVersionState] = useState({ loading: false, error: null })
  const [reviewResult, setReviewResult] = useState(null)
  const [reviewError, setReviewError] = useState(null)
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    if (!submission) return
    let active = true
    setAnalysisState({ loading: true, error: null })
    setVersionState({ loading: true, error: null })
    Promise.all([
      analyzeContent(DEMO_WORKSPACE_ID, submission.content_version_id),
      getContentVersions(DEMO_WORKSPACE_ID, submission.content_item_id),
    ])
      .then(([analysis, versionResponse]) => {
        if (!active) return
        setFindings(analysis.findings || [])
        setVersions(versionResponse.versions || [])
        setAnalysisState({ loading: false, error: null })
        setVersionState({ loading: false, error: null })
      })
      .catch((error) => {
        if (!active) return
        setAnalysisState({ loading: false, error: error.message || 'Analysis failed. Please try again.' })
        setVersionState({ loading: false, error: error.message || 'Version history is unavailable.' })
      })
    return () => {
      active = false
    }
  }, [submission])

  function handleSubmitted(result) {
    setSubmission(result)
    setReviewResult(null)
    setReviewError(null)
  }

  async function handleReview(decision) {
    setReviewing(true)
    setReviewError(null)
    try {
      const result = await submitReview(DEMO_WORKSPACE_ID, submission.content_version_id, decision)
      setReviewResult(result)
      const updated = await getContentVersions(DEMO_WORKSPACE_ID, submission.content_item_id)
      setVersions(updated.versions || [])
    } catch (error) {
      setReviewError(error.message || 'The review decision could not be recorded.')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      {USE_MOCK_API && (
        <p className="rounded-md border border-amber-700 bg-amber-100 px-3 py-2 text-xs text-amber-700">
          <strong>Mock data:</strong> submissions are not saved. The content API is not yet available, so this
          screen uses a labelled mock fixture.
        </p>
      )}
      <section aria-labelledby="submit-content-heading" className="rounded-lg border border-border bg-surface p-6">
        <h2 id="submit-content-heading" className="text-lg font-semibold text-text-primary">
          Submit content for review
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          Paste the copy you want checked against approved facts, evidence and terminology.
        </p>
        <ContentSubmissionForm workspaceId={DEMO_WORKSPACE_ID} onSubmitted={handleSubmitted} />
      </section>
      {submission && (
        <>
          <FindingsPanel findings={findings} loading={analysisState.loading} error={analysisState.error} />
          <ReviewDecisionForm onSubmit={handleReview} disabled={reviewing || !!analysisState.error} result={reviewResult} />
          {reviewError && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{reviewError}</p>}
          <VersionHistory versions={versions} loading={versionState.loading} error={versionState.error} />
        </>
      )}
    </div>
  )
}
