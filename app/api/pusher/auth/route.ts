import { getPusherServer } from '@/lib/pusher'
import { NextRequest, NextResponse } from 'next/server'

// Presence channel auth — signs the channel for a visitor
// Body: { socket_id, channel_name, user_id, user_info: { name, emoji } }
export async function POST(request: NextRequest) {
  try {
    const { socket_id, channel_name, user_id, user_info } = await request.json()

    if (!socket_id || !channel_name || !user_id) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const auth = getPusherServer().authorizeChannel(socket_id, channel_name, {
      user_id: String(user_id),
      user_info,
    })

    return NextResponse.json(auth)
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 })
  }
}
