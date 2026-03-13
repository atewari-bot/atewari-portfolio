import { toggleReaction, initJournalDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/journal/react  { entryId, reaction: 'like'|'dislike', visitorId }
export async function POST(request: NextRequest) {
  const { entryId, reaction, visitorId } = await request.json()

  if (!entryId || !reaction || !visitorId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }
  if (reaction !== 'like' && reaction !== 'dislike') {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
  }

  await initJournalDb()
  const counts = await toggleReaction(String(entryId), reaction, Number(visitorId))
  return NextResponse.json(counts)
}
