import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { deleteJournalEntry, updateJournalEntry } from '@/lib/db'
import { invalidateJournalCache } from '@/lib/edgeConfig'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  return session.isLoggedIn
}

// DELETE /api/journal/[id] — admin-only, removes a manual journal entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

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

// PATCH /api/journal/[id] — admin-only, updates a manual journal entry
// Body: { title, body?, category, tags? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const { title, body, category, tags } = await request.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    await updateJournalEntry(id, {
      title:    title.trim(),
      body:     body?.trim()   || undefined,
      category: category       ?? 'note',
      tags:     tags?.trim()   || undefined,
    })
    void invalidateJournalCache()
    logger.info('journal', 'Entry updated', { id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('journal', 'Failed to update entry', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
