import { deleteQuestion, answerQuestion, initJournalDb } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  return session.isLoggedIn
}

// DELETE /api/questions/[id] — admin-only, removes a question
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await initJournalDb()
    await deleteQuestion(Number(params.id))
    logger.info('questions', 'Question deleted', { id: params.id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('questions', 'Failed to delete question', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/questions/[id] — admin-only, submits an answer to a question
// Body: { answer: string }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { answer } = await request.json()
    if (!answer?.trim()) {
      return NextResponse.json({ error: 'Answer required' }, { status: 400 })
    }
    await initJournalDb()
    await answerQuestion(Number(params.id), answer.trim())
    logger.info('questions', 'Question answered', { id: params.id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('questions', 'Failed to answer question', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
