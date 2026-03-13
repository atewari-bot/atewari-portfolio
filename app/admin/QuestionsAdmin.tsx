'use client'

import { useState } from 'react'

interface Question {
  id: number
  question: string
  visitor_name: string | null
  created_at: string
  answered: number
  answer: string | null
}

function rel(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function QuestionsAdmin({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [answerText, setAnswerText] = useState<Record<number, string>>({})
  const [answering, setAnswering]   = useState<Set<number>>(new Set())
  const [deleting, setDeleting]     = useState<Set<number>>(new Set())

  const handleAnswer = async (id: number) => {
    const text = answerText[id]?.trim()
    if (!text) return
    setAnswering(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: text }),
      })
      if (res.ok) {
        setQuestions(prev => prev.map(q =>
          q.id === id ? { ...q, answered: 1, answer: text } : q
        ))
        setAnswerText(prev => { const n = { ...prev }; delete n[id]; return n })
      }
    } finally {
      setAnswering(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question?')) return
    setDeleting(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id))
    } finally {
      setDeleting(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const unanswered = questions.filter(q => !q.answered)
  const answered   = questions.filter(q =>  q.answered)

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Visitor Questions</h2>
        <span className="text-xs text-muted">{unanswered.length} pending · {answered.length} answered</span>
      </div>

      {!questions.length ? (
        <p className="text-muted text-sm px-5 py-6 text-center">No questions yet.</p>
      ) : (
        <div>
          {/* Unanswered first */}
          {unanswered.map(q => (
            <div key={q.id} className="px-5 py-4 border-b border-border">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm text-text font-medium">{q.question}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {q.visitor_name ?? 'Anonymous'} · {rel(q.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deleting.has(q.id)}
                  className="text-xs text-red-400 hover:text-red-300 shrink-0 transition-colors"
                >
                  {deleting.has(q.id) ? '…' : 'Delete'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={answerText[q.id] ?? ''}
                  onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Write your answer…"
                  onKeyDown={e => { if (e.key === 'Enter') handleAnswer(q.id) }}
                  className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={() => handleAnswer(q.id)}
                  disabled={answering.has(q.id) || !answerText[q.id]?.trim()}
                  className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {answering.has(q.id) ? '…' : 'Answer'}
                </button>
              </div>
            </div>
          ))}

          {/* Answered */}
          {answered.map(q => (
            <div key={q.id} className="px-5 py-3 border-b border-border opacity-60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted truncate">Q: {q.question}</p>
                  <p className="text-xs text-green-400 mt-0.5 truncate">A: {q.answer}</p>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deleting.has(q.id)}
                  className="text-xs text-muted hover:text-red-400 shrink-0 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
