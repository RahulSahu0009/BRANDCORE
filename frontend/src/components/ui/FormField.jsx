/**
 * BRANDCORE — FormField
 * Label, input, error message container with proper accessibility association.
 */

export function FormField({ label, name, error, required, children, helperText, className = '' }) {
  return (
    <div className={'mb-4 ' + className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary mb-1"
      >
        {label} {required && <span className="text-red-700 dark:text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {children}
        {error && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-400" role="alert">
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
        'block w-full rounded-md border border-border bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-text-primary dark:text-text-primary-dark ' +
        'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
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
        'block w-full rounded-md border border-border bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-text-primary dark:text-text-primary-dark ' +
        'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
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
        'block w-full rounded-md border border-border bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-text-primary dark:text-text-primary-dark ' +
        'focus:ring-2 focus:ring-focus focus:border-transparent ' +
        'transition-colors disabled:opacity-50 disabled:pointer-events-none ' +
        className
      }
      {...props}
    />
  )
}
