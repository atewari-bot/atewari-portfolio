import { toggleReaction, initJournalDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/journal/react — toggle a like or dislike on a journal entry
// Body: { entryId: string, reaction: 'like' | 'dislike', visitorId: number }
export async function POST(request: NextRequest) {
  try {
    const { entryId, reaction, visitorId } = await request.json()

    if (!entryId || !reaction || !visitorId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }
    if (reaction !== 'like' && reaction !== 'dislike') {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
    }

    await initJournalDb()
    const counts = await toggleReaction(String(entryId), reaction, Number(visitorId))
    logger.debug('journal', 'Reaction toggled', { entryId, reaction, visitorId, ...counts })
    return NextResponse.json(counts)
  } catch (err) {
    logger.error('journal', 'Failed to toggle reaction', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
