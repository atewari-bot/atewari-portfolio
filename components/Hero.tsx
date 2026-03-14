'use client'

import Image from 'next/image'
import { useState } from 'react'
import { projects } from '@/lib/projects'

const STATS = [
  { value: String(projects.length), label: 'Projects' },
  { value: '7',   label: 'Certifications' },
  { value: '2',   label: 'Publications' },
  { value: '20+', label: 'Technologies' },
]

const SKILLS = [
  { icon: '🤖', text: 'Agentic AI' },
  { icon: '🔗', text: 'RAG Pipelines' },
  { icon: '🗄️', text: 'Vector Databases' },
  { icon: '🔌', text: 'MCP' },
  { icon: '💬', text: 'Prompt Engineering' },
  { icon: '✨', text: 'Generative AI' },
  { icon: '☁️', text: 'AWS' },
  { icon: '🌐', text: 'Google Cloud' },
  { icon: '🐍', text: 'Python' },
  { icon: '🐹', text: 'Go' },
  { icon: '📘', text: 'TypeScript' },
  { icon: '☕', text: 'Java' },
  { icon: '🟢', text: 'Node.js' },
  { icon: '🗃️', text: 'SQL' },
  { icon: '📡', text: 'Apache Kafka' },
  { icon: '🌊', text: 'Airflow' },
  { icon: '⚡', text: 'Redis' },
  { icon: '🐳', text: 'Docker' },
  { icon: '☸️', text: 'Kubernetes' },
  { icon: '🏗️', text: 'Terraform' },
  { icon: '🧪', text: 'MLFlow' },
  { icon: '📊', text: 'Grafana' },
  { icon: '🐶', text: 'Datadog' },
  { icon: '⚙️', text: 'Microservices' },
  { icon: '🔍', text: 'Semantic Search' },
]

export default function Hero() {
  const [isResumeOpen, setIsResumeOpen] = useState(false)

  return (
    <>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-10 sm:pb-12">

        {/* ── Profile row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 mb-7">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
            <Image
              src="/resources/profile.jpg"
              alt="Ajay Tewari"
              fill
              className="rounded-full object-cover object-top border-2 border-border"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-accent tracking-widest uppercase mb-1">Hi, I&apos;m</p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1">Ajay Tewari</h1>
            <p className="text-xs text-accent/80 tracking-wide uppercase mb-2">
              Technical Lead · AI &amp; Distributed Systems
            </p>
            <p className="text-sm text-muted leading-relaxed max-w-[560px]">
              Designing cloud-native microservices, large-scale distributed systems, and AI pipelines on AWS &amp; GCP.
              Expertise in agentic AI, semantic search, and conversational AI.
            </p>
          </div>

          {/* Action buttons — desktop right-aligned */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsResumeOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-white transition-opacity hover:opacity-[0.88] cursor-pointer border-0"
            >
              View Resume
            </button>
            <a
              href="/resources/Ajay_Tewari_Portfolio.pdf"
              download
              className="px-4 py-2 rounded-lg text-sm font-medium no-underline border border-border text-muted hover:text-text hover:bg-surface transition-colors"
            >
              Download ↓
            </a>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
              <span className="text-sm font-bold text-accent">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Skills ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SKILLS.map(s => (
            <span
              key={s.text}
              className="flex items-center gap-1.5 text-xs text-muted bg-surface border border-border rounded-full px-3 py-1"
            >
              <span>{s.icon}</span>
              {s.text}
            </span>
          ))}
        </div>

        {/* ── Action buttons — mobile only ── */}
        <div className="flex sm:hidden gap-3 flex-wrap">
          <button
            onClick={() => setIsResumeOpen(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-white transition-opacity hover:opacity-[0.88] cursor-pointer border-0"
          >
            View Resume
          </button>
          <a
            href="/resources/Ajay_Tewari_Portfolio.pdf"
            download
            className="px-5 py-2.5 rounded-lg text-sm font-medium no-underline border border-border text-muted hover:text-text hover:bg-surface transition-colors"
          >
            Download ↓
          </a>
          <a
            href="#projects"
            className="px-5 py-2.5 rounded-lg text-sm font-medium no-underline border border-border text-muted hover:text-text hover:bg-surface transition-colors"
          >
            View Projects
          </a>
        </div>

        {/* ── View Projects — desktop only ── */}
        <div className="hidden sm:flex gap-3">
          <a
            href="#projects"
            className="px-5 py-2.5 rounded-lg text-sm font-medium no-underline border border-border text-muted hover:text-text hover:bg-surface transition-colors"
          >
            View Projects ↓
          </a>
          <a href="https://github.com/atewari-bot" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium no-underline border border-border text-muted hover:text-accent hover:border-accent transition-colors">
            🐙 GitHub
          </a>
          <a href="https://linkedin.com/in/ajaytewari" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium no-underline border border-border text-muted hover:text-accent hover:border-accent transition-colors">
            💼 LinkedIn
          </a>
        </div>
      </div>

      {/* ── Resume modal ── */}
      {isResumeOpen && (
        <div
          className="fixed inset-0 bg-green-950/80 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setIsResumeOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[92vh] sm:h-[90vh] bg-green-600 rounded-lg overflow-hidden"
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
