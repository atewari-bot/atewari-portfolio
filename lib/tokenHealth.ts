import { getDb } from './db'

export interface TokenStatus {
  name: string
  ok: boolean
  message: string
  expiresAt?: Date
  daysLeft?: number
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

export async function checkGitHubToken(): Promise<TokenStatus> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return { name: 'GitHub', ok: false, message: 'GITHUB_TOKEN is not set' }
  }

  try {
    const res = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    })

    if (res.status === 401) {
      return { name: 'GitHub', ok: false, message: 'Token is invalid or revoked (401)' }
    }
    if (!res.ok) {
      return { name: 'GitHub', ok: false, message: `Unexpected status ${res.status}` }
    }

    // Fine-grained PATs include this header; classic tokens may not
    const expiryHeader = res.headers.get('github-authentication-token-expiration')
    if (expiryHeader) {
      const expiresAt = new Date(expiryHeader)
      const daysLeft  = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
      if (daysLeft <= 7) {
        return {
          name: 'GitHub', ok: false,
          message: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiresAt.toDateString()})`,
          expiresAt, daysLeft,
        }
      }
      return {
        name: 'GitHub', ok: true,
        message: `Valid — expires in ${daysLeft} days`,
        expiresAt, daysLeft,
      }
    }

    const data = await res.json()
    const remaining = data?.rate?.remaining ?? '?'
    return { name: 'GitHub', ok: true, message: `Valid — ${remaining} requests remaining` }
  } catch (err) {
    return { name: 'GitHub', ok: false, message: `Check failed: ${String(err)}` }
  }
}

// ─── Turso ────────────────────────────────────────────────────────────────────

export async function checkTursoToken(): Promise<TokenStatus> {
  const token = process.env.TURSO_AUTH_TOKEN
  if (!token) {
    return { name: 'Turso', ok: false, message: 'TURSO_AUTH_TOKEN is not set' }
  }

  // Decode JWT payload to get iat (issued-at) and exp (if present)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    if (payload.exp) {
      const expiresAt = new Date(payload.exp * 1000)
      const daysLeft  = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
      if (daysLeft <= 7) {
        return {
          name: 'Turso', ok: false,
          message: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiresAt.toDateString()})`,
          expiresAt, daysLeft,
        }
      }
    }
  } catch { /* non-JWT or parse error — fall through to live check */ }

  // Live connectivity check
  try {
    await getDb().execute('SELECT 1')
    return { name: 'Turso', ok: true, message: 'Connected successfully' }
  } catch (err) {
    const msg = String(err)
    const isAuth = msg.toLowerCase().includes('unauthorized') || msg.includes('401')
    return {
      name: 'Turso', ok: false,
      message: isAuth ? 'Auth failed — token may be expired or revoked' : `Connection error: ${msg}`,
    }
  }
}

// ─── Pusher ───────────────────────────────────────────────────────────────────

export async function checkPusherToken(): Promise<TokenStatus> {
  const { PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER } = process.env

  if (!PUSHER_APP_ID || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_KEY || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    return { name: 'Pusher', ok: false, message: 'One or more Pusher env vars are missing' }
  }

  try {
    // Hit the Pusher channels API to verify credentials
    const res = await fetch(
      `https://api-${NEXT_PUBLIC_PUSHER_CLUSTER}.pusher.com/apps/${PUSHER_APP_ID}/channels`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${PUSHER_APP_ID}:${PUSHER_SECRET}`).toString('base64')}`,
        },
        cache: 'no-store',
      }
    )
    if (res.status === 401 || res.status === 403) {
      return { name: 'Pusher', ok: false, message: 'Credentials rejected — app ID or secret may be wrong' }
    }
    return { name: 'Pusher', ok: true, message: 'Credentials valid' }
  } catch (err) {
    return { name: 'Pusher', ok: false, message: `Check failed: ${String(err)}` }
  }
}

// ─── Run all ──────────────────────────────────────────────────────────────────

export async function checkAllTokens(): Promise<TokenStatus[]> {
  return Promise.all([checkGitHubToken(), checkTursoToken(), checkPusherToken()])
}
