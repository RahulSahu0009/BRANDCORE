import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SOURCE_TYPE_OPTIONS } from './__mocks__/evidence.js'

const EMPTY_FORM = {
  title: '',
  source_type: '',
  summary: '',
  source_url: '',
}

function validate(fields) {
  const errors = {}
  if (!fields.title.trim()) {
    errors.title = 'Title is required.'
  } else if (fields.title.trim().length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }
  if (!fields.source_type) {
    errors.source_type = 'Source type is required.'
  }
  if (!fields.summary.trim()) {
    errors.summary = 'Summary is required.'
  } else if (fields.summary.trim().length > 2000) {
    errors.summary = 'Summary must be 2000 characters or fewer.'
  }
  if (fields.source_url.trim()) {
    try {
      new URL(fields.source_url.trim())
    } catch {
      // allow internal:// scheme used in seed data
      if (!fields.source_url.trim().startsWith('internal://')) {
        errors.source_url = 'Enter a valid URL or leave blank.'
      }
    }
  }
  return errors
}

function fieldToRecord(fields) {
  return {
    title: fields.title.trim(),
    source_type: fields.source_type,
    summary: fields.summary.trim(),
    source_url: fields.source_url.trim() || null,
  }
}

function recordToFields(record) {
  return {
    title: record.title ?? '',
    source_type: record.source_type ?? '',
    summary: record.summary ?? '',
    source_url: record.source_url ?? '',
  }
}

export default function EvidenceForm({ record, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(record)
  const [fields, setFields] = useState(isEdit ? recordToFields(record) : EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const firstFieldRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, submitting])

  // Focus trap
  const handleDialogKeyDown = useCallback((e) => {
    if (e.key !== 'Tab') return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#142235]/60"
      onKeyDown={handleDialogKeyDown}
      ref={dialogRef}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel() }}
    >
      <div className="bg-white w-full max-w-lg mx-4 rounded border border-[#DCE3EA] shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCE3EA] flex items-center justify-between shrink-0">
          <h2 id="evidence-form-title" className="text-base font-semibold text-[#162638]">
            {isEdit ? 'Edit Evidence Record' : 'Add Evidence Record'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close Add Evidence Record dialog"
            className="text-[#718197] hover:text-[#42556B] focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          id="evidence-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 flex flex-col gap-4"
        >
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ev-title" className="text-xs font-medium text-[#42556B]">
              Title <span aria-hidden="true" className="text-[#B42318]">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="ev-title"
              name="title"
              type="text"
              maxLength={200}
              value={fields.title}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.title ? 'ev-title-error' : undefined}
              className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                errors.title ? 'border-[#B42318]' : 'border-[#DCE3EA]'
              }`}
            />
            <div className="flex justify-between">
              {errors.title
                ? <span id="ev-title-error" role="alert" className="text-xs text-[#B42318]">{errors.title}</span>
                : <span />}
              <span className="text-xs text-[#718197]">{fields.title.length}/200</span>
            </div>
          </div>

          {/* Source type */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ev-source_type" className="text-xs font-medium text-[#42556B]">
              Source type <span aria-hidden="true" className="text-[#B42318]">*</span>
            </label>
            <select
              id="ev-source_type"
              name="source_type"
              value={fields.source_type}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.source_type ? 'ev-source-error' : undefined}
              className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                errors.source_type ? 'border-[#B42318]' : 'border-[#DCE3EA]'
              }`}
            >
              <option value="">Select source type…</option>
              {SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.source_type && (
              <span id="ev-source-error" role="alert" className="text-xs text-[#B42318]">{errors.source_type}</span>
            )}
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ev-summary" className="text-xs font-medium text-[#42556B]">
              Summary <span aria-hidden="true" className="text-[#B42318]">*</span>
            </label>
            <textarea
              id="ev-summary"
              name="summary"
              rows={3}
              maxLength={2000}
              value={fields.summary}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.summary ? 'ev-summary-error' : undefined}
              className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white resize-none focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                errors.summary ? 'border-[#B42318]' : 'border-[#DCE3EA]'
              }`}
            />
            <div className="flex justify-between">
              {errors.summary
                ? <span id="ev-summary-error" role="alert" className="text-xs text-[#B42318]">{errors.summary}</span>
                : <span />}
              <span className="text-xs text-[#718197]">{fields.summary.length}/2000</span>
            </div>
          </div>

          {/* Source URL */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ev-source_url" className="text-xs font-medium text-[#42556B]">
              Source URL
            </label>
            <input
              id="ev-source_url"
              name="source_url"
              type="text"
              placeholder="https:// or internal://"
              value={fields.source_url}
              onChange={handleChange}
              aria-describedby={errors.source_url ? 'ev-url-error' : undefined}
              className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                errors.source_url ? 'border-[#B42318]' : 'border-[#DCE3EA]'
              }`}
            />
            {errors.source_url && (
              <span id="ev-url-error" role="alert" className="text-xs text-[#B42318]">{errors.source_url}</span>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DCE3EA] flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm border border-[#DCE3EA] rounded text-[#42556B] bg-white hover:bg-[#EEF2F6] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2563EB]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="evidence-form"
            disabled={submitting}
            className="px-4 py-2 text-sm rounded text-white bg-[#147A72] hover:bg-[#0f6560] disabled:bg-[#EEF2F6] disabled:text-[#718197] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2563EB]"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add evidence'}
          </button>
        </div>
      </div>
    </div>
  )
}
