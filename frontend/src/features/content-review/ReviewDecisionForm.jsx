import React, { useEffect, useRef, useState } from 'react'

const DECISIONS = [
  ['APPROVED', 'Approve'],
  ['CHANGES_REQUESTED', 'Request changes'],
  ['REJECTED', 'Reject'],
]

export default function ReviewDecisionForm({ onSubmit, disabled = false, result }) {
  const [decision, setDecision] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const confirmationRef = useRef(null)

  useEffect(() => {
    if (result) confirmationRef.current?.focus()
  }, [result])

  function handleSubmit(event) {
    event.preventDefault()
    if (!decision) {
      setError('Choose a review decision.')
      return
    }
    setError('')
    onSubmit({ decision, reviewer_role: 'reviewer', notes: notes.trim() || null })
  }

  if (result) {
    return (
      <section className="rounded-lg border border-green-300 bg-green-50 p-4" role="status">
        <h2 ref={confirmationRef} tabIndex={-1} className="font-semibold text-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring">
          Decision recorded: {result.decision}
        </h2>
        <p className="mt-1 text-sm text-green-800">
          Recorded at {new Date(result.timestamp || result.created_at).toLocaleString()}.
        </p>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4" noValidate>
      <h2 className="text-lg font-semibold text-text-primary">Reviewer decision</h2>
      <fieldset disabled={disabled} aria-describedby={error ? 'decision-error' : undefined}>
        <legend className="mb-2 text-sm text-slate-600">Select one decision</legend>
        <div className="flex flex-wrap gap-3">
          {DECISIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-text-primary">
              <input type="radio" name="decision" value={value} checked={decision === value} onChange={(event) => setDecision(event.target.value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="review-notes" className="block text-sm font-medium text-text-primary">Notes <span className="font-normal text-slate-600">(optional, max 1000 characters)</span></label>
      <textarea id="review-notes" value={notes} maxLength={1000} disabled={disabled} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring" rows={3} />
      {error && <p id="decision-error" role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={disabled} className="rounded-md bg-[#147A72] px-3 py-2 text-sm font-medium text-white hover:bg-[#0F615B] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring">
        Record decision
      </button>
    </form>
  )
}
