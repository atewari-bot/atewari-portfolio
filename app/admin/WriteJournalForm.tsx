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
  id:         number
  title:      string
  body:       string | null
  category:   string
  tags:       string | null
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

// ─── Write form (top section) ─────────────────────────────────────────────────

function NewEntryForm({ onCreated }: { onCreated: () => void }) {
  const [open,     setOpen]     = useState(false)
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [tags,     setTags]     = useState('')
  const [category, setCategory] = useState<Category>('note')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: title.trim(), body: body.trim(), category, tags: tags.trim() }),
      })
      if (!res.ok) { setError('Failed to save entry'); return }
      setTitle(''); setBody(''); setTags(''); setCategory('note'); setOpen(false)
      onCreated()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Write Journal</h2>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-muted hover:text-text hover:border-accent transition-colors"
        >
          {open ? 'Collapse ↑' : 'New Entry +'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} style={{
                background: category === c.value ? `${c.color}20` : 'none',
                border: `1px solid ${category === c.value ? c.color : '#30363d'}`,
                borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                color: category === c.value ? c.color : '#8b949e', fontSize: 12, fontWeight: 600,
              }}>
                {c.label}
              </button>
            ))}
          </div>

          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Title *" maxLength={200}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors" />

          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Body (optional)" rows={3}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors resize-y font-[inherit]" />

          <input type="text" value={tags} onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors" />

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
    </div>
  )
}

// ─── Inline edit form ─────────────────────────────────────────────────────────

function EditRow({ entry, onSave, onCancel }: {
  entry:    EntryRow
  onSave:   () => void
  onCancel: () => void
}) {
  const [title,    setTitle]    = useState(entry.title)
  const [body,     setBody]     = useState(entry.body ?? '')
  const [tags,     setTags]     = useState(entry.tags ?? '')
  const [category, setCategory] = useState<Category>(entry.category as Category)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/journal/${entry.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: title.trim(), body: body.trim(), category, tags: tags.trim() }),
      })
      if (!res.ok) { setError('Failed to save'); return }
      onSave()
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{
      background: '#0d1117', border: '1px solid #4d8fd4',
      borderRadius: 8, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {CATEGORIES.map(c => (
          <button key={c.value} type="button" onClick={() => setCategory(c.value)} style={{
            background: category === c.value ? `${c.color}20` : 'none',
            border: `1px solid ${category === c.value ? c.color : '#30363d'}`,
            borderRadius: 6, padding: '2px 10px', cursor: 'pointer',
            color: category === c.value ? c.color : '#8b949e', fontSize: 11, fontWeight: 600,
          }}>
            {c.label}
          </button>
        ))}
      </div>

      <input type="text" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Title *"
        style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: 6,
          padding: '6px 10px', fontSize: 13, color: '#e6edf3', outline: 'none', width: '100%',
          boxSizing: 'border-box',
        }} />

      <textarea value={body} onChange={e => setBody(e.target.value)}
        placeholder="Body (optional)" rows={4}
        style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: 6,
          padding: '6px 10px', fontSize: 13, color: '#e6edf3', outline: 'none',
          width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
          boxSizing: 'border-box',
        }} />

      <input type="text" value={tags} onChange={e => setTags(e.target.value)}
        placeholder="Tags (comma separated)"
        style={{
          background: '#161b22', border: '1px solid #30363d', borderRadius: 6,
          padding: '6px 10px', fontSize: 12, color: '#8b949e', outline: 'none', width: '100%',
          boxSizing: 'border-box',
        }} />

      {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          fontSize: 11, padding: '4px 12px', borderRadius: 6,
          border: '1px solid #30363d', background: 'none', color: '#8b949e', cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{
          fontSize: 11, padding: '4px 12px', borderRadius: 6,
          border: 'none', background: '#4d8fd4', color: '#fff', fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Entry card (collapsed / expanded view) ───────────────────────────────────

function EntryCard({ entry, onEdit, onDelete, deleting }: {
  entry:    EntryRow
  onEdit:   () => void
  onDelete: () => void
  deleting: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const color = CATEGORY_COLOR[entry.category] ?? '#8b949e'
  const tags  = entry.tags ? entry.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div style={{
      background: '#0d1117', border: '1px solid #21262d',
      borderRadius: 8, overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLDivElement).style.borderColor = '#30363d' }}
      onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLDivElement).style.borderColor = '#21262d' }}
    >
      {/* ── Header row (always visible) ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Expand chevron */}
        <span style={{
          fontSize: 10, color: '#8b949e', flexShrink: 0,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s', display: 'inline-block',
        }}>▶</span>

        {/* Category badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, color, background: `${color}18`,
          border: `1px solid ${color}30`, borderRadius: 99, padding: '1px 7px', flexShrink: 0,
        }}>
          {entry.category}
        </span>

        {/* Title */}
        <span style={{
          fontSize: 13, color: '#e6edf3', fontWeight: 500, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.title}
        </span>

        {/* Timestamp */}
        <span style={{ fontSize: 11, color: '#8b949e', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {rel(entry.created_at)}
        </span>

        {/* Actions — stop click from toggling expand */}
        <span style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} title="Edit"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#8b949e', fontSize: 13, padding: '3px 5px', borderRadius: 4, lineHeight: 1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4d8fd4' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8b949e' }}
          >✎</button>

          <button onClick={onDelete} disabled={deleting} title="Delete"
            style={{
              background: 'none', border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer',
              color: '#8b949e', fontSize: 14, padding: '3px 5px', borderRadius: 4, lineHeight: 1,
              opacity: deleting ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8b949e' }}
          >✕</button>
        </span>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #21262d', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Full title (readable at larger size) */}
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e6edf3', lineHeight: 1.4 }}>
            {entry.title}
          </p>

          {/* Body */}
          {entry.body ? (
            <p style={{
              margin: 0, fontSize: 13, color: '#c9d1d9', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {entry.body}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#484f58', fontStyle: 'italic' }}>No body</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10, color: '#8b949e', background: '#161b22',
                  border: '1px solid #30363d', borderRadius: 99, padding: '1px 8px',
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Full date */}
          <p style={{ margin: 0, fontSize: 11, color: '#484f58' }}>
            {new Date(entry.created_at).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Entries list (bottom section) ────────────────────────────────────────────

function EntriesList({ entries, onRefresh }: {
  entries:   EntryRow[]
  onRefresh: () => void
}) {
  const [editingId,  setEditingId]  = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      if (res.ok) onRefresh()
    } catch { /* ignore */ }
    finally { setDeletingId(null) }
  }

  if (!entries.length) {
    return (
      <p style={{ fontSize: 12, color: '#8b949e', textAlign: 'center', padding: '16px 0' }}>
        No entries yet.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {entries.map(entry => {
        if (editingId === entry.id) {
          return (
            <EditRow
              key={entry.id}
              entry={entry}
              onSave={() => { setEditingId(null); onRefresh() }}
              onCancel={() => setEditingId(null)}
            />
          )
        }
        return (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={() => setEditingId(entry.id)}
            onDelete={() => handleDelete(entry.id)}
            deleting={deletingId === entry.id}
          />
        )
      })}
    </div>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

export default function WriteJournalForm({ onCreated }: { onCreated?: () => void }) {
  const [entries, setEntries] = useState<EntryRow[]>([])

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal?source=manual&page=1&pageSize=100')
      if (!res.ok) return
      const data = await res.json()
      setEntries(data.entries.map((e: {
        id: string; title: string; body?: string
        category: string; tags?: string[]; timestamp: string
      }) => ({
        id:         parseInt(e.id.replace('manual-', ''), 10),
        title:      e.title,
        body:       e.body       ?? null,
        category:   e.category,
        tags:       e.tags?.join(', ') ?? null,
        created_at: e.timestamp,
      })))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleCreated = () => { loadEntries(); onCreated?.() }

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex flex-col gap-0">
      {/* Top — write new entry */}
      <NewEntryForm onCreated={handleCreated} />

      {/* Divider */}
      <div style={{ borderTop: '1px solid #21262d', margin: '16px 0' }} />

      {/* Bottom — list with expand, edit, delete */}
      <div>
        <p style={{
          fontSize: 11, color: '#8b949e', marginBottom: 10,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Mindspace Entries ({entries.length})
        </p>
        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <EntriesList entries={entries} onRefresh={loadEntries} />
        </div>
      </div>
    </div>
  )
}
