export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-[60px] bg-bg/85 backdrop-blur-[10px] border-b border-border">
      <a href="#" className="font-bold text-[1.1rem] text-accent no-underline">
        AT
      </a>
      <ul className="list-none flex gap-8 m-0 p-0">
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
          <a href="#contact" className="no-underline text-muted text-sm transition-colors hover:text-text">
            Contact
          </a>
        </li>
        <li>
          <a
            href="/resources/Ajay_Tewari.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline text-muted text-sm transition-colors hover:text-text"
          >
            Resume
          </a>
        </li>
      </ul>
    </nav>
  )
}
