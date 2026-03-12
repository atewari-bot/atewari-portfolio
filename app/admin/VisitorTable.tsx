'use client'

import { useState } from 'react'

type Visitor = Record<string, unknown>

const PAGE_SIZES = [20, 50, 100] as const

function formatDate(raw: string) {
  const d = new Date(raw + (raw.endsWith('Z') ? '' : 'Z'))
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function formatMs(ms: unknown) {
  if (ms == null) return '—'
  const n = Number(ms)
  return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`
}

const HEADERS = [
  '#', 'Name', 'Device', 'Browser', 'OS', 'Country', 'City',
  'Language', 'Timezone', 'Screen', 'Pixel', 'Time to Submit', 'Returning', 'IP', 'Timestamp',
]

export default function VisitorTable({ initialVisitors }: { initialVisitors: Visitor[] }) {
  const [rows, setRows]           = useState<Visitor[]>(initialVisitors)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState<typeof PAGE_SIZES[number]>(20)
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [deleting, setDeleting]   = useState(false)

  const totalPages  = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage    = Math.min(page, totalPages)
  const start       = (safePage - 1) * pageSize
  const pageRows    = rows.slice(start, start + pageSize)
  const pageIds     = pageRows.map(r => r.id as number)
  const allPageSel  = pageIds.length > 0 && pageIds.every(id => selected.has(id))

  function toggleRow(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function togglePage() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPageSel) {
        pageIds.forEach(id => next.delete(id))
      } else {
        pageIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      const res = await fetch('/api/visitor', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setRows(prev => prev.filter(r => !selected.has(r.id as number)))
      setSelected(new Set())
      setPage(1)
    } catch {
      alert('Failed to delete visitors. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  function onPageSizeChange(size: typeof PAGE_SIZES[number]) {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      {/* Table toolbar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-text">All Visits</h2>
          <span className="text-xs text-muted bg-bg border border-border rounded-full px-2.5 py-0.5">
            {rows.length} total
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Delete selected */}
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : `Delete ${selected.size} selected`}
            </button>
          )}

          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Rows:</span>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {PAGE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                  className={`px-2.5 py-1 text-xs transition-colors ${
                    pageSize === size
                      ? 'bg-accent text-white font-semibold'
                      : 'bg-bg text-muted hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted text-sm px-6 py-10 text-center">No visitors yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                  {/* Select-all checkbox */}
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allPageSel}
                      onChange={togglePage}
                      className="accent-accent cursor-pointer"
                      title="Select all on page"
                    />
                  </th>
                  {HEADERS.map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((v, i) => {
                  const id = v.id as number
                  const isSelected = selected.has(id)
                  return (
                    <tr
                      key={id}
                      onClick={() => toggleRow(id)}
                      className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-accent/5 hover:bg-accent/10'
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      <td className="px-4 py-3 w-8" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="accent-accent cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-muted tabular-nums">{rows.length - start - i}</td>
                      <td className="px-4 py-3 font-medium text-text whitespace-nowrap">
                        {(v.name as string) || <span className="text-muted italic">anonymous</span>}
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap capitalize">{(v.device_type as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.browser as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.os as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.country as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.city as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.language as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.timezone as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.screen_res as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.pixel_ratio as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums">{formatMs(v.time_to_submit)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {v.returning_visitor === 1
                          ? <span className="text-xs bg-accent-dim text-accent px-2 py-0.5 rounded-full font-medium">Yes</span>
                          : <span className="text-xs text-muted">No</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums font-mono text-xs">{(v.ip_address as string) ?? '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums">{formatDate(v.visit_time as string)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted">
              Showing <span className="text-text font-medium">{start + 1}–{Math.min(start + pageSize, rows.length)}</span> of <span className="text-text font-medium">{rows.length}</span>
              {selected.size > 0 && <span className="ml-2 text-accent">· {selected.size} selected</span>}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                className="px-2 py-1 text-xs rounded text-muted hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-2 py-1 text-xs rounded text-muted hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ‹ Prev
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-7 h-7 text-xs rounded transition-colors ${
                          safePage === p
                            ? 'bg-accent text-white font-semibold'
                            : 'text-muted hover:text-text hover:bg-surface-hover'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-2 py-1 text-xs rounded text-muted hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={safePage === totalPages}
                className="px-2 py-1 text-xs rounded text-muted hover:text-text hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
