const skillCategories = [
  {
    category: 'Languages',
    skills: ['Python', 'TypeScript/JavaScript', 'Go', 'Node.js', 'SQL', 'Java'],
  },
  {
    category: 'Artificial Intelligence',
    skills: ['RAG', 'Agentic AI', 'Orchestration', 'Vector Databases & Semantic Search', 'MCP', 'Models Integration', 'Prompt/Context Engineering', 'Generative AI'],
  },
  {
    category: 'Cloud Platforms',
    skills: ['AWS', 'Google Cloud Platform'],
  },
  {
    category: 'Data & Streaming',
    skills: ['Airflow', 'Apache Kafka', 'Redis'],
  },
  {
    category: 'Infrastructure & DevOps/MLOps',
    skills: ['Docker', 'Terraform', 'Kubernetes', 'MLFlow', 'Linux'],
  },
  {
    category: 'Monitoring & Observability',
    skills: ['Grafana', 'Datadog'],
  },
  {
    category: 'Databases',
    skills: ['DynamoDB', 'Oracle', 'MySQL'],
  },
  {
    category: 'Version Control',
    skills: ['GitHub/GitLab'],
  },
  {
    category: 'Software Architecture & Methodologies',
    skills: ['Microservices', 'Unit Testing Frameworks', 'Agile Development', 'Software Design', 'Software Development'],
  },
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
          <p className="text-sm text-muted mb-3">
            I&apos;m a software engineer who loves building meaningful products, solving challenging problems, and learning something new every day. I care deeply about craftsmanship, curiosity, and ownership, and I enjoy turning complex ideas into simple, reliable systems that make a real difference.
          </p>
          <p className="text-sm text-muted mb-3">
            I believe great engineering starts with strong fundamentals and clear thinking. I take pride in designing scalable systems, writing thoughtful code, and approaching problems with both rigor and empathy. I value collaboration and clear communication, and I enjoy helping teams move from ambiguity to clarity. For me, building software is about creating durable solutions, elevating those around me, and continuously raising the bar on quality and impact.
          </p>
          <p className="text-sm text-muted">
            Outside of work, I love hiking, running, and taking road trips with my family. Being outdoors helps me recharge and stay grounded, and I bring that same sense of energy, focus, and curiosity back into everything I build.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-card p-6">
          <h3 className="text-xs uppercase tracking-widest text-accent mb-4">Technical Skills</h3>
          <div className="space-y-4">
            {skillCategories.map((category) => (
              <div key={category.category}>
                <h4 className="text-xs font-semibold text-text mb-2">{category.category}</h4>
                <ul className="list-none flex flex-wrap gap-1.5 m-0 p-0">
                  {category.skills.map((skill) => (
                    <li
                      key={skill}
                      className="text-sm text-muted bg-bg border border-border rounded-md px-2.5 py-1"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
