'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

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
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function QuestionsSection() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const visitorIdRef   = useRef<number | null>(null)
  const visitorNameRef = useRef<string>('')

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pv_session')
      if (raw) {
        const s = JSON.parse(raw)
        visitorIdRef.current = s.id ?? null
      }
      // Also try to get display name from another key if stored
    } catch { /* */ }
  }, [])

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/questions')
      if (res.ok) setQuestions(await res.json())
    } catch { /* */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text.trim(),
          visitorId: visitorIdRef.current,
          visitorName: visitorNameRef.current || null,
        }),
      })
      if (res.ok) {
        setText('')
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 4000)
        loadQuestions()
      }
    } catch { /* */ } finally {
      setSubmitting(false)
    }
  }

  const unanswered = questions.filter(q => !q.answered)
  const answered   = questions.filter(q =>  q.answered)

  return (
    <section id="questions" className="max-w-[1100px] mx-auto px-8 py-12">
      <div className="flex items-baseline gap-4 mb-6">
        <h2 className="text-2xl font-bold">Ask a Question</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ask form */}
        <div>
          <div style={{
            background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '20px',
          }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#8b949e' }}>
              Curious about something? Ask away — I&apos;ll do my best to answer.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type your question here…"
                maxLength={500}
                rows={3}
                disabled={submitting}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid #30363d',
                  borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e6edf3',
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit', width: '100%',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(77,143,212,0.6)')}
                onBlur={e =>  (e.target.style.borderColor = '#30363d')}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{text.length}/500</span>
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  style={{
                    background: text.trim() ? 'linear-gradient(135deg, #1e3a5f, #4d8fd4)' : '#161b22',
                    border: '1px solid rgba(77,143,212,0.4)', borderRadius: 7,
                    padding: '7px 18px', cursor: submitting || !text.trim() ? 'not-allowed' : 'pointer',
                    color: text.trim() ? '#e6edf3' : '#8b949e', fontSize: 12, fontWeight: 600,
                    opacity: submitting ? 0.6 : 1, transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'Posting…' : 'Post Question'}
                </button>
              </div>
            </form>
            {submitted && (
              <p style={{ margin: '10px 0 0', fontSize: 12, color: '#22c55e' }}>
                ✓ Question posted — I&apos;ll get back to you!
              </p>
            )}
          </div>
        </div>

        {/* Q&A list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: '#8b949e', fontSize: 13, padding: 8 }}>Loading…</div>
          ) : !questions.length ? (
            <div style={{
              background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
              padding: '24px', textAlign: 'center', color: '#8b949e', fontSize: 13,
            }}>
              No questions yet — be the first!
            </div>
          ) : (
            <>
              {/* Answered */}
              {answered.map(q => (
                <div key={q.id} style={{
                  padding: '10px 14px', borderBottom: '1px solid #21262d',
                  background: '#0d1117',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#e6edf3', fontWeight: 500 }}>
                      Q: {q.question}
                    </p>
                    <span style={{ fontSize: 10, color: '#8b949e', flexShrink: 0 }}>{rel(q.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#22c55e', paddingLeft: 8, borderLeft: '2px solid #22c55e' }}>
                    A: {q.answer}
                  </p>
                  {q.visitor_name && (
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: '#8b949e' }}>— {q.visitor_name}</p>
                  )}
                </div>
              ))}

              {/* Unanswered */}
              {unanswered.map(q => (
                <div key={q.id} style={{
                  padding: '10px 14px', borderBottom: '1px solid #21262d',
                  background: '#0d1117',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#8b949e' }}>
                      Q: {q.question}
                    </p>
                    <span style={{ fontSize: 10, color: '#8b949e', flexShrink: 0 }}>{rel(q.created_at)}</span>
                  </div>
                  {q.visitor_name && (
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: '#8b949e' }}>— {q.visitor_name}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#30363d', fontStyle: 'italic' }}>
                    Awaiting answer…
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
