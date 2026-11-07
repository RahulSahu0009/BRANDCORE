/**
 * BRANDCORE — Button Component
 * Primary, secondary, danger, and ghost variants with consistent sizing.
 */
import { forwardRef } from 'react'

const variants = {
  primary: 'bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-700',
  secondary: 'bg-surface text-text-primary border border-border hover:bg-surface-muted focus-visible:ring-slate-700',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700',
  ghost: 'text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:ring-slate-700',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef(({ variant = 'primary', size = 'md', className = '', disabled, asChild, ...props }, ref) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors ' +
    'focus-ring disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ' +
    variants[variant] + ' ' + sizes[size] + ' ' + className

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      className={baseClasses}
      {...props}
    />
  )
})

Button.displayName = 'Button'
