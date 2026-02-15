import { projects } from '@/lib/projects'
import ProjectCard from './ProjectCard'

export default function ProjectsSection() {
  return (
    <section id="projects" className="max-w-[1100px] mx-auto px-8 py-12">
      <div className="flex items-baseline gap-4 mb-8">
        <h2 className="text-2xl font-bold">Projects</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {projects.map((project, i) => (
          <ProjectCard key={i} project={project} />
        ))}
      </div>
    </section>
  )
}
