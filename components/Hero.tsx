'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function Hero() {
  const [isResumeOpen, setIsResumeOpen] = useState(false)

  return (
    <>
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
          Technical lead with 17 years of experience designing and delivering cloud-native microservices, large-scale distributed systems, and AI pipelines on AWS and GCP. Expertise in agentic AI, semantic search, and conversational AI systems using Python, Go, and Java. Proven track record driving cross-functional initiatives and optimizing systems for performance, scalability, and cost efficiency.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setIsResumeOpen(true)}
            className="inline-block px-6 py-3 rounded-lg text-sm font-semibold no-underline bg-accent text-white transition-opacity hover:opacity-[0.88] cursor-pointer border-0"
          >
            View Resume
          </button>
          <a
            href="/resources/Ajay_Tewari_Portfolio.pdf"
            download
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium no-underline bg-transparent text-text border border-border transition-colors hover:bg-surface"
          >
            Download Resume ↓
          </a>
          <a
            href="#projects"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium no-underline bg-transparent text-text border border-border transition-colors hover:bg-surface"
          >
            View Projects
          </a>
        </div>
      </div>

      {isResumeOpen && (
        <div
          className="fixed inset-0 bg-green-950/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsResumeOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-green-600 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsResumeOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-green-900/70 text-white hover:bg-green-900 transition-colors flex items-center justify-center text-2xl leading-none border-0 cursor-pointer"
              aria-label="Close"
            >
              ×
            </button>
            <iframe
              src="/resources/Ajay_Tewari_Portfolio.pdf"
              className="w-full h-full"
              title="Resume"
            />
          </div>
        </div>
      )}
    </>
  )
}
