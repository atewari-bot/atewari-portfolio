import type { Project } from '@/lib/projects'

export default function ProjectCard({ project }: { project: Project }) {
  const isPlaceholder = project.href === null

  const cardClasses = [
    'bg-surface border border-border rounded-card p-6 flex flex-col gap-3',
    'transition-all duration-200',
    isPlaceholder
      ? 'border-dashed opacity-45 pointer-events-none'
      : 'no-underline text-text hover:border-accent-dim hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
  ].join(' ')

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center text-xl">
          {project.icon}
        </div>
        {!isPlaceholder && (
          <span className="text-muted text-base opacity-0 group-hover:opacity-100 transition-opacity">
            ↗
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold">{project.title}</h3>
      <p className="text-[0.88rem] text-muted flex-1">{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-0.5 rounded-full bg-bg border border-border text-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  )

  if (isPlaceholder) {
    return <div className={cardClasses}>{inner}</div>
  }

  return (
    <a
      href={project.href!}
      target="_blank"
      rel="noopener noreferrer"
      className={`group ${cardClasses}`}
    >
      {inner}
    </a>
  )
}
