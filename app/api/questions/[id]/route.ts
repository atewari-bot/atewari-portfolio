import { deleteQuestion, answerQuestion, initJournalDb } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initJournalDb()
  await deleteQuestion(Number(params.id))
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { answer } = await request.json()
  if (!answer?.trim()) return NextResponse.json({ error: 'Answer required' }, { status: 400 })
  await initJournalDb()
  await answerQuestion(Number(params.id), answer.trim())
  return NextResponse.json({ success: true })
}
