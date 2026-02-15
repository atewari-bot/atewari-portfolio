export default function Footer() {
  return (
    <footer className="border-t border-border px-8 py-8 text-center text-sm text-muted flex flex-col items-center gap-3">
      <div className="flex gap-6">
        {/* TODO: replace # with your profile URLs */}
        <a href="#" target="_blank" rel="noopener noreferrer" className="no-underline text-muted transition-colors hover:text-accent">
          GitHub
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer" className="no-underline text-muted transition-colors hover:text-accent">
          LinkedIn
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer" className="no-underline text-muted transition-colors hover:text-accent">
          Twitter
        </a>
        <a href="mailto:your@email.com" className="no-underline text-muted transition-colors hover:text-accent">
          Email
        </a>
      </div>
      <span>&copy; {new Date().getFullYear()} Ajay Tewari</span>
    </footer>
  )
}
