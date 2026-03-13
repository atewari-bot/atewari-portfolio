/**
 * Lightweight structured logger.
 *
 * Outputs JSON lines on the server so log aggregators (Vercel, Datadog, etc.)
 * can parse them easily. Debug entries are suppressed in production.
 *
 * Usage:
 *   logger.debug('journal', 'Cache hit', { count: 40 })
 *   logger.info ('visitor', 'Recorded new visitor', { id: 12 })
 *   logger.warn ('github',  'Rate limit low', { remaining: 5 })
 *   logger.error('db',      'Query failed', err)
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const IS_PROD = process.env.NODE_ENV === 'production'

function log(level: Level, context: string, message: string, data?: unknown): void {
  // Suppress debug in production to keep noise down
  if (level === 'debug' && IS_PROD) return

  const entry: Record<string, unknown> = {
    ts:      new Date().toISOString(),
    level,
    context,
    message,
  }

  // Attach extra data only when present
  if (data !== undefined) {
    entry.data = data instanceof Error
      ? { name: data.name, message: data.message, stack: data.stack }
      : data
  }

  const line = JSON.stringify(entry)

  if (level === 'error') console.error(line)
  else if (level === 'warn')  console.warn(line)
  else                         console.log(line)
}

export const logger = {
  debug: (ctx: string, msg: string, data?: unknown) => log('debug', ctx, msg, data),
  info:  (ctx: string, msg: string, data?: unknown) => log('info',  ctx, msg, data),
  warn:  (ctx: string, msg: string, data?: unknown) => log('warn',  ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log('error', ctx, msg, data),
}
