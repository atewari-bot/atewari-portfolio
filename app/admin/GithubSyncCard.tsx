'use client'

import { useState, useEffect, useCallback } from 'react'

function relMin(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function GithubSyncCard() {
  const [lastSync, setLastSync]   = useState<string | null>(null)
  const [syncing,  setSyncing]    = useState(false)
  const [result,   setResult]     = useState<{ fetched: number; inserted: number } | null>(null)
  const [error,    setError]      = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/journal/sync')
      if (res.ok) {
        const data = await res.json()
        setLastSync(data.lastSync ?? null)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setResult(null)
    try {
      const res  = await fetch('/api/journal/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Sync failed'); return }
      setLastSync(data.lastSync ?? null)
      setResult({ fetched: data.fetched, inserted: data.inserted })
    } catch {
      setError('Network error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">GitHub Sync</h2>
          <p className="text-xs text-muted mt-0.5">
            {lastSync ? `Last synced ${relMin(lastSync)}` : 'Never synced — click Refresh to import commits'}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-muted hover:text-text hover:border-accent transition-colors disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Refresh Now'}
        </button>
      </div>

      {result && (
        <p className="text-xs text-green-400">
          Fetched {result.fetched} commits — {result.inserted} new
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
