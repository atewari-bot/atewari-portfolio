'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '#journal',        label: 'Journal' },
  { href: '#questions',      label: 'Q&A' },
  { href: '#projects',       label: 'Projects' },
  { href: '#about',          label: 'About' },
  { href: '#certifications', label: 'Certifications' },
  { href: '#publications',   label: 'Publications' },
  { href: '#contact',        label: 'Contact' },
  { href: '/resources/Ajay_Tewari_Portfolio.pdf', label: 'Resume', target: '_blank', rel: 'noopener noreferrer' },
]

export default function Nav() {
  const pathname = usePathname()
  const isAdmin  = pathname.startsWith('/admin')
  const [menuOpen, setMenuOpen] = useState(false)

  const activeBtn = 'no-underline px-3 py-1.5 text-sm font-medium text-white bg-accent rounded-lg hover:opacity-90 transition-opacity'
  const dimBtn    = 'no-underline px-3 py-1.5 text-sm font-medium text-muted border border-border rounded-lg hover:text-text hover:bg-surface transition-colors'

  return (
    <nav className="sticky top-0 z-50 bg-bg/85 backdrop-blur-[10px] border-b border-border">
      {/* ── Main bar ── */}
      <div className="flex items-center justify-between px-4 sm:px-8 h-[60px]">
        <a href="#" className="font-bold text-[1.1rem] text-accent no-underline shrink-0">
          AT
        </a>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex list-none gap-6 m-0 p-0">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.target}
                rel={link.rel}
                className="no-underline text-muted text-sm transition-colors hover:text-text"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a href="/"            className={isAdmin ? activeBtn : dimBtn}>Home</a>
          <a href="/admin/login" className={isAdmin ? dimBtn    : activeBtn}>Admin</a>

          {/* Hamburger — mobile/tablet only */}
          <button
            className="lg:hidden ml-1 p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors border-0 bg-transparent cursor-pointer"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4"  y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="17" y2="6"  />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-bg/95 backdrop-blur-[10px]">
          <ul className="list-none m-0 p-0 py-2">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.target}
                  rel={link.rel}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 no-underline text-muted text-sm transition-colors hover:text-text hover:bg-surface"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
