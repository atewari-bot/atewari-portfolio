import { createQuestion, getAllQuestions, initJournalDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  await initJournalDb()
  const questions = await getAllQuestions()
  return NextResponse.json(questions)
}

export async function POST(request: NextRequest) {
  const { question, visitorId, visitorName } = await request.json()

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 })
  }
  if (question.trim().length > 500) {
    return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 })
  }

  await initJournalDb()
  const id = await createQuestion({
    question: question.trim(),
    visitorId: visitorId ? Number(visitorId) : undefined,
    visitorName: visitorName?.trim() || undefined,
  })

  return NextResponse.json({ success: true, id })
}
