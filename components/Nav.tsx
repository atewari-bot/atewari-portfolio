'use client'

import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  const activeBtn = 'no-underline px-3 py-1.5 text-sm font-medium text-white bg-accent rounded-lg hover:opacity-90 transition-opacity'
  const dimBtn    = 'no-underline px-3 py-1.5 text-sm font-medium text-muted border border-border rounded-lg hover:text-text hover:bg-surface transition-colors'

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-[60px] bg-bg/85 backdrop-blur-[10px] border-b border-border">
      <a href="#" className="font-bold text-[1.1rem] text-accent no-underline">
        AT
      </a>
      <ul className="list-none flex gap-8 m-0 p-0">
        <li>
          <a href="#journal" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Journal
          </a>
        </li>
        <li>
          <a href="#questions" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Q&amp;A
          </a>
        </li>
        <li>
          <a href="#projects" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Projects
          </a>
        </li>
        <li>
          <a href="#about" className="no-underline text-muted text-sm transition-colors hover:text-text">
            About
          </a>
        </li>
        <li>
          <a href="#certifications" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Certifications
          </a>
        </li>
        <li>
          <a href="#publications" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Publications
          </a>
        </li>
        <li>
          <a href="#contact" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Contact
          </a>
        </li>
        <li>
          <a
            href="/resources/Ajay_Tewari_Portfolio.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline text-muted text-sm transition-colors hover:text-text"
          >
            Resume
          </a>
        </li>
      </ul>
      <div className="flex items-center gap-2">
        <a href="/"           className={isAdmin ? activeBtn : dimBtn}>Home</a>
        <a href="/admin/login" className={isAdmin ? dimBtn : activeBtn}>Admin</a>
      </div>
    </nav>
  )
}
