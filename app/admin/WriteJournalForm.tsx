'use client'

import { useState } from 'react'

type Category = 'note' | 'coding' | 'sports'

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'note',   label: 'Note',   color: '#a78bfa' },
  { value: 'coding', label: 'Coding', color: '#4d8fd4' },
  { value: 'sports', label: 'Sports', color: '#22c55e' },
]

export default function WriteJournalForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen]         = useState(false)
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [tags, setTags]         = useState('')
  const [category, setCategory] = useState<Category>('note')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

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
      onCreated?.()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
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

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title *"
            maxLength={200}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
          />

          {/* Body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Body (optional — markdown-ish)"
            rows={4}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors resize-y font-[inherit]"
          />

          {/* Tags */}
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma separated, e.g. typescript, open-source)"
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
    </div>
  )
}
