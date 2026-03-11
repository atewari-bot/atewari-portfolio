import { NextRequest, NextResponse } from 'next/server'
import { recordVisitor, VisitorData } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body: VisitorData = await request.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    await recordVisitor(body)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to record visitor:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
