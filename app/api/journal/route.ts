import { type JournalEntry, type JournalSource, type JournalCategory, syncGithubToDb } from '@/lib/journal'
import { getAllJournalEntries, createJournalEntry, initJournalDb, getBulkReactionCounts, getLastGithubSync, type JournalEntryRow } from '@/lib/db'
import { getJournalCache, setJournalCache, invalidateJournalCache } from '@/lib/edgeConfig'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// GitHub commits are synced to DB at most once per day (or on demand via /api/journal/sync).
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000

// ─── GET /api/journal ─────────────────────────────────────────────────────────
// Query params:
//   page       — 1-based page number (default 1)
//   pageSize   — rows per page, 10–50 (default 10)
//   visitorId  — used to attach the caller's reaction state
//   source     — "manual" for Mindspace tab; defaults to "github_push" (Feed tab)
//                Pass "all" only for admin contexts that need every entry.

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page         = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10))
  const pageSize     = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') ?? '10', 10)))
  const visitorId    = parseInt(searchParams.get('visitorId') ?? '0', 10) || undefined
  // Feed tab shows GitHub commits only. Mindspace tab passes source=manual explicitly.
  const sourceFilter = searchParams.get('source') ?? 'github_push'

  await initJournalDb()

  // Auto-sync GitHub entries in the background when the cache is stale.
  // Fire-and-forget: the response is served from DB immediately.
  if (sourceFilter === 'github_push') {
    const lastSync = await getLastGithubSync()
    if (!lastSync || Date.now() - lastSync.getTime() > SYNC_INTERVAL_MS) {
      logger.info('journal', 'GitHub data stale — triggering background sync')
      void syncGithubToDb().catch(err => logger.error('journal', 'Auto-sync failed', err))
    }
  }

  // Serve rows from Redis if available; fall through to DB on miss.
  let dbRows: JournalEntryRow[] | null = await getJournalCache(sourceFilter)
  if (!dbRows) {
    dbRows = await getAllJournalEntries(sourceFilter)
    void setJournalCache(dbRows, sourceFilter)
  }

  // Map DB rows to the shared JournalEntry shape.
  // GitHub entries use their SHA as the reaction key (external_id); manual entries use "manual-{id}".
  const entries: JournalEntry[] = dbRows.map(row => ({
    id:        row.source === 'manual' ? `manual-${row.id}` : (row.external_id ?? `gh-${row.id}`),
    source:    row.source    as JournalSource,
    category:  row.category  as JournalCategory,
    title:     row.title,
    body:      row.body      ?? undefined,
    repo:      row.repo      ?? undefined,
    repoUrl:   row.repo_url  ?? undefined,
    url:       row.url       ?? undefined,
    timestamp: row.created_at,
    tags:      row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    likes:     0,
    dislikes:  0,
  }))

  const sorted      = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const total       = sorted.length
  const pageEntries = sorted.slice((page - 1) * pageSize, page * pageSize)

  // Bulk-fetch reaction counts for just the entries on this page
  const reactions = await getBulkReactionCounts(pageEntries.map(e => e.id), visitorId)
  const enriched  = pageEntries.map(e => ({ ...e, ...reactions.get(e.id) }))

  logger.debug('journal', 'GET journal', { page, pageSize, total, sourceFilter })
  return NextResponse.json({ entries: enriched, total, page, pageSize })
}

// ─── POST /api/journal ────────────────────────────────────────────────────────
// Admin-only. Creates a manual journal entry.

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, body, category, tags } = await request.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    await initJournalDb()
    const id = await createJournalEntry({
      title:    title.trim(),
      body:     body?.trim()  || undefined,
      category: category      ?? 'note',
      tags:     tags?.trim()  || undefined,
    })

    void invalidateJournalCache()
    logger.info('journal', 'Manual entry created', { id, title: title.trim(), category })
    return NextResponse.json({ success: true, id })
  } catch (err) {
    logger.error('journal', 'Failed to create journal entry', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
