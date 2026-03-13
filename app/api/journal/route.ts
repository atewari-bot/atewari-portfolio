import { fetchGitHubJournal, type JournalEntry } from '@/lib/journal'
import { getAllJournalEntries, createJournalEntry, initJournalDb, getBulkReactionCounts } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

// ─── GitHub cache (5 min) ─────────────────────────────────────────────────────
let ghCache: { entries: JournalEntry[]; expiresAt: number } | null = null

async function getCachedGitHubEntries(): Promise<JournalEntry[]> {
  if (ghCache && Date.now() < ghCache.expiresAt) return ghCache.entries
  try {
    const entries = await fetchGitHubJournal()
    ghCache = { entries, expiresAt: Date.now() + 5 * 60 * 1000 }
    return entries
  } catch {
    return ghCache?.entries ?? []
  }
}

// ─── GET /api/journal?page=1&pageSize=10&visitorId=N ─────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') ?? '10', 10)))
  const visitorId = parseInt(searchParams.get('visitorId') ?? '0', 10) || undefined
  const sourceFilter = searchParams.get('source') ?? undefined

  await initJournalDb()

  // For manual-only tab, skip GitHub; otherwise merge both
  const [ghEntries, dbRows] = await Promise.all([
    sourceFilter === 'manual' ? Promise.resolve([]) : getCachedGitHubEntries(),
    getAllJournalEntries(),
  ])

  const manualEntries: JournalEntry[] = dbRows.map(row => ({
      id: `manual-${row.id}`,
      source: 'manual' as const,
      category: row.category as JournalEntry['category'],
      title: row.title,
      body: row.body ?? undefined,
      timestamp: row.created_at,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      likes: 0,
      dislikes: 0,
    }))

  const all = [...ghEntries, ...manualEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const total = all.length
  const start = (page - 1) * pageSize
  const pageEntries = all.slice(start, start + pageSize)

  // Bulk-fetch reaction counts for entries on this page
  const ids = pageEntries.map(e => e.id)
  const reactions = await getBulkReactionCounts(ids, visitorId)
  const enriched = pageEntries.map(e => ({
    ...e,
    ...reactions.get(e.id),
  }))

  return NextResponse.json({ entries: enriched, total, page, pageSize })
}

// ─── POST /api/journal — admin creates manual entry ──────────────────────────
export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, category, tags } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  await initJournalDb()
  const id = await createJournalEntry({
    title: title.trim(),
    body: body?.trim() || undefined,
    category: category ?? 'note',
    tags: tags?.trim() || undefined,
  })

  // Invalidate GitHub cache so manual entry shows immediately
  ghCache = null

  return NextResponse.json({ success: true, id })
}
