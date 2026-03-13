import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { deleteJournalEntry } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  await deleteJournalEntry(id)
  return NextResponse.json({ success: true })
}
