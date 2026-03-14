'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { JournalEntry } from '@/lib/journal'
import { relativeTime } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function entryDate(iso: string): { day: string; date: string; tz: string } {
  const d = new Date(iso)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    day:  d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    tz,
  }
}

const SOURCE_LABEL: Record<string, string> = {
  github_push:   'push',
  github_pr:     'pr',
  github_create: 'repo',
  strava:        'run',
  manual:        'note',
}

const CATEGORY_COLOR: Record<string, string> = {
  coding:     '#4d8fd4',
  sports:     '#22c55e',
  note:       '#a78bfa',
  mindspace:  '#f59e0b',
}

// ─── Compact entry row ────────────────────────────────────────────────────────

interface EntryRowProps {
  entry: JournalEntry
  visitorId: number | null
  onReact: (entryId: string, reaction: 'like' | 'dislike') => void
}

function EntryRow({ entry, visitorId, onReact }: EntryRowProps) {
  const color  = CATEGORY_COLOR[entry.category] ?? '#8b949e'
  const repo   = entry.repo?.split('/')[1] ?? ''
  const { day, date, tz } = entryDate(entry.timestamp)

  return (
    <div className="j-entry-row" style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      alignItems: 'center',
      gap: 12,
      padding: '8px 14px',
      borderBottom: '1px solid #21262d',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#161b22')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Left: badge + repo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {/* Category dot */}
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />

        {/* Source badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, color, background: `${color}18`,
          border: `1px solid ${color}30`, borderRadius: 99, padding: '1px 7px',
          flexShrink: 0, letterSpacing: '0.03em',
        }}>
          {SOURCE_LABEL[entry.source] ?? entry.source}
        </span>

        {/* Repo */}
        {repo && (
          <a href={entry.repoUrl} target="_blank" rel="noopener noreferrer" style={{
            fontSize: 11, color: '#8b949e', textDecoration: 'none', flexShrink: 0,
            fontFamily: 'monospace', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#4d8fd4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
          >
            {repo}
          </a>
        )}
        {repo && <span style={{ color: '#30363d', fontSize: 11, flexShrink: 0 }}>·</span>}

        {/* Title */}
        {entry.url ? (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{
            fontSize: 12, color: '#e6edf3', textDecoration: 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#4d8fd4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#e6edf3')}
            title={entry.title}
          >
            {entry.title}
          </a>
        ) : (
          <span style={{
            fontSize: 12, color: '#e6edf3',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} title={entry.title}>
            {entry.title}
          </span>
        )}

        {/* Tags */}
        {entry.tags?.map(t => (
          <span key={t} style={{
            fontSize: 10, color: '#8b949e', background: '#21262d',
            borderRadius: 4, padding: '1px 6px', flexShrink: 0,
          }}>#{t}</span>
        ))}
      </div>

      {/* Date column — hidden on mobile via CSS */}
      <div className="j-date-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, paddingRight: 12 }}>
        <span style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>{day} · {date}</span>
        <span style={{ fontSize: 11, color: '#6e7681', whiteSpace: 'nowrap' }}>{tz}</span>
      </div>

      {/* Right: relative time + reactions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span className="j-rel-time" style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>{relativeTime(entry.timestamp)}</span>

        {/* Like */}
        <button
          onClick={() => visitorId && onReact(entry.id, 'like')}
          title={visitorId ? 'Like' : 'Sign in to react'}
          style={{
            background: 'none', border: 'none', cursor: visitorId ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px',
            borderRadius: 4, color: entry.userReaction === 'like' ? '#22c55e' : '#8b949e',
            fontSize: 12, transition: 'color 0.15s', minHeight: 32,
          }}
          onMouseEnter={e => { if (visitorId) (e.currentTarget as HTMLButtonElement).style.color = '#22c55e' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = entry.userReaction === 'like' ? '#22c55e' : '#8b949e' }}
        >
          <span style={{ fontSize: 13 }}>👍</span>
          {entry.likes > 0 && <span>{entry.likes}</span>}
        </button>

        {/* Dislike */}
        <button
          onClick={() => visitorId && onReact(entry.id, 'dislike')}
          title={visitorId ? 'Dislike' : 'Sign in to react'}
          style={{
            background: 'none', border: 'none', cursor: visitorId ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px',
            borderRadius: 4, color: entry.userReaction === 'dislike' ? '#f87171' : '#8b949e',
            fontSize: 12, transition: 'color 0.15s', minHeight: 32,
          }}
          onMouseEnter={e => { if (visitorId) (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = entry.userReaction === 'dislike' ? '#f87171' : '#8b949e' }}
        >
          <span style={{ fontSize: 13 }}>👎</span>
          {entry.dislikes > 0 && <span>{entry.dislikes}</span>}
        </button>
      </div>
    </div>
  )
}

// ─── Mindspace entry row (expandable) ────────────────────────────────────────

function MindspaceEntryRow({ entry, visitorId, onReact }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false)
  const color = CATEGORY_COLOR[entry.category] ?? '#8b949e'
  const { day, date, tz } = entryDate(entry.timestamp)
  const tags = entry.tags ?? []

  return (
    <div style={{
      borderBottom: '1px solid #21262d',
      transition: 'background 0.15s',
      background: expanded ? '#0d1117' : 'transparent',
    }}>
      {/* ── Header row (always visible) ── */}
      <div
        className="j-entry-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: 12,
          padding: '8px 14px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(v => !v)}
        onMouseEnter={e => { if (!expanded) (e.currentTarget.style.background = '#161b22') }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget.style.background = 'transparent') }}
      >
        {/* Left: chevron + badge + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: 9, color: '#8b949e', flexShrink: 0,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s', display: 'inline-block',
          }}>▶</span>

          <span style={{
            fontSize: 10, fontWeight: 700, color, background: `${color}18`,
            border: `1px solid ${color}30`, borderRadius: 99, padding: '1px 7px',
            flexShrink: 0, letterSpacing: '0.03em',
          }}>
            {entry.category}
          </span>

          <span style={{
            fontSize: 12, color: '#e6edf3',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} title={entry.title}>
            {entry.title}
          </span>
        </div>

        {/* Date column — hidden on mobile via CSS */}
        <div className="j-date-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, paddingRight: 12 }}>
          <span style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>{day} · {date}</span>
          <span style={{ fontSize: 11, color: '#6e7681', whiteSpace: 'nowrap' }}>{tz}</span>
        </div>

        {/* Right: time + reactions — stop propagation so clicks don't toggle expand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <span className="j-rel-time" style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>{relativeTime(entry.timestamp)}</span>

          <button
            onClick={() => visitorId && onReact(entry.id, 'like')}
            title={visitorId ? 'Like' : 'Sign in to react'}
            style={{
              background: 'none', border: 'none', cursor: visitorId ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px',
              borderRadius: 4, color: entry.userReaction === 'like' ? '#22c55e' : '#8b949e',
              fontSize: 12, transition: 'color 0.15s', minHeight: 32,
            }}
            onMouseEnter={e => { if (visitorId) (e.currentTarget as HTMLButtonElement).style.color = '#22c55e' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = entry.userReaction === 'like' ? '#22c55e' : '#8b949e' }}
          >
            <span style={{ fontSize: 13 }}>👍</span>
            {entry.likes > 0 && <span>{entry.likes}</span>}
          </button>

          <button
            onClick={() => visitorId && onReact(entry.id, 'dislike')}
            title={visitorId ? 'Dislike' : 'Sign in to react'}
            style={{
              background: 'none', border: 'none', cursor: visitorId ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px',
              borderRadius: 4, color: entry.userReaction === 'dislike' ? '#f87171' : '#8b949e',
              fontSize: 12, transition: 'color 0.15s', minHeight: 32,
            }}
            onMouseEnter={e => { if (visitorId) (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = entry.userReaction === 'dislike' ? '#f87171' : '#8b949e' }}
          >
            <span style={{ fontSize: 13 }}>👎</span>
            {entry.dislikes > 0 && <span>{entry.dislikes}</span>}
          </button>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #21262d',
          padding: '14px 20px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* Full title */}
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e6edf3', lineHeight: 1.4 }}>
            {entry.title}
          </p>

          {/* Body */}
          {entry.body ? (
            <p style={{
              margin: 0, fontSize: 13, color: '#c9d1d9',
              lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {entry.body}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#484f58', fontStyle: 'italic' }}>No body text.</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {tags.map(t => (
                <span key={t} style={{
                  fontSize: 10, color: '#8b949e', background: '#161b22',
                  border: '1px solid #30363d', borderRadius: 99, padding: '2px 8px',
                }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Full timestamp */}
          <p style={{ margin: 0, fontSize: 11, color: '#484f58' }}>
            {new Date(entry.timestamp).toLocaleString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
              year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}{' '}· {tz}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface PageData {
  entries: JournalEntry[]
  total: number
  page: number
  pageSize: number
}

const PAGE_SIZES = [10, 20, 50]

type Tab = 'feed' | 'mindspace'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed',      label: 'Feed',      icon: '⚡' },
  { id: 'mindspace', label: 'Mindspace', icon: '🧠' },
]

export default function JournalSection() {
  const [tab, setTab]           = useState<Tab>('feed')
  const [data, setData]         = useState<PageData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [refreshing, setRefreshing] = useState(false)
  const visitorIdRef = useRef<number | null>(null)

  // Read visitor ID from sessionStorage (set by VisitorModal)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pv_session')
      if (raw) visitorIdRef.current = JSON.parse(raw).id ?? null
    } catch { /* */ }
  }, [])

  const load = useCallback(async (p: number, ps: number, t: Tab, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const vid = visitorIdRef.current
      const params = new URLSearchParams({ page: String(p), pageSize: String(ps) })
      if (vid) params.set('visitorId', String(vid))
      if (t === 'mindspace') params.set('source', 'manual')
      const res = await fetch(`/api/journal?${params}`)
      if (res.ok) setData(await res.json())
    } catch { /* */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load(page, pageSize, tab) }, [load, page, pageSize, tab])

  // Reset to page 1 when switching tabs
  useEffect(() => { setPage(1); setData(null) }, [tab])

  const handleReact = useCallback(async (entryId: string, reaction: 'like' | 'dislike') => {
    const vid = visitorIdRef.current
    if (!vid) return
    // Optimistic update
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        entries: prev.entries.map(e => {
          if (e.id !== entryId) return e
          const wasLiked    = e.userReaction === 'like'
          const wasDisliked = e.userReaction === 'dislike'
          const toggle      = e.userReaction === reaction
          return {
            ...e,
            likes:    reaction === 'like'    ? e.likes    + (toggle ? -1 : wasLiked    ? 0 : 1) : e.likes    - (wasLiked    ? 1 : 0),
            dislikes: reaction === 'dislike' ? e.dislikes + (toggle ? -1 : wasDisliked ? 0 : 1) : e.dislikes - (wasDisliked ? 1 : 0),
            userReaction: toggle ? null : reaction,
          }
        }),
      }
    })
    // Server update
    try {
      const res = await fetch('/api/journal/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, reaction, visitorId: vid }),
      })
      if (res.ok) {
        const counts = await res.json()
        setData(prev => prev ? {
          ...prev,
          entries: prev.entries.map(e => e.id === entryId ? { ...e, ...counts } : e),
        } : prev)
      }
    } catch { /* */ }
  }, [])

  const total     = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section id="journal" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-12">

      {/* Header */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-4 mb-5">
        <h2 className="text-xl sm:text-2xl font-bold">Journal</h2>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 2, background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 3 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? '#4d8fd4' : 'none',
                border: 'none', borderRadius: 6,
                padding: '4px 12px', cursor: 'pointer',
                color: tab === t.id ? '#fff' : '#8b949e',
                fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 h-px bg-border" />

        {/* Sources (feed only) */}
        {tab === 'feed' && (
          <div className="j-sources" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sources:</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#4d8fd4',
              background: 'rgba(77,143,212,0.1)', border: '1px solid rgba(77,143,212,0.25)',
              borderRadius: 99, padding: '2px 8px',
            }}>● GitHub</span>
            <span style={{
              fontSize: 10, color: '#8b949e', background: '#161b22',
              border: '1px solid #30363d', borderRadius: 99, padding: '2px 8px',
            }}>○ Strava <span style={{ opacity: 0.5 }}>soon</span></span>
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={() => load(page, pageSize, tab, true)}
          disabled={refreshing}
          style={{
            background: 'none', border: '1px solid #30363d', borderRadius: 6,
            padding: '3px 9px', cursor: refreshing ? 'not-allowed' : 'pointer',
            color: '#8b949e', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
            opacity: refreshing ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!refreshing) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#4d8fd4'; (e.currentTarget as HTMLButtonElement).style.color = '#4d8fd4' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d'; (e.currentTarget as HTMLButtonElement).style.color = '#8b949e' }}
        >
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>↺</span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Feed table */}
      <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 10, overflow: 'hidden' }}>

        {/* Column header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
          padding: '6px 14px', borderBottom: '1px solid #30363d',
          background: '#161b22',
        }}>
          <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entry</span>
          <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em', paddingRight: 12 }}>Date</span>
          <span style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time · Reactions</span>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid #21262d' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#21262d' }} />
                <div style={{ width: 50, height: 14, background: '#21262d', borderRadius: 99 }} />
                <div style={{ width: 70, height: 14, background: '#21262d', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 14, background: '#21262d', borderRadius: 4 }} />
                <div style={{ width: 30, height: 12, background: '#21262d', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : !data?.entries.length ? (
          <div style={{ padding: '40px 32px', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
            {tab === 'mindspace'
              ? <><div style={{ fontSize: 28, marginBottom: 10 }}>🧠</div><div>No mindspace entries yet.</div></>
              : 'No entries found.'
            }
          </div>
        ) : (
          data.entries.map(entry =>
            tab === 'mindspace' ? (
              <MindspaceEntryRow
                key={entry.id}
                entry={entry}
                visitorId={visitorIdRef.current}
                onReact={handleReact}
              />
            ) : (
              <EntryRow
                key={entry.id}
                entry={entry}
                visitorId={visitorIdRef.current}
                onReact={handleReact}
              />
            )
          )
        )}
      </div>

      {/* Footer: page size + pagination */}
      {!loading && total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>

          {/* Page size selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8b949e' }}>
            <span>Show</span>
            {PAGE_SIZES.map(ps => (
              <button key={ps} onClick={() => { setPageSize(ps); setPage(1) }} style={{
                background: ps === pageSize ? 'rgba(77,143,212,0.15)' : 'none',
                border: `1px solid ${ps === pageSize ? '#4d8fd4' : '#30363d'}`,
                borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                color: ps === pageSize ? '#4d8fd4' : '#8b949e', fontSize: 11,
              }}>
                {ps}
              </button>
            ))}
            <span>of {total}</span>
          </div>

          {/* Page navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PagBtn label="«" disabled={page === 1} onClick={() => setPage(1)} />
            <PagBtn label="‹" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
            {getPageRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} style={{ color: '#8b949e', padding: '0 2px', fontSize: 11 }}>…</span>
              ) : (
                <PagBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(Number(p))} />
              )
            )}
            <PagBtn label="›" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
            <PagBtn label="»" disabled={page === totalPages} onClick={() => setPage(totalPages)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .j-entry-row { grid-template-columns: 1fr auto !important; }
          .j-date-col  { display: none !important; }
          .j-sources   { display: none !important; }
          .j-rel-time  { display: none !important; }
        }
      `}</style>
    </section>
  )
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

function PagBtn({ label, disabled, active, onClick }: {
  label: string; disabled?: boolean; active?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? 'rgba(77,143,212,0.15)' : 'none',
        border: `1px solid ${active ? '#4d8fd4' : '#30363d'}`,
        borderRadius: 4, padding: '2px 7px', cursor: disabled ? 'default' : 'pointer',
        color: active ? '#4d8fd4' : disabled ? '#30363d' : '#8b949e', fontSize: 11,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  )
}

function getPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = []
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', total)
  } else if (current >= total - 3) {
    pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '…', current - 1, current, current + 1, '…', total)
  }
  return pages
}
