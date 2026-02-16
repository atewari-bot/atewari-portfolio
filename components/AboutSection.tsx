const skills = [
  // Languages
  'Python',
  'TypeScript / JavaScript',
  'Go',
  'Node.js',
  'SQL',
  'Java',
  // AI
  'Agentic AI & RAG',
  'Orchestration',
  'Vector Databases',
  'MCP',
  'Models Integration',
  'Prompt / Context Engineering',
  // Cloud
  'AWS',
  'Google Cloud',
  // Data & Streaming
  'Apache Kafka',
  'Airflow',
  'Redis',
  // DevOps / MLOps
  'Docker',
  'Kubernetes',
  'Terraform',
  'MLFlow',
  'Linux',
  // Monitoring
  'Grafana',
  'Datadog',
  // Databases
  'DynamoDB',
  'Oracle',
  'MySQL',
  // Version Control
  'GitHub / GitLab',
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
            Staff engineer and Technical Lead with 17+ years of leading and building at scale.
            Currently driving architecture and delivery of
            conversational AI agent systems, eval pipelines, and multi-turn dialog infrastructure
            for voice services. Previously served as Technical Lead at Optimizely, Cisco/Webex,
            and Apple, leading teams of 8+ engineers to ship billing platforms, order management
            systems, and high-throughput data pipelines. Consistently takes ownership from
            architecture to production.
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
