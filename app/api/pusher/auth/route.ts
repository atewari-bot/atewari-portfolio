import { getPusherServer } from '@/lib/pusher'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/pusher/auth — signs a presence channel for a visitor
// Called by Pusher.js client when joining the presence channel.
// Body: { socket_id, channel_name, user_id, user_info: { name, emoji } }
export async function POST(request: NextRequest) {
  try {
    const { socket_id, channel_name, user_id, user_info } = await request.json()

    if (!socket_id || !channel_name || !user_id) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const auth = getPusherServer().authorizeChannel(socket_id, channel_name, {
      user_id:   String(user_id),
      user_info,
    })

    logger.debug('pusher', 'Channel auth signed', { channel_name, user_id })
    return NextResponse.json(auth)
  } catch (err) {
    logger.error('pusher', 'Channel auth failed', err)
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 })
  }
}
