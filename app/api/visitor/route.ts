import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { recordVisitor, updateVisitor, deleteVisitors, getAllVisitors, VisitorData } from '@/lib/db'
import { logger } from '@/lib/logger'

// GET — admin-only, returns all visitor records
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const visitors = await getAllVisitors()
    return NextResponse.json({ visitors })
  } catch (err) {
    logger.error('visitor', 'Failed to fetch visitors', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — record a new visitor session (called by VisitorModal on first load)
export async function POST(request: NextRequest) {
  try {
    const body: VisitorData = await request.json()

    // Enrich with geo + IP from Vercel edge headers
    const h      = request.headers
    body.ipAddress = h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? undefined
    body.country   = h.get('x-vercel-ip-country')        ?? undefined
    body.city      = h.get('x-vercel-ip-city')           ?? undefined
    body.region    = h.get('x-vercel-ip-country-region') ?? undefined

    const result = await recordVisitor(body)
    logger.info('visitor', 'Visitor recorded', { id: result.id, returning: result.returning, recorded: result.recorded })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    logger.error('visitor', 'Failed to record visitor', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update visitor name after they submit the modal form
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, timeToSubmit } = await request.json()
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'id and name are required' }, { status: 400 })
    }
    await updateVisitor(Number(id), name.trim(), timeToSubmit)
    logger.debug('visitor', 'Visitor name updated', { id, name: name.trim() })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('visitor', 'Failed to update visitor', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — admin-only bulk delete of visitor records
export async function DELETE(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    await deleteVisitors(ids.map(Number))
    logger.info('visitor', 'Visitors deleted', { count: ids.length, ids })
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (err) {
    logger.error('visitor', 'Failed to delete visitors', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
