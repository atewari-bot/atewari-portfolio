/**
 * Token health checks for external service credentials.
 *
 * Each check returns a TokenStatus describing whether the credential is valid,
 * how many days remain before expiry, and a human-readable message.
 * Results are surfaced on the admin dashboard via TokenAlerts.
 */

import { getDb } from './db'
import { logger } from './logger'

export interface TokenStatus {
  name:       string
  ok:         boolean
  message:    string
  expiresAt?: Date
  daysLeft?:  number
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

/**
 * Validates the GitHub PAT by hitting /rate_limit.
 * Fine-grained PATs include a `github-authentication-token-expiration` header;
 * we warn when fewer than 7 days remain.
 */
export async function checkGitHubToken(): Promise<TokenStatus> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    logger.warn('tokenHealth', 'GITHUB_TOKEN is not set')
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
      logger.error('tokenHealth', 'GitHub token invalid (401)')
      return { name: 'GitHub', ok: false, message: 'Token is invalid or revoked (401)' }
    }
    if (!res.ok) {
      logger.warn('tokenHealth', 'GitHub rate_limit check failed', { status: res.status })
      return { name: 'GitHub', ok: false, message: `Unexpected status ${res.status}` }
    }

    // Fine-grained PATs carry this header; classic tokens do not
    const expiryHeader = res.headers.get('github-authentication-token-expiration')
    if (expiryHeader) {
      const expiresAt = new Date(expiryHeader)
      const daysLeft  = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
      if (daysLeft <= 7) {
        logger.warn('tokenHealth', 'GitHub token expiring soon', { daysLeft, expiresAt })
        return {
          name: 'GitHub', ok: false,
          message: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiresAt.toDateString()})`,
          expiresAt, daysLeft,
        }
      }
      logger.debug('tokenHealth', 'GitHub token valid', { daysLeft })
      return { name: 'GitHub', ok: true, message: `Valid — expires in ${daysLeft} days`, expiresAt, daysLeft }
    }

    const data      = await res.json() as { rate?: { remaining: number } }
    const remaining = data?.rate?.remaining ?? '?'
    logger.debug('tokenHealth', 'GitHub token valid (no expiry header)', { remaining })
    return { name: 'GitHub', ok: true, message: `Valid — ${remaining} requests remaining` }
  } catch (err) {
    logger.error('tokenHealth', 'GitHub token check threw', err)
    return { name: 'GitHub', ok: false, message: `Check failed: ${String(err)}` }
  }
}

// ─── Turso ────────────────────────────────────────────────────────────────────

/**
 * Validates the Turso auth token by:
 * 1. Decoding the JWT payload to check `exp` if present.
 * 2. Running a live `SELECT 1` to confirm connectivity and auth.
 */
export async function checkTursoToken(): Promise<TokenStatus> {
  if (!process.env.TURSO_AUTH_TOKEN) {
    logger.warn('tokenHealth', 'TURSO_AUTH_TOKEN is not set')
    return { name: 'Turso', ok: false, message: 'TURSO_AUTH_TOKEN is not set' }
  }

  // Attempt JWT decode to surface upcoming expiry without a network call
  try {
    const payload = JSON.parse(
      Buffer.from(process.env.TURSO_AUTH_TOKEN.split('.')[1], 'base64').toString()
    ) as { exp?: number }

    if (payload.exp) {
      const expiresAt = new Date(payload.exp * 1000)
      const daysLeft  = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
      if (daysLeft <= 7) {
        logger.warn('tokenHealth', 'Turso token expiring soon', { daysLeft, expiresAt })
        return {
          name: 'Turso', ok: false,
          message: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiresAt.toDateString()})`,
          expiresAt, daysLeft,
        }
      }
    }
  } catch {
    // Non-standard JWT or parse error — continue to live check
    logger.debug('tokenHealth', 'Turso JWT decode skipped (non-standard payload)')
  }

  // Live connectivity + auth check
  try {
    await getDb().execute('SELECT 1')
    logger.debug('tokenHealth', 'Turso connection OK')
    return { name: 'Turso', ok: true, message: 'Connected successfully' }
  } catch (err) {
    const msg    = String(err)
    const isAuth = msg.toLowerCase().includes('unauthorized') || msg.includes('401')
    logger.error('tokenHealth', 'Turso connection failed', err)
    return {
      name: 'Turso', ok: false,
      message: isAuth
        ? 'Auth failed — token may be expired or revoked'
        : `Connection error: ${msg}`,
    }
  }
}

// ─── Pusher ───────────────────────────────────────────────────────────────────

/**
 * Validates Pusher credentials by calling the channels REST API.
 * Pusher secrets don't expire, but this catches misconfiguration or rotated keys.
 */
export async function checkPusherToken(): Promise<TokenStatus> {
  const { PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER } = process.env

  if (!PUSHER_APP_ID || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_KEY || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    logger.warn('tokenHealth', 'One or more Pusher env vars are missing')
    return { name: 'Pusher', ok: false, message: 'One or more Pusher env vars are missing' }
  }

  try {
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
      logger.error('tokenHealth', 'Pusher credentials rejected', { status: res.status })
      return { name: 'Pusher', ok: false, message: 'Credentials rejected — app ID or secret may be wrong' }
    }

    logger.debug('tokenHealth', 'Pusher credentials valid')
    return { name: 'Pusher', ok: true, message: 'Credentials valid' }
  } catch (err) {
    logger.error('tokenHealth', 'Pusher check threw', err)
    return { name: 'Pusher', ok: false, message: `Check failed: ${String(err)}` }
  }
}

// ─── Run all ──────────────────────────────────────────────────────────────────

/** Runs all token checks in parallel and returns their statuses. */
export async function checkAllTokens(): Promise<TokenStatus[]> {
  logger.info('tokenHealth', 'Running all token health checks')
  return Promise.all([checkGitHubToken(), checkTursoToken(), checkPusherToken()])
}
