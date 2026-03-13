import { createQuestion, getAllQuestions, initJournalDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/questions — returns all questions, answered first
export async function GET() {
  try {
    await initJournalDb()
    const questions = await getAllQuestions()
    logger.debug('questions', 'Fetched questions', { count: questions.length })
    return NextResponse.json(questions)
  } catch (err) {
    logger.error('questions', 'Failed to fetch questions', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/questions — visitor submits a new question
// Body: { question: string, visitorId?: number, visitorName?: string }
export async function POST(request: NextRequest) {
  try {
    const { question, visitorId, visitorName } = await request.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }
    if (question.trim().length > 500) {
      return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 })
    }

    await initJournalDb()
    const id = await createQuestion({
      question:    question.trim(),
      visitorId:   visitorId ? Number(visitorId) : undefined,
      visitorName: visitorName?.trim() || undefined,
    })

    logger.info('questions', 'Question submitted', { id, visitorId, visitorName })
    return NextResponse.json({ success: true, id })
  } catch (err) {
    logger.error('questions', 'Failed to create question', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
