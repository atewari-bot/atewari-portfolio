/**
 * Vercel Edge Config cache helpers for journal entries.
 *
 * Reads use the @vercel/edge-config SDK (globally distributed, sub-ms latency).
 * Writes use the Vercel Management REST API (PATCH /v1/edge-config/{id}/items).
 *
 * Required env vars:
 *   EDGE_CONFIG         — connection string, set automatically by Vercel when you
 *                         connect an Edge Config store; pulled locally via `vercel env pull`
 *   VERCEL_OIDC_TOKEN   — pulled automatically by `vercel env pull` (set by Vercel CLI)
 *
 * If either var is missing the helpers are no-ops and the app falls back to DB reads.
 */

import { get } from '@vercel/edge-config'
import { type JournalEntryRow } from './db'
import { logger } from './logger'

// ─── Cache keys ───────────────────────────────────────────────────────────────

const KEY_ALL    = 'journal_entries'
const KEY_MANUAL = 'journal_entries_manual'

function cacheKey(source?: string): string {
  return source === 'manual' ? KEY_MANUAL : KEY_ALL
}

// ─── Edge Config ID ───────────────────────────────────────────────────────────
// The EDGE_CONFIG connection string has the form:
//   https://edge-config.vercel.com/<edgeConfigId>?token=<token>
// We parse the ID from it so users don't need a separate EDGE_CONFIG_ID var.

function getEdgeConfigId(): string | null {
  const url = process.env.EDGE_CONFIG
  if (!url) return null
  const match = url.match(/edge-config\.vercel\.com\/([^?/]+)/)
  return match?.[1] ?? null
}

// ─── Write helper ─────────────────────────────────────────────────────────────

async function patchItems(items: Array<{ operation: 'upsert' | 'delete'; key: string; value?: unknown }>) {
  const token         = process.env.VERCEL_OIDC_TOKEN
  const edgeConfigId  = getEdgeConfigId()

  if (!token || !edgeConfigId) {
    logger.debug('edgeConfig', 'Write skipped — VERCEL_OIDC_TOKEN or EDGE_CONFIG not set')
    return
  }

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ items }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.warn('edgeConfig', 'Edge Config write failed', { status: res.status, body: text })
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Returns cached journal rows, or null on cache miss / Edge Config not configured. */
export async function getJournalCache(source?: string): Promise<JournalEntryRow[] | null> {
  try {
    const data = await get<JournalEntryRow[]>(cacheKey(source))
    if (data) logger.debug('edgeConfig', 'Journal cache hit', { source, count: data.length })
    return data ?? null
  } catch (err) {
    // get() throws if EDGE_CONFIG is not set — treat as cache miss
    logger.debug('edgeConfig', 'Cache read skipped or failed', err)
    return null
  }
}

/** Writes journal rows to Edge Config. Fire-and-forget safe. */
export async function setJournalCache(rows: JournalEntryRow[], source?: string): Promise<void> {
  try {
    await patchItems([{ operation: 'upsert', key: cacheKey(source), value: rows }])
    logger.debug('edgeConfig', 'Journal cache set', { source, count: rows.length })
  } catch (err) {
    logger.warn('edgeConfig', 'Cache set failed', err)
  }
}

/**
 * Removes all journal cache keys from Edge Config.
 * Called after GitHub sync or when a manual entry is created / deleted.
 */
export async function invalidateJournalCache(): Promise<void> {
  try {
    await patchItems([
      { operation: 'delete', key: KEY_ALL },
      { operation: 'delete', key: KEY_MANUAL },
    ])
    logger.debug('edgeConfig', 'Journal cache invalidated')
  } catch (err) {
    logger.warn('edgeConfig', 'Cache invalidation failed', err)
  }
}
