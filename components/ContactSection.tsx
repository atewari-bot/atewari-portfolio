const contacts = [
  {
    label: 'Email',
    value: 'mail.ajaytewari@gmail.com',
    href: 'mailto:mail.ajaytewari@gmail.com',
    icon: '✉️',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/ajaytewari',
    href: 'https://linkedin.com/in/ajaytewari',
    icon: '💼',
  },
  {
    label: 'GitHub',
    value: 'github.com/atewari-bot',
    href: 'https://github.com/atewari-bot',
    icon: '🐙',
  },
]

export default function ContactSection() {
  return (
    <section id="contact" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-12">
      <div className="flex items-baseline gap-4 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">Contact</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {contacts.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith('mailto') ? undefined : '_blank'}
            rel={c.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
            className="bg-surface border border-border rounded-card p-6 flex gap-4 items-center no-underline group transition-all duration-200 hover:border-accent-dim hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)]"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center text-xl shrink-0">
              {c.icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs uppercase tracking-widest text-accent">{c.label}</p>
              <p className="text-sm text-muted truncate group-hover:text-text transition-colors">
                {c.value}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
