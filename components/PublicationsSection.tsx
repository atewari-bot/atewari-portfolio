const publications = [
  {
    title: 'Covariance and Correlation Explained',
    description: 'Learn the basics of Covariance and Correlation by using Seaborn visualization',
    date: 'Feb 3, 2025',
    link: 'https://ajaytewari.substack.com/p/covariance-and-correlation-explained',
    platform: 'Substack',
    icon: '📊',
  },
]

export default function PublicationsSection() {
  return (
    <section id="publications" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-12">
      <div className="flex items-baseline gap-4 mb-8">
        <h2 className="text-2xl font-bold">Publications</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-6">
        {publications.map((pub) => (
          <div
            key={pub.title}
            className="bg-surface border border-border rounded-card p-6 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center text-xl shrink-0">
              {pub.icon}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-base font-semibold text-text leading-snug">{pub.title}</p>
              <p className="text-sm text-muted">{pub.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-accent">{pub.platform}</p>
                <span className="text-xs text-muted">•</span>
                <p className="text-xs text-muted">{pub.date}</p>
              </div>
              <a
                href={pub.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2.5 py-0.5 rounded-full bg-bg border border-border text-muted no-underline hover:text-accent hover:border-accent transition-colors mt-2 self-start"
              >
                Read Article ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
