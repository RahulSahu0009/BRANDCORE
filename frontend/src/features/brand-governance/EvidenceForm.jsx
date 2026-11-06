import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SOURCE_TYPE_OPTIONS } from './__mocks__/evidence.js'

const EMPTY_FORM = { title: '', source_type: '', summary: '', source_url: '' }

function validate(fields) {
  const errors = {}
  if (!fields.title.trim()) errors.title = 'Title is required.'
  else if (fields.title.trim().length > 200) errors.title = 'Title must be 200 characters or fewer.'
  if (!fields.source_type) errors.source_type = 'Source type is required.'
  if (!fields.summary.trim()) errors.summary = 'Summary is required.'
  else if (fields.summary.trim().length > 2000) errors.summary = 'Summary must be 2000 characters or fewer.'
  if (fields.source_url.trim()) {
    try { new URL(fields.source_url.trim()) } catch {
      if (!fields.source_url.trim().startsWith('internal://'))
        errors.source_url = 'Enter a valid URL (https://) or leave blank.'
    }
  }
  return errors
}

function fieldToRecord(f) {
  return { title: f.title.trim(), source_type: f.source_type, summary: f.summary.trim(), source_url: f.source_url.trim() || null }
}

function recordToFields(r) {
  return { title: r.title ?? '', source_type: r.source_type ?? '', summary: r.summary ?? '', source_url: r.source_url ?? '' }
}

function Label({ htmlFor, required, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-[12px] font-medium text-[#a1a1a1] mb-1.5">
      {children}
      {required && <span aria-hidden="true" className="text-[#f66] ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-[11px] text-[#f66] flex items-center gap-1">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
        <path d="M5.5 3.5v2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <circle cx="5.5" cy="7.5" r="0.5" fill="currentColor"/>
      </svg>
      {message}
    </p>
  )
}

const inputCls = (hasError) =>
  `w-full text-[13px] border rounded px-3 py-2 bg-[#262626] text-[#ededed] placeholder:text-[#3d3d3d] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3ecf8e] transition-colors duration-100 ${
    hasError
      ? 'border-[rgba(255,102,102,0.5)] bg-[rgba(255,102,102,0.05)]'
      : 'border-[#2e2e2e] hover:border-[#3d3d3d] focus-visible:border-[#3ecf8e]'
  }`

export default function EvidenceForm({ record, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(record)
  const [fields, setFields] = useState(isEdit ? recordToFields(record) : EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const firstFieldRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => { firstFieldRef.current?.focus() }, [])

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape' && !submitting) onCancel() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, submitting])

  const handleDialogKeyDown = useCallback((e) => {
    if (e.key !== 'Tab') return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = Array.from(dialog.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ))
    if (!focusable.length) return
    const first = focusable[0], last = focusable[focusable.length - 1]
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus() } }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(fieldToRecord(fields))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onKeyDown={handleDialogKeyDown}
      ref={dialogRef}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel() }}
    >
      <div className="bg-[#1c1c1c] w-full max-w-lg rounded-xl border border-[#2e2e2e] shadow-modal flex flex-col max-h-[92vh]">

        <div className="px-5 py-4 border-b border-[#2e2e2e] flex items-start justify-between shrink-0">
          <div>
            <h2 id="evidence-form-title" className="text-[14px] font-semibold text-[#ededed]">
              {isEdit ? 'Edit Evidence Record' : 'New Evidence Record'}
            </h2>
            <p className="text-[12px] text-[#4a4a4a] mt-0.5">
              {isEdit ? 'Editing creates a new version — history is preserved.' : 'Evidence backs approved facts with verifiable sources.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={isEdit ? 'Close Edit Evidence Record dialog' : 'Close New Evidence Record dialog'}
            className="w-7 h-7 flex items-center justify-center rounded text-[#4a4a4a] hover:text-[#a1a1a1] hover:bg-[#262626] transition-colors ml-3 shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form id="evidence-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="ev-title" required>Title</Label>
            <input ref={firstFieldRef} id="ev-title" name="title" type="text" maxLength={200}
              value={fields.title} onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.title ? 'ev-title-error' : undefined}
              className={inputCls(errors.title)}
              placeholder="e.g. Lumora Glow Cream 8-week clinical study" />
            <div className="flex items-start justify-between mt-1">
              <FieldError id="ev-title-error" message={errors.title} />
              <span className="text-[11px] text-[#3d3d3d] ml-auto shrink-0">{fields.title.length}/200</span>
            </div>
          </div>

          <div>
            <Label htmlFor="ev-source_type" required>Source type</Label>
            <select id="ev-source_type" name="source_type"
              value={fields.source_type} onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.source_type ? 'ev-source-error' : undefined}
              className={inputCls(errors.source_type)}
            >
              <option value="">Select source type…</option>
              {SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FieldError id="ev-source-error" message={errors.source_type} />
          </div>

          <div>
            <Label htmlFor="ev-summary" required>Summary</Label>
            <textarea id="ev-summary" name="summary" rows={3} maxLength={2000}
              value={fields.summary} onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.summary ? 'ev-summary-error' : undefined}
              className={inputCls(errors.summary) + ' resize-none'}
              placeholder="Describe what this evidence proves and how it supports the claim." />
            <div className="flex items-start justify-between mt-1">
              <FieldError id="ev-summary-error" message={errors.summary} />
              <span className="text-[11px] text-[#3d3d3d] ml-auto shrink-0">{fields.summary.length}/2000</span>
            </div>
          </div>

          <div>
            <Label htmlFor="ev-source_url">
              Source URL <span className="text-[#4a4a4a] font-normal">(optional)</span>
            </Label>
            <input id="ev-source_url" name="source_url" type="text"
              value={fields.source_url} onChange={handleChange}
              aria-describedby={errors.source_url ? 'ev-url-error' : undefined}
              className={inputCls(errors.source_url)}
              placeholder="https:// or internal://" />
            <FieldError id="ev-url-error" message={errors.source_url} />
          </div>
        </form>

        <div className="px-5 py-3.5 border-t border-[#2e2e2e] flex items-center justify-end gap-2 shrink-0 bg-[#1a1a1a] rounded-b-xl">
          <button
            type="button" onClick={onCancel} disabled={submitting}
            className="px-3 py-1.5 text-[12px] font-medium border border-[#2e2e2e] rounded text-[#6b6b6b] hover:bg-[#262626] hover:text-[#a1a1a1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit" form="evidence-form" disabled={submitting}
            className="px-3 py-1.5 text-[12px] font-medium rounded bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#2a9d6e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add evidence'}
          </button>
        </div>
      </div>
    </div>
  )
}
