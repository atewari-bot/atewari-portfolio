import { createClient, type Client } from '@libsql/client'

let _db: Client | null = null

function getDb(): Client {
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
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      visit_time      TEXT    NOT NULL DEFAULT (datetime('now')),
      user_agent      TEXT,
      browser         TEXT,
      os              TEXT,
      screen_res      TEXT,
      color_depth     TEXT,
      timezone        TEXT,
      language        TEXT,
      platform        TEXT,
      cookies_enabled INTEGER,
      do_not_track    TEXT,
      referrer        TEXT,
      fingerprint     TEXT
    )
  `)
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

export async function recordVisitor(data: VisitorData) {
  await initDb()
  await getDb().execute({
    sql: `
      INSERT INTO visitors
        (name, user_agent, browser, os, screen_res, color_depth, timezone,
         language, platform, cookies_enabled, do_not_track, referrer, fingerprint)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
}

export async function getAllVisitors() {
  const result = await getDb().execute(
    'SELECT * FROM visitors ORDER BY visit_time DESC'
  )
  return result.rows
}
