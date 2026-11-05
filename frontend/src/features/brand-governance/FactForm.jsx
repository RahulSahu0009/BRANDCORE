import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MOCK_EVIDENCE } from './__mocks__/facts.js'

const EMPTY_FORM = {
  text: '',
  numeric_value: '',
  unit: '',
  qualifier: '',
  scope_product: '',
  scope_region: '',
  scope_valid_until: '',
  evidence_id: '',
}

function validate(fields) {
  const errors = {}
  if (!fields.text.trim()) {
    errors.text = 'Claim text is required.'
  } else if (fields.text.trim().length > 2000) {
    errors.text = 'Claim text must be 2000 characters or fewer.'
  }
  if (!fields.evidence_id) {
    errors.evidence_id = 'Evidence reference is required.'
  }
  if (!fields.scope_product.trim()) {
    errors.scope_product = 'Product is required.'
  }
  if (!fields.scope_region.trim()) {
    errors.scope_region = 'Region is required.'
  }
  if (fields.scope_valid_until) {
    const d = new Date(fields.scope_valid_until)
    if (isNaN(d.getTime())) {
      errors.scope_valid_until = 'Enter a valid date (YYYY-MM-DD).'
    }
  }
  if (fields.numeric_value && isNaN(Number(fields.numeric_value))) {
    errors.numeric_value = 'Numeric value must be a number.'
  }
  return errors
}

function fieldToFact(fields) {
  return {
    text: fields.text.trim(),
    numeric_value: fields.numeric_value.trim() || null,
    unit: fields.unit.trim() || null,
    qualifier: fields.qualifier.trim() || null,
    scope: {
      product: fields.scope_product.trim(),
      region: fields.scope_region.trim(),
      valid_until: fields.scope_valid_until || null,
    },
    evidence_id: fields.evidence_id,
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

export default function FactForm({ fact, onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(fact)
  const [fields, setFields] = useState(isEdit ? factToFields(fact) : EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const firstFieldRef = useRef(null)
  const dialogRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, submitting])

  // Focus trap: keep Tab/Shift+Tab inside the dialog
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
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit(fieldToFact(fields))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fact-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#142235]/60"
      onKeyDown={handleDialogKeyDown}
      ref={dialogRef}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel() }}
    >
      <div className="bg-white w-full max-w-lg mx-4 rounded border border-[#DCE3EA] shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCE3EA] flex items-center justify-between shrink-0">
          <h2 id="fact-form-title" className="text-base font-semibold text-[#162638]">
            {isEdit ? 'Edit Approved Fact' : 'Add Approved Fact'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close Add Approved Fact dialog"
            className="text-[#718197] hover:text-[#42556B] focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          id="fact-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto px-6 py-5 flex flex-col gap-4"
        >
          {/* Claim text */}
          <div className="flex flex-col gap-1">
            <label htmlFor="text" className="text-xs font-medium text-[#42556B]">
              Claim text <span aria-hidden="true" className="text-[#B42318]">*</span>
            </label>
            <textarea
              ref={firstFieldRef}
              id="text"
              name="text"
              rows={3}
              maxLength={2000}
              value={fields.text}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.text ? 'text-error' : undefined}
              className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white resize-none focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                errors.text ? 'border-[#B42318]' : 'border-[#DCE3EA]'
              }`}
            />
            <div className="flex justify-between">
              {errors.text
                ? <span id="text-error" role="alert" className="text-xs text-[#B42318]">{errors.text}</span>
                : <span />}
              <span className="text-xs text-[#718197]">{fields.text.length}/2000</span>
            </div>
          </div>

          {/* Numeric value + unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="numeric_value" className="text-xs font-medium text-[#42556B]">
                Numeric value
              </label>
              <input
                id="numeric_value"
                name="numeric_value"
                type="text"
                inputMode="decimal"
                value={fields.numeric_value}
                onChange={handleChange}
                aria-describedby={errors.numeric_value ? 'numeric-error' : undefined}
                className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                  errors.numeric_value ? 'border-[#B42318]' : 'border-[#DCE3EA]'
                }`}
              />
              {errors.numeric_value && (
                <span id="numeric-error" role="alert" className="text-xs text-[#B42318]">{errors.numeric_value}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="unit" className="text-xs font-medium text-[#42556B]">
                Unit
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                placeholder="e.g. percent, SPF"
                value={fields.unit}
                onChange={handleChange}
                className="text-sm border border-[#DCE3EA] rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB]"
              />
            </div>
          </div>

          {/* Qualifier */}
          <div className="flex flex-col gap-1">
            <label htmlFor="qualifier" className="text-xs font-medium text-[#42556B]">
              Qualifier
            </label>
            <input
              id="qualifier"
              name="qualifier"
              type="text"
              placeholder="e.g. up to, at least"
              value={fields.qualifier}
              onChange={handleChange}
              className="text-sm border border-[#DCE3EA] rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB]"
            />
          </div>

          {/* Scope */}
          <fieldset className="flex flex-col gap-3 border border-[#DCE3EA] rounded px-4 py-3">
            <legend className="text-xs font-medium text-[#42556B] px-1">Scope</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="scope_product" className="text-xs font-medium text-[#42556B]">
                  Product <span aria-hidden="true" className="text-[#B42318]">*</span>
                </label>
                <input
                  id="scope_product"
                  name="scope_product"
                  type="text"
                  value={fields.scope_product}
                  onChange={handleChange}
                  aria-required="true"
                  aria-describedby={errors.scope_product ? 'scope-product-error' : undefined}
                  className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                    errors.scope_product ? 'border-[#B42318]' : 'border-[#DCE3EA]'
                  }`}
                />
                {errors.scope_product && (
                  <span id="scope-product-error" role="alert" className="text-xs text-[#B42318]">{errors.scope_product}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="scope_region" className="text-xs font-medium text-[#42556B]">
                  Region <span aria-hidden="true" className="text-[#B42318]">*</span>
                </label>
                <input
                  id="scope_region"
                  name="scope_region"
                  type="text"
                  placeholder="e.g. IN, US"
                  value={fields.scope_region}
                  onChange={handleChange}
                  aria-required="true"
                  aria-describedby={errors.scope_region ? 'scope-region-error' : undefined}
                  className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                    errors.scope_region ? 'border-[#B42318]' : 'border-[#DCE3EA]'
                  }`}
                />
                {errors.scope_region && (
                  <span id="scope-region-error" role="alert" className="text-xs text-[#B42318]">{errors.scope_region}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="scope_valid_until" className="text-xs font-medium text-[#42556B]">
                Valid until
              </label>
              <input
                id="scope_valid_until"
                name="scope_valid_until"
                type="date"
                value={fields.scope_valid_until}
                onChange={handleChange}
                aria-describedby={errors.scope_valid_until ? 'scope-date-error' : undefined}
                className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                  errors.scope_valid_until ? 'border-[#B42318]' : 'border-[#DCE3EA]'
                }`}
              />
              {errors.scope_valid_until && (
                <span id="scope-date-error" role="alert" className="text-xs text-[#B42318]">{errors.scope_valid_until}</span>
              )}
            </div>
          </fieldset>

          {/* Evidence reference */}
          <div className="flex flex-col gap-1">
            <label htmlFor="evidence_id" className="text-xs font-medium text-[#42556B]">
              Evidence reference <span aria-hidden="true" className="text-[#B42318]">*</span>
            </label>
            <select
              id="evidence_id"
              name="evidence_id"
              value={fields.evidence_id}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.evidence_id ? 'evidence-error' : undefined}
              className={`text-sm border rounded px-3 py-2 text-[#162638] bg-white focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                errors.evidence_id ? 'border-[#B42318]' : 'border-[#DCE3EA]'
              }`}
            >
              <option value="">Select evidence…</option>
              {MOCK_EVIDENCE.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            {errors.evidence_id && (
              <span id="evidence-error" role="alert" className="text-xs text-[#B42318]">{errors.evidence_id}</span>
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
            form="fact-form"
            disabled={submitting}
            className="px-4 py-2 text-sm rounded text-white bg-[#147A72] hover:bg-[#0f6560] disabled:bg-[#EEF2F6] disabled:text-[#718197] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2563EB]"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add fact'}
          </button>
        </div>
      </div>
    </div>
  )
}
