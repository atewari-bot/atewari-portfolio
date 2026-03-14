'use client'

import { usePathname } from 'next/navigation'

export type PortfolioView = 'home' | 'journal'

interface Props {
  view?: PortfolioView
  onViewChange?: (v: PortfolioView) => void
}

function HomeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function JournalIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7"  x2="15" y2="7"  />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  )
}

function AdminIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function cls(active: boolean) {
  return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-accent/10 text-accent'
      : 'text-muted hover:text-text hover:bg-surface'
  }`
}

export default function LeftNav({ view, onViewChange }: Props) {
  const pathname = usePathname()
  const isAdmin  = pathname.startsWith('/admin')

  // ── Render one nav item — either a view-switcher button or an anchor link ──
  function ViewItem({ id, label, Icon, desktopSize, mobileSize }: {
    id: PortfolioView; label: string
    Icon: React.FC<{ size?: number }>
    desktopSize: number; mobileSize: number
  }) {
    const active = !isAdmin && view === id

    // On admin pages navigate away; on portfolio pages switch view in-place
    if (isAdmin) {
      const href = id === 'journal' ? '/?tab=journal' : '/'
      return (
        <>
          {/* Desktop */}
          <a href={href} className={`hidden lg:flex ${cls(false)} no-underline`}>
            <Icon size={desktopSize} />{label}
          </a>
          {/* Mobile tab */}
          <a href={href} className={`flex-1 lg:hidden flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-muted no-underline`}>
            <Icon size={mobileSize} />{label}
          </a>
        </>
      )
    }

    return (
      <>
        {/* Desktop */}
        <button
          onClick={() => { onViewChange?.(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className={`hidden lg:flex ${cls(active)} w-full text-left border-0 cursor-pointer bg-transparent`}
        >
          <Icon size={desktopSize} />{label}
        </button>
        {/* Mobile tab */}
        <button
          onClick={() => { onViewChange?.(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className={`flex-1 lg:hidden flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors border-0 cursor-pointer bg-transparent ${active ? 'text-accent' : 'text-muted'}`}
        >
          <Icon size={mobileSize} />{label}
        </button>
      </>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-[60px] bottom-0 w-[220px] border-r border-border bg-bg z-40">
        <nav className="flex flex-col gap-1 p-3 pt-5">
          <ViewItem id="home"    label="Home"    Icon={HomeIcon}    desktopSize={17} mobileSize={20} />
          <ViewItem id="journal" label="Journal" Icon={JournalIcon} desktopSize={17} mobileSize={20} />
          <a
            href="/admin"
            className={`${cls(isAdmin)} no-underline`}
          >
            <AdminIcon size={17} />Admin
          </a>
        </nav>
      </aside>

      {/* ── Mobile bottom tab bar ───────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-[10px] border-t border-border flex">
        <ViewItem id="home"    label="Home"    Icon={HomeIcon}    desktopSize={17} mobileSize={20} />
        <ViewItem id="journal" label="Journal" Icon={JournalIcon} desktopSize={17} mobileSize={20} />
        <a
          href="/admin"
          className={`flex-1 lg:hidden flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium no-underline transition-colors ${isAdmin ? 'text-accent' : 'text-muted'}`}
        >
          <AdminIcon size={20} />Admin
        </a>
      </div>
    </>
  )
}
