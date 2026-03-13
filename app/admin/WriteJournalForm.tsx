'use client'

import { useState, useEffect, useCallback } from 'react'

type Category = 'note' | 'coding' | 'sports'

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'note',   label: 'Note',   color: '#a78bfa' },
  { value: 'coding', label: 'Coding', color: '#4d8fd4' },
  { value: 'sports', label: 'Sports', color: '#22c55e' },
]

const CATEGORY_COLOR: Record<string, string> = {
  note:   '#a78bfa',
  coding: '#4d8fd4',
  sports: '#22c55e',
}

interface EntryRow {
  id: number
  title: string
  body: string | null
  category: string
  tags: string | null
  created_at: string
}

function rel(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WriteJournalForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen]         = useState(false)
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [tags, setTags]         = useState('')
  const [category, setCategory] = useState<Category>('note')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const [entries, setEntries]   = useState<EntryRow[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal?source=manual&page=1&pageSize=100')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries.map((e: { id: string; title: string; body?: string; category: string; tags?: string[]; timestamp: string }) => ({
          id: parseInt(e.id.replace('manual-', ''), 10),
          title: e.title,
          body: e.body ?? null,
          category: e.category,
          tags: e.tags?.join(', ') ?? null,
          created_at: e.timestamp,
        })))
      }
    } catch { /* */ }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category, tags: tags.trim() }),
      })
      if (!res.ok) { setError('Failed to save entry'); return }
      setTitle(''); setBody(''); setTags(''); setCategory('note')
      setOpen(false)
      loadEntries()
      onCreated?.()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== id))
        onCreated?.()
      }
    } catch { /* */ } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Write Journal</h2>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-muted hover:text-text hover:border-accent transition-colors"
        >
          {open ? 'Collapse ↑' : 'New Entry +'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Category selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                style={{
                  background: category === c.value ? `${c.color}20` : 'none',
                  border: `1px solid ${category === c.value ? c.color : '#30363d'}`,
                  borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                  color: category === c.value ? c.color : '#8b949e', fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title *"
            maxLength={200}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
          />

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Body (optional)"
            rows={4}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors resize-y font-[inherit]"
          />

          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setOpen(false)}
              className="text-xs px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? 'Saving…' : 'Publish Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Existing entries list */}
      {entries.length > 0 && (
        <div style={{ borderTop: '1px solid #21262d', paddingTop: 12 }}>
          <p style={{ fontSize: 11, color: '#8b949e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Entries ({entries.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 280, overflowY: 'auto' }}>
            {entries.map(entry => {
              const color = CATEGORY_COLOR[entry.category] ?? '#8b949e'
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 6,
                    background: '#0d1117', border: '1px solid #21262d',
                  }}
                >
                  {/* Category dot */}
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />

                  {/* Category badge */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, color, background: `${color}18`,
                    border: `1px solid ${color}30`, borderRadius: 99, padding: '1px 6px',
                    flexShrink: 0,
                  }}>
                    {entry.category}
                  </span>

                  {/* Title */}
                  <span style={{
                    fontSize: 12, color: '#e6edf3', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={entry.title}>
                    {entry.title}
                  </span>

                  {/* Timestamp */}
                  <span style={{ fontSize: 11, color: '#8b949e', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {rel(entry.created_at)}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    title="Delete entry"
                    style={{
                      background: 'none', border: 'none', cursor: deletingId === entry.id ? 'not-allowed' : 'pointer',
                      color: '#8b949e', fontSize: 13, padding: '2px 4px', borderRadius: 4,
                      flexShrink: 0, lineHeight: 1, opacity: deletingId === entry.id ? 0.4 : 1,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { if (deletingId !== entry.id) (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8b949e' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
