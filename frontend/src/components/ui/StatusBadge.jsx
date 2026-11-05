/**
 * BRANDCORE — Status Badge
 * Colored status indicator with text label. Never color-only.
 */
export function StatusBadge({ status, size = 'md' }) {
  const styles = {
    valid: {
      light: 'bg-green-100 text-green-700 border border-green-700/30',
      dark: 'bg-green-100 text-green-700 border border-green-700/30',
    },
    stale: {
      light: 'bg-amber-100 text-amber-700 border border-amber-700/30',
      dark: 'bg-amber-100 text-amber-700 border border-amber-700/30',
    },
    revoked: {
      light: 'bg-red-100 text-red-700 border border-red-700/30',
      dark: 'bg-red-100 text-red-700 border border-red-700/30',
    },
    invalid: {
      light: 'bg-red-100 text-red-700 border border-red-700/30',
      dark: 'bg-red-100 text-red-700 border border-red-700/30',
    },
    pending: {
      light: 'bg-surface-muted text-slate-700 border border-border',
      dark: 'bg-surface-muted text-slate-500 border border-border',
    },
    approved: {
      light: 'bg-green-100 text-green-700 border border-green-700/30',
      dark: 'bg-green-100 text-green-700 border border-green-700/30',
    },
    rejected: {
      light: 'bg-red-100 text-red-700 border border-red-700/30',
      dark: 'bg-red-100 text-red-700 border border-red-700/30',
    },
    'changes-requested': {
      light: 'bg-amber-100 text-amber-700 border border-amber-700/30',
      dark: 'bg-amber-100 text-amber-700 border border-amber-700/30',
    },
  }

  const base =
    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap'
  const style = styles[status]?.light || styles.pending.light

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
    <span className={`${base} ${style}`}>
      {labels[status] ?? status}
    </span>
  )
}
