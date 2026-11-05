/**
 * BRANDCORE — FormField
 * Label, input, error message container with proper accessibility association.
 */
import { useState } from 'react'

export function FormField({ label, name, error, required, children, helperText, className = '' }) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={'mb-4 ' + className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary mb-1"
      >
        {label} {required && <span className="text-red-700 ml-1">*</span>}
      </label>
      <div
        className="relative"
        onFocusIn={() => setIsFocused(true)}
        onFocusOut={() => setIsFocused(false)}
      >
        {children}
        {error && (
          <p className="mt-1 text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    </div>
  )
}

export function FormInput({ id, className = '', ...props }) {
  return (
    <input
      id={id}
      className={
        'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary ' +
        'placeholder:text-slate-400 ' +
        'focus:ring-2 focus:ring-focus focus:border-transparent ' +
        'transition-colors disabled:opacity-50 disabled:pointer-events-none ' +
        className
      }
      {...props}
    />
  )
}

export function FormTextarea({ id, className = '', rows = 4, ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={
        'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary ' +
        'placeholder:text-slate-400 ' +
        'focus:ring-2 focus:ring-focus focus:border-transparent ' +
        'transition-colors disabled:opacity-50 disabled:pointer-events-none resize-none ' +
        className
      }
      {...props}
    />
  )
}

export function FormSelect({ id, className = '', ...props }) {
  return (
    <select
      id={id}
      className={
        'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary ' +
        'focus:ring-2 focus:ring-focus focus:border-transparent ' +
        'transition-colors disabled:opacity-50 disabled:pointer-events-none ' +
        className
      }
      {...props}
    />
  )
}
