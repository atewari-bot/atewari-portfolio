const skills = [
  'Python',
  'TypeScript / JavaScript',
  'Go',
  'Node.js',
  'Agentic AI & RAG',
  'Vector Databases',
  'Prompt / Context Engineering',
  'AWS',
  'Google Cloud',
  'Apache Kafka',
  'Airflow',
  'Redis',
  'Docker',
  'Kubernetes',
  'Terraform',
  'DynamoDB',
  'MySQL',
  'Grafana / Datadog',
]

export default function AboutSection() {
  return (
    <section id="about" className="max-w-[1100px] mx-auto px-8 py-12">
      <div className="flex items-baseline gap-4 mb-8">
        <h2 className="text-2xl font-bold">About</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="bg-surface border border-border rounded-card p-6">
          <h3 className="text-xs uppercase tracking-widest text-accent mb-3">Background</h3>
          <p className="text-sm text-muted">
            Senior Software Engineer and Technical Lead with 15+ years of experience building
            distributed systems and conversational AI. Currently at Roku designing AI agent
            components — eval pipelines, semantic caching, and multi-turn dialog systems for voice
            services. Previously led engineering teams at Optimizely and Cisco/Webex delivering
            scalable billing platforms and order management systems. UC Berkeley–certified in ML &
            AI (Exemplary Badge) and AWS Certified Cloud Practitioner.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-card p-6">
          <h3 className="text-xs uppercase tracking-widest text-accent mb-3">Skills</h3>
          <ul className="list-none flex flex-wrap gap-1.5 m-0 p-0">
            {skills.map((skill) => (
              <li
                key={skill}
                className="text-sm text-muted bg-bg border border-border rounded-md px-2.5 py-1"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
