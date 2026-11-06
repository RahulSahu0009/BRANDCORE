/**
 * BRANDCORE — Status Badge
 * Colored status indicator with text label. Never color-only.
 * Uses Tailwind dark: variants — no direct DOM reads.
 */
export function StatusBadge({ status, size = 'md' }) {
  const styles = {
    valid: 'bg-green-100 text-green-700 border border-green-700/30 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700/50',
    stale: 'bg-amber-100 text-amber-700 border border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/50',
    revoked: 'bg-red-100 text-red-700 border border-red-700/30 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/50',
    invalid: 'bg-red-100 text-red-700 border border-red-700/30 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/50',
    pending: 'bg-surface-muted text-slate-700 border border-border dark:bg-surface-muted dark:text-slate-500',
    approved: 'bg-green-100 text-green-700 border border-green-700/30 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700/50',
    rejected: 'bg-red-100 text-red-700 border border-red-700/30 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/50',
    'changes-requested': 'bg-amber-100 text-amber-700 border border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/50',
  }

  const base =
    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap'

  const labels = {
    valid: 'Valid',
    stale: 'Stale',
    revoked: 'Revoked',
    invalid: 'Invalid',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    'changes-requested': 'Changes Requested',
  }

  return (
    <span className={`${base} ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  )
}
