export default function Footer() {
  return (
    <footer className="border-t border-border px-4 sm:px-8 py-6 sm:py-8 text-center text-sm text-muted flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        <a
          href="https://github.com/atewari-bot"
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline text-muted transition-colors hover:text-accent"
        >
          GitHub
        </a>
        <a
          href="https://linkedin.com/in/ajaytewari"
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline text-muted transition-colors hover:text-accent"
        >
          LinkedIn
        </a>
        <a
          href="mailto:mail.ajaytewari@gmail.com"
          className="no-underline text-muted transition-colors hover:text-accent"
        >
          Email
        </a>
      </div>
      <span>&copy; {new Date().getFullYear()} Ajay Tewari</span>
    </footer>
  )
}
