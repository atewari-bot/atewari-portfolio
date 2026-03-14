interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 px-4 sm:px-8 py-2.5 border-b border-border text-xs text-muted bg-bg/60"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 opacity-40">
                <path d="M4 2l4 4-4 4" />
              </svg>
            )}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-text font-medium' : 'text-muted'}>
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-muted no-underline hover:text-accent transition-colors"
              >
                {item.label}
              </a>
            )}
          </span>
        )
      })}
    </nav>
  )
}
