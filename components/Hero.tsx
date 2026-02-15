import Image from 'next/image'

export default function Hero() {
  return (
    <div className="max-w-[800px] mx-auto px-8 pt-20 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-8">
        <div className="relative w-28 h-28 shrink-0">
          <Image
            src="/resources/profile.jpg"
            alt="Ajay Tewari"
            fill
            className="rounded-full object-cover object-top border-2 border-border"
            priority
          />
        </div>
        <div>
          <p className="text-sm text-accent tracking-widest uppercase mb-3">Hi, I&apos;m</p>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-bold leading-[1.15]">
            Ajay Tewari
          </h1>
        </div>
      </div>
      <p className="text-[1.1rem] text-muted max-w-[580px] mb-8">
        Staff engineer and technical lead building scalable, data-driven systems — architecting
        conversational AI and distributed platforms, leading cross-functional teams, and shipping
        production software designed for lasting impact at scale.
      </p>
      <div className="flex gap-4 flex-wrap">
        <a
          href="#projects"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium no-underline bg-accent text-white transition-opacity hover:opacity-[0.88]"
        >
          View Projects
        </a>
        <a
          href="/resources/Ajay_Tewari_Resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium no-underline bg-transparent text-text border border-border transition-colors hover:bg-surface"
        >
          Resume
        </a>
      </div>
    </div>
  )
}
