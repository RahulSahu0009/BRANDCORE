/**
 * BRANDCORE — Breadcrumbs
 * Navigation breadcrumb trail with separators.
 */
export function Breadcrumbs({ items }) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={item.label}>
            {!isLast && (
              <>
                <a
                  href={item.href}
                  className="hover:text-teal-700 dark:hover:text-teal-dark transition-colors"
                >
                  {item.label}
                </a>
                <span className="mx-1">/</span>
              </>
            )}
            {isLast && <span className="text-text-primary">{item.label}</span>}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
