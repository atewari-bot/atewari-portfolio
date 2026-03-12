import { NextRequest, NextResponse } from 'next/server'
import { recordVisitor, updateVisitor, VisitorData } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body: VisitorData = await request.json()

    // Geo + IP from request headers (populated automatically on Vercel)
    const h = request.headers
    body.ipAddress = h.get('x-forwarded-for')?.split(',')[0].trim()
                  ?? h.get('x-real-ip')
                  ?? undefined
    body.country   = h.get('x-vercel-ip-country') ?? undefined
    body.city      = h.get('x-vercel-ip-city')    ?? undefined
    body.region    = h.get('x-vercel-ip-country-region') ?? undefined

    const result = await recordVisitor(body)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Failed to record visitor:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, timeToSubmit } = await request.json()
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'id and name are required' }, { status: 400 })
    }
    await updateVisitor(Number(id), name.trim(), timeToSubmit)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to update visitor:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
