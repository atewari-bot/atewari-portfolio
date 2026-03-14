import { syncGithubToDb } from '@/lib/journal'
import { getLastGithubSync } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET /api/journal/sync ────────────────────────────────────────────────────
// Returns the timestamp of the last successful GitHub sync. Public endpoint.

export async function GET() {
  const lastSync = await getLastGithubSync()
  return NextResponse.json({ lastSync: lastSync?.toISOString() ?? null })
}

// ─── POST /api/journal/sync ───────────────────────────────────────────────────
// Triggers an immediate GitHub → DB sync.
// Accepts either an admin session cookie or the Vercel cron secret header.
// Vercel cron sends: Authorization: Bearer <CRON_SECRET>

export async function POST(request: NextRequest) {
  // Allow Vercel scheduled cron to call this without a session cookie
  const authHeader  = request.headers.get('authorization')
  const cronSecret  = process.env.CRON_SECRET
  const isCron      = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)

  if (!isCron) {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const { fetched, inserted } = await syncGithubToDb()
    const lastSync = await getLastGithubSync()
    logger.info('journal', 'Sync triggered', { fetched, inserted, isCron })
    return NextResponse.json({ synced: true, fetched, inserted, lastSync: lastSync?.toISOString() })
  } catch (err) {
    logger.error('journal', 'Sync failed', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
