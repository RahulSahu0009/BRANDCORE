import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MOCK_EVIDENCE } from './__mocks__/facts.js'

const EMPTY_FORM = {
  text: '', numeric_value: '', unit: '', qualifier: '',
  scope_product: '', scope_region: '', scope_valid_until: '', evidence_id: '',
}

function validate(fields) {
  const errors = {}
  if (!fields.text.trim()) errors.text = 'Claim text is required.'
  else if (fields.text.trim().length > 2000) errors.text = 'Claim text must be 2000 characters or fewer.'
  if (!fields.evidence_id) errors.evidence_id = 'Evidence reference is required.'
  if (!fields.scope_product.trim()) errors.scope_product = 'Product is required.'
  if (!fields.scope_region.trim()) errors.scope_region = 'Region is required.'
  if (fields.scope_valid_until && isNaN(new Date(fields.scope_valid_until).getTime()))
    errors.scope_valid_until = 'Enter a valid date.'
  if (fields.numeric_value && isNaN(Number(fields.numeric_value)))
    errors.numeric_value = 'Must be a number.'
  return errors
}

function fieldToFact(f) {
  return {
    text: f.text.trim(),
    numeric_value: f.numeric_value.trim() || null,
    unit: f.unit.trim() || null,
    qualifier: f.qualifier.trim() || null,
    scope: { product: f.scope_product.trim(), region: f.scope_region.trim(), valid_until: f.scope_valid_until || null },
    evidence_id: f.evidence_id,
  }
}

function factToFields(fact) {
  return {
    text: fact.text ?? '',
    numeric_value: fact.numeric_value ?? '',
    unit: fact.unit ?? '',
    qualifier: fact.qualifier ?? '',
    scope_product: fact.scope?.product ?? '',
    scope_region: fact.scope?.region ?? '',
    scope_valid_until: fact.scope?.valid_until ?? '',
    evidence_id: fact.evidence_id ?? '',
  }
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

export default function FactForm({ fact, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(fact)
  const [fields, setFields] = useState(isEdit ? factToFields(fact) : EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const firstFieldRef = useRef(null)
  const dialogRef = useRef(null)

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

  useEffect(() => { firstFieldRef.current?.focus() }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit(fieldToFact(fields))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fact-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onKeyDown={handleDialogKeyDown}
      ref={dialogRef}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel() }}
    >
      <div className="bg-[#1c1c1c] w-full max-w-lg rounded-xl border border-[#2e2e2e] shadow-modal flex flex-col max-h-[92vh]">

        <div className="px-5 py-4 border-b border-[#2e2e2e] flex items-start justify-between shrink-0">
          <div>
            <h2 id="fact-form-title" className="text-[14px] font-semibold text-[#ededed]">
              {isEdit ? 'Edit Approved Fact' : 'New Approved Fact'}
            </h2>
            <p className="text-[12px] text-[#4a4a4a] mt-0.5">
              {isEdit ? 'Editing creates a new version — history is preserved.' : 'All facts require evidence and scope.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={isEdit ? 'Close Edit Approved Fact dialog' : 'Close New Approved Fact dialog'}
            className="w-7 h-7 flex items-center justify-center rounded text-[#4a4a4a] hover:text-[#a1a1a1] hover:bg-[#262626] transition-colors ml-3 shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form id="fact-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="text" required>Claim text</Label>
            <textarea
              ref={firstFieldRef}
              id="text" name="text" rows={3} maxLength={2000}
              value={fields.text} onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.text ? 'text-error' : undefined}
              className={inputCls(errors.text) + ' resize-none'}
              placeholder="e.g. Reduces the appearance of dark spots by up to 30% in 8 weeks."
            />
            <div className="flex items-start justify-between mt-1">
              <FieldError id="text-error" message={errors.text} />
              <span className="text-[11px] text-[#3d3d3d] ml-auto shrink-0">{fields.text.length}/2000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="numeric_value">Numeric value</Label>
              <input id="numeric_value" name="numeric_value" type="text" inputMode="decimal"
                value={fields.numeric_value} onChange={handleChange}
                aria-describedby={errors.numeric_value ? 'numeric-error' : undefined}
                className={inputCls(errors.numeric_value)} placeholder="e.g. 30" />
              <FieldError id="numeric-error" message={errors.numeric_value} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <input id="unit" name="unit" type="text"
                value={fields.unit} onChange={handleChange}
                className={inputCls(false)} placeholder="e.g. percent, SPF" />
            </div>
          </div>

          <div>
            <Label htmlFor="qualifier">Qualifier</Label>
            <input id="qualifier" name="qualifier" type="text"
              value={fields.qualifier} onChange={handleChange}
              className={inputCls(false)} placeholder="e.g. up to, at least, clinically proven" />
          </div>

          <fieldset className="border border-[#2e2e2e] rounded-lg px-4 pt-3 pb-4 bg-[#1a1a1a]">
            <legend className="text-[11px] font-semibold text-[#4a4a4a] px-1 uppercase tracking-[0.07em]">Scope</legend>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label htmlFor="scope_product" required>Product</Label>
                <input id="scope_product" name="scope_product" type="text"
                  value={fields.scope_product} onChange={handleChange}
                  aria-required="true"
                  aria-describedby={errors.scope_product ? 'scope-product-error' : undefined}
                  className={inputCls(errors.scope_product)} placeholder="e.g. Lumora Glow Cream" />
                <FieldError id="scope-product-error" message={errors.scope_product} />
              </div>
              <div>
                <Label htmlFor="scope_region" required>Region</Label>
                <input id="scope_region" name="scope_region" type="text"
                  value={fields.scope_region} onChange={handleChange}
                  aria-required="true"
                  aria-describedby={errors.scope_region ? 'scope-region-error' : undefined}
                  className={inputCls(errors.scope_region)} placeholder="e.g. IN, US, EU" />
                <FieldError id="scope-region-error" message={errors.scope_region} />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="scope_valid_until">Valid until</Label>
              <input id="scope_valid_until" name="scope_valid_until" type="date"
                value={fields.scope_valid_until} onChange={handleChange}
                aria-describedby={errors.scope_valid_until ? 'scope-date-error' : undefined}
                className={inputCls(errors.scope_valid_until)} />
              <FieldError id="scope-date-error" message={errors.scope_valid_until} />
            </div>
          </fieldset>

          <div>
            <Label htmlFor="evidence_id" required>Evidence reference</Label>
            <select id="evidence_id" name="evidence_id"
              value={fields.evidence_id} onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.evidence_id ? 'evidence-error' : undefined}
              className={inputCls(errors.evidence_id)}
            >
              <option value="">Select evidence…</option>
              {MOCK_EVIDENCE.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            <FieldError id="evidence-error" message={errors.evidence_id} />
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
            type="submit" form="fact-form" disabled={submitting}
            className="px-3 py-1.5 text-[12px] font-medium rounded bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#2a9d6e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add fact'}
          </button>
        </div>
      </div>
    </div>
  )
}
