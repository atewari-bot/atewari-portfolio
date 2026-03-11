import { createClient, type Client } from '@libsql/client'

let _db: Client | null = null

export function getDb(): Client {
  if (!_db) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error('TURSO_DATABASE_URL environment variable is not set')
    }
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return _db
}

export async function initDb() {
  const db = getDb()

  // Create table with all columns including returning_visitor
  await db.execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      visit_time       TEXT    NOT NULL DEFAULT (datetime('now')),
      user_agent       TEXT,
      browser          TEXT,
      os               TEXT,
      screen_res       TEXT,
      color_depth      TEXT,
      timezone         TEXT,
      language         TEXT,
      platform         TEXT,
      cookies_enabled  INTEGER,
      do_not_track     TEXT,
      referrer         TEXT,
      fingerprint      TEXT,
      returning_visitor INTEGER NOT NULL DEFAULT 0
    )
  `)

  // Migrate existing tables that predate the returning_visitor column
  try {
    await db.execute(`ALTER TABLE visitors ADD COLUMN returning_visitor INTEGER NOT NULL DEFAULT 0`)
  } catch {
    // Column already exists — safe to ignore
  }
}

export interface VisitorData {
  name: string
  userAgent?: string
  browser?: string
  os?: string
  screenRes?: string
  colorDepth?: string
  timezone?: string
  language?: string
  platform?: string
  cookiesEnabled?: boolean
  doNotTrack?: string
  referrer?: string
  fingerprint?: string
}

export interface RecordResult {
  recorded: boolean   // false = duplicate suppressed (same fingerprint within 1 min)
  returning: boolean  // true = fingerprint seen in a previous session
}

// How long (ms) to suppress duplicate inserts for the same fingerprint.
// Protects against double-submit within the same browser session.
const SAME_SESSION_WINDOW_MS = 60_000 // 1 minute

export async function recordVisitor(data: VisitorData): Promise<RecordResult> {
  await initDb()
  const db = getDb()

  if (data.fingerprint) {
    // Check all prior visits for this fingerprint
    const prior = await db.execute({
      sql: `SELECT visit_time FROM visitors WHERE fingerprint = ? ORDER BY visit_time DESC LIMIT 1`,
      args: [data.fingerprint],
    })

    if (prior.rows.length > 0) {
      const lastVisitTime = new Date(prior.rows[0].visit_time as string).getTime()
      const msSinceLast = Date.now() - lastVisitTime

      // Suppress insert — same fingerprint submitted within the dedup window
      if (msSinceLast < SAME_SESSION_WINDOW_MS) {
        return { recorded: false, returning: true }
      }

      // Returning visitor — new session, record it
      await db.execute({
        sql: `
          INSERT INTO visitors
            (name, user_agent, browser, os, screen_res, color_depth, timezone,
             language, platform, cookies_enabled, do_not_track, referrer, fingerprint, returning_visitor)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        args: [
          data.name,
          data.userAgent ?? null,
          data.browser ?? null,
          data.os ?? null,
          data.screenRes ?? null,
          data.colorDepth ?? null,
          data.timezone ?? null,
          data.language ?? null,
          data.platform ?? null,
          data.cookiesEnabled != null ? (data.cookiesEnabled ? 1 : 0) : null,
          data.doNotTrack ?? null,
          data.referrer ?? null,
          data.fingerprint ?? null,
        ],
      })
      return { recorded: true, returning: true }
    }
  }

  // First-time visitor
  await db.execute({
    sql: `
      INSERT INTO visitors
        (name, user_agent, browser, os, screen_res, color_depth, timezone,
         language, platform, cookies_enabled, do_not_track, referrer, fingerprint, returning_visitor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `,
    args: [
      data.name,
      data.userAgent ?? null,
      data.browser ?? null,
      data.os ?? null,
      data.screenRes ?? null,
      data.colorDepth ?? null,
      data.timezone ?? null,
      data.language ?? null,
      data.platform ?? null,
      data.cookiesEnabled != null ? (data.cookiesEnabled ? 1 : 0) : null,
      data.doNotTrack ?? null,
      data.referrer ?? null,
      data.fingerprint ?? null,
    ],
  })
  return { recorded: true, returning: false }
}

export async function getAllVisitors() {
  const result = await getDb().execute(
    'SELECT * FROM visitors ORDER BY visit_time DESC'
  )
  return result.rows
}
