/**
 * BRANDCORE — Card Component
 * Elevated surface container with consistent border and shadow.
 */
export function Card({ className = '', children, padding = 'p-6' }) {
  return (
    <div
      className={
        'bg-surface dark:bg-surface-dark border border-border rounded-lg shadow-sm ' +
        padding + ' ' + className
      }
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return <div className={'mb-4 ' + className}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return (
    <h3 className={'text-lg font-semibold text-text-primary ' + className}>{children}</h3>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ className = '', children }) {
  return (
    <div className={'mt-4 flex items-center gap-2 ' + className}>{children}</div>
  )
}
