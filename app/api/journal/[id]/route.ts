import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { deleteJournalEntry } from '@/lib/db'
import { invalidateJournalCache } from '@/lib/edgeConfig'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/journal/[id] — admin-only, removes a manual journal entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = parseInt(params.id, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    await deleteJournalEntry(id)
    void invalidateJournalCache()
    logger.info('journal', 'Entry deleted', { id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('journal', 'Failed to delete entry', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
