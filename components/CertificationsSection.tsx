const certifications = [
  {
    title: 'Machine Learning & Artificial Intelligence',
    issuer: 'UC Berkeley',
    date: 'Jan 2025 – Jul 2025',
    badge: 'Exemplary Badge',
    badgeHref: 'https://github.com/atewari-bot/certifications/blob/main/ML/Exemplary%20Badge%20UC%20Berkeley.png',
    certHref: 'https://github.com/atewari-bot/certifications/blob/main/ML/ML%20Certificate%20UC%20Berkeley.pdf',
    icon: '🎓',
  },
  {
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    date: 'Feb 2025',
    badge: null,
    badgeHref: null,
    certHref: 'https://www.credly.com/badges/3db01434-c2d7-4270-97e9-d62df96a218d/linked_in_profile',
    icon: '☁️',
  },
  {
    title: 'Claude Code in Action',
    issuer: 'Anthropic Academy',
    date: null,
    badge: null,
    badgeHref: null,
    certHref: 'https://verify.skilljar.com/c/g3yxpwp5fbwj',
    icon: '🤖',
  },
  {
    title: 'Introduction to Model Context Protocol',
    issuer: 'Anthropic Academy',
    date: null,
    badge: null,
    badgeHref: null,
    certHref: 'https://verify.skilljar.com/c/gan2cu3p6qm7',
    icon: '🔌',
  },
  {
    title: 'AWS for Developers: DynamoDB',
    issuer: 'LinkedIn Learning',
    date: 'Nov 2024',
    badge: null,
    badgeHref: null,
    certHref: 'https://www.linkedin.com/learning/certificates/ac2b3375b9a6af39d73cebb1898d5f4c0534fe3e0334788ec782a18162cca779',
    icon: '🗄️',
  },
  {
    title: 'Confluent Fundamentals for Apache Kafka',
    issuer: 'Confluent',
    date: null,
    badge: null,
    badgeHref: null,
    certHref: 'https://www.credential.net/4b04548e-95e9-48b5-bc3b-d8ed1b063a49#acc.6aWTkUQZ',
    icon: '📡',
  },
]

export default function CertificationsSection() {
  return (
    <section id="certifications" className="max-w-[1100px] mx-auto px-8 py-12">
      <div className="flex items-baseline gap-4 mb-8">
        <h2 className="text-2xl font-bold">Certifications</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {certifications.map((cert) => (
          <div
            key={cert.title}
            className="bg-surface border border-border rounded-card p-6 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center text-xl shrink-0">
              {cert.icon}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-semibold text-text leading-snug">{cert.title}</p>
              <p className="text-xs text-accent">{cert.issuer}</p>
              {cert.date && <p className="text-xs text-muted">{cert.date}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <a
                  href={cert.certHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-0.5 rounded-full bg-bg border border-border text-muted no-underline hover:text-accent hover:border-accent transition-colors"
                >
                  View Certificate ↗
                </a>
                {cert.badge && cert.badgeHref && (
                  <a
                    href={cert.badgeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2.5 py-0.5 rounded-full bg-bg border border-border text-muted no-underline hover:text-accent hover:border-accent transition-colors"
                  >
                    {cert.badge} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
