'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { relativeTime } from '@/lib/utils'

interface Question {
  id: number
  question: string
  visitor_name: string | null
  created_at: string
  answered: number
  answer: string | null
}

// ─── Answer overlay ───────────────────────────────────────────────────────────

function AnswerOverlay({ question, onClose }: { question: Question; onClose: () => void }) {
  // Close on Escape or backdrop click
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1a1f2e, #0d1117)',
          border: '1px solid rgba(77,143,212,0.2)',
          borderRadius: 16, padding: 'clamp(16px, 5vw, 28px)',
          maxWidth: 560, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8b949e', fontSize: 18, lineHeight: 1, padding: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
        >
          ✕
        </button>

        {/* Top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, #1e3a5f, #4d8fd4, #1e3a5f)', borderRadius: 99, marginBottom: 20 }} />

        {/* Question */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Question</p>
          <p style={{ margin: 0, fontSize: 15, color: '#e6edf3', fontWeight: 600, lineHeight: 1.5 }}>{question.question}</p>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#8b949e' }}>
            {question.visitor_name ? `— ${question.visitor_name}` : '— Anonymous'} · {relativeTime(question.created_at)}
          </p>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18 }} />

        {/* Answer */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 10, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Answer</p>
          <p style={{ margin: 0, fontSize: 14, color: '#e6edf3', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{question.answer}</p>
        </div>

        <p style={{ margin: '18px 0 0', fontSize: 11, color: '#8b949e', textAlign: 'center' }}>
          Press <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #30363d', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  )
}

// ─── Question row ─────────────────────────────────────────────────────────────

function QuestionRow({ q, onExpand }: { q: Question; onExpand: () => void }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      borderBottom: '1px solid #21262d',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#161b22')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ minWidth: 0 }}>
        {/* Question */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: q.answered ? '#22c55e' : '#8b949e',
            background: q.answered ? 'rgba(34,197,94,0.1)' : 'rgba(139,148,158,0.1)',
            border: `1px solid ${q.answered ? 'rgba(34,197,94,0.3)' : '#30363d'}`,
            borderRadius: 99, padding: '1px 7px', flexShrink: 0,
          }}>
            {q.answered ? 'answered' : 'pending'}
          </span>
          <span style={{
            fontSize: 12, color: '#e6edf3',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} title={q.question}>
            {q.question}
          </span>
        </div>

        {/* Answer preview — one line */}
        {q.answered && q.answer && (
          <p style={{
            margin: '3px 0 0 0', fontSize: 11, color: '#22c55e',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            paddingLeft: 0,
          }} title={q.answer}>
            A: {q.answer}
          </p>
        )}
        {!q.answered && (
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#30363d', fontStyle: 'italic', paddingLeft: 0 }}>
            Awaiting answer…
          </p>
        )}
      </div>

      {/* Right: timestamp + expand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#8b949e' }}>{relativeTime(q.created_at)}</span>
        {q.answered && (
          <button
            onClick={onExpand}
            title="View full answer"
            style={{
              background: 'none', border: '1px solid #30363d', borderRadius: 4,
              padding: '2px 7px', cursor: 'pointer', color: '#8b949e', fontSize: 10,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#4d8fd4'; (e.currentTarget as HTMLButtonElement).style.color = '#4d8fd4' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d'; (e.currentTarget as HTMLButtonElement).style.color = '#8b949e' }}
          >
            Read ↗
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page size + pagination helpers ──────────────────────────────────────────

const PAGE_SIZES = [5, 10, 20]

function PagBtn({ label, disabled, active, onClick }: {
  label: string; disabled?: boolean; active?: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: active ? 'rgba(77,143,212,0.15)' : 'none',
      border: `1px solid ${active ? '#4d8fd4' : '#30363d'}`,
      borderRadius: 4, padding: '2px 7px', cursor: disabled ? 'default' : 'pointer',
      color: active ? '#4d8fd4' : disabled ? '#30363d' : '#8b949e',
      fontSize: 11, opacity: disabled ? 0.4 : 1,
    }}>
      {label}
    </button>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function QuestionsSection() {
  const [questions, setQuestions]   = useState<Question[]>([])
  const [loading, setLoading]       = useState(true)
  const [text, setText]             = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(5)
  const [overlay, setOverlay]       = useState<Question | null>(null)
  const visitorIdRef   = useRef<number | null>(null)
  const visitorNameRef = useRef<string>('')

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pv_session')
      if (raw) {
        const s = JSON.parse(raw)
        visitorIdRef.current   = s.id   ?? null
        visitorNameRef.current = s.name ?? ''
      }
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
        setPage(1)
        setTimeout(() => setSubmitted(false), 4000)
        loadQuestions()
      }
    } catch { /* */ } finally {
      setSubmitting(false)
    }
  }

  // Answered first, then unanswered — newest first within each group
  const sorted = [
    ...questions.filter(q =>  q.answered),
    ...questions.filter(q => !q.answered),
  ]
  const total      = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const visible    = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section id="questions" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-12">
      <div className="flex items-baseline gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Ask a Question</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ask form */}
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '20px', alignSelf: 'start' }}>
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
              <span style={{ fontSize: 11, color: '#8b949e' }}>
                {visitorNameRef.current
                  ? <>as <strong style={{ color: '#4d8fd4' }}>{visitorNameRef.current}</strong> · </>
                  : null}
                {text.length}/500
              </span>
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                style={{
                  background: text.trim() ? 'linear-gradient(135deg, #1e3a5f, #4d8fd4)' : 'none',
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

        {/* Q&A list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{
            background: '#0d1117', border: '1px solid #30363d', borderRadius: 10, overflow: 'hidden',
          }}>
            {/* Column header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
              padding: '6px 14px', borderBottom: '1px solid #30363d', background: '#161b22',
            }}>
              <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Question {total > 0 && `· ${total} total`}
              </span>
              <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>When</span>
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>Loading…</div>
            ) : !questions.length ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
                No questions yet — be the first!
              </div>
            ) : (
              visible.map(q => (
                <QuestionRow key={q.id} q={q} onExpand={() => setOverlay(q)} />
              ))
            )}
          </div>

          {/* Footer: page size + pagination */}
          {!loading && total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8b949e' }}>
                <span>Show</span>
                {PAGE_SIZES.map(ps => (
                  <button key={ps} onClick={() => { setPageSize(ps); setPage(1) }} style={{
                    background: ps === pageSize ? 'rgba(77,143,212,0.15)' : 'none',
                    border: `1px solid ${ps === pageSize ? '#4d8fd4' : '#30363d'}`,
                    borderRadius: 4, padding: '2px 7px', cursor: 'pointer',
                    color: ps === pageSize ? '#4d8fd4' : '#8b949e', fontSize: 11,
                  }}>{ps}</button>
                ))}
                <span>of {total}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PagBtn label="‹" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1
                    : page <= 3 ? i + 1
                    : page >= totalPages - 2 ? totalPages - 4 + i
                    : page - 2 + i
                  return <PagBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(p)} />
                })}
                <PagBtn label="›" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer overlay */}
      {overlay && <AnswerOverlay question={overlay} onClose={() => setOverlay(null)} />}
    </section>
  )
}
