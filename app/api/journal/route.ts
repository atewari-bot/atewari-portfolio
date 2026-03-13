import { fetchGitHubJournal, type JournalEntry } from '@/lib/journal'
import { getAllJournalEntries, createJournalEntry, initJournalDb, getBulkReactionCounts } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// ─── GitHub cache (5 min TTL) ─────────────────────────────────────────────────
// In-process cache avoids hammering the GitHub API on every page load.
// Resets on server restart or manual POST (new manual entry).

let ghCache: { entries: JournalEntry[]; expiresAt: number } | null = null

async function getCachedGitHubEntries(): Promise<JournalEntry[]> {
  if (ghCache && Date.now() < ghCache.expiresAt) {
    logger.debug('journal', 'GitHub cache hit', { count: ghCache.entries.length })
    return ghCache.entries
  }
  try {
    const entries = await fetchGitHubJournal()
    ghCache = { entries, expiresAt: Date.now() + 5 * 60 * 1000 }
    logger.info('journal', 'GitHub cache refreshed', { count: entries.length })
    return entries
  } catch (err) {
    logger.error('journal', 'GitHub fetch failed — serving stale cache', err)
    return ghCache?.entries ?? []
  }
}

// ─── GET /api/journal ─────────────────────────────────────────────────────────
// Query params:
//   page       — 1-based page number (default 1)
//   pageSize   — rows per page, 10–50 (default 10)
//   visitorId  — used to attach the caller's reaction state
//   source     — "manual" to show only admin-written entries (Mindspace tab)

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page         = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10))
  const pageSize     = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') ?? '10', 10)))
  const visitorId    = parseInt(searchParams.get('visitorId') ?? '0', 10) || undefined
  const sourceFilter = searchParams.get('source') ?? undefined

  await initJournalDb()

  // Skip GitHub entries when caller requests manual-only (Mindspace tab)
  const [ghEntries, dbRows] = await Promise.all([
    sourceFilter === 'manual' ? Promise.resolve([]) : getCachedGitHubEntries(),
    getAllJournalEntries(),
  ])

  const manualEntries: JournalEntry[] = dbRows.map(row => ({
    id:        `manual-${row.id}`,
    source:    'manual'                          as const,
    category:  row.category                      as JournalEntry['category'],
    title:     row.title,
    body:      row.body                          ?? undefined,
    timestamp: row.created_at,
    tags:      row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    likes:     0,
    dislikes:  0,
  }))

  const all = [...ghEntries, ...manualEntries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const total       = all.length
  const pageEntries = all.slice((page - 1) * pageSize, page * pageSize)

  // Bulk-fetch reaction counts for just the entries on this page
  const reactions = await getBulkReactionCounts(pageEntries.map(e => e.id), visitorId)
  const enriched  = pageEntries.map(e => ({ ...e, ...reactions.get(e.id) }))

  logger.debug('journal', 'GET journal', { page, pageSize, total, sourceFilter })
  return NextResponse.json({ entries: enriched, total, page, pageSize })
}

// ─── POST /api/journal ────────────────────────────────────────────────────────
// Admin-only. Creates a manual journal entry and busts the GitHub cache so the
// new entry appears immediately on the next feed fetch.

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

    ghCache = null // Bust cache so new entry appears in the feed immediately
    logger.info('journal', 'Manual entry created', { id, title: title.trim(), category })
    return NextResponse.json({ success: true, id })
  } catch (err) {
    logger.error('journal', 'Failed to create journal entry', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
