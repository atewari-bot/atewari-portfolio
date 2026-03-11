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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      visit_time        TEXT    NOT NULL DEFAULT (datetime('now')),
      user_agent        TEXT,
      browser           TEXT,
      os                TEXT,
      screen_res        TEXT,
      color_depth       TEXT,
      timezone          TEXT,
      language          TEXT,
      platform          TEXT,
      cookies_enabled   INTEGER,
      do_not_track      TEXT,
      referrer          TEXT,
      fingerprint       TEXT,
      returning_visitor INTEGER NOT NULL DEFAULT 0,
      device_type       TEXT,
      pixel_ratio       TEXT,
      time_to_submit    INTEGER,
      ip_address        TEXT,
      country           TEXT,
      city              TEXT,
      region            TEXT
    )
  `)

  // Migrate columns added after initial release
  const migrations = [
    `ALTER TABLE visitors ADD COLUMN returning_visitor INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE visitors ADD COLUMN device_type TEXT`,
    `ALTER TABLE visitors ADD COLUMN pixel_ratio TEXT`,
    `ALTER TABLE visitors ADD COLUMN time_to_submit INTEGER`,
    `ALTER TABLE visitors ADD COLUMN ip_address TEXT`,
    `ALTER TABLE visitors ADD COLUMN country TEXT`,
    `ALTER TABLE visitors ADD COLUMN city TEXT`,
    `ALTER TABLE visitors ADD COLUMN region TEXT`,
  ]
  for (const sql of migrations) {
    try { await db.execute(sql) } catch { /* column already exists */ }
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
  deviceType?: string
  pixelRatio?: string
  timeToSubmit?: number
  // server-side geo (injected by API route)
  ipAddress?: string
  country?: string
  city?: string
  region?: string
}

export interface RecordResult {
  recorded: boolean
  returning: boolean
}

const SAME_SESSION_WINDOW_MS = 60_000 // 1 minute dedup window

export async function recordVisitor(data: VisitorData): Promise<RecordResult> {
  await initDb()
  const db = getDb()

  if (data.fingerprint) {
    const prior = await db.execute({
      sql: `SELECT visit_time FROM visitors WHERE fingerprint = ? ORDER BY visit_time DESC LIMIT 1`,
      args: [data.fingerprint],
    })

    if (prior.rows.length > 0) {
      const lastVisitTime = new Date(prior.rows[0].visit_time as string).getTime()
      if (Date.now() - lastVisitTime < SAME_SESSION_WINDOW_MS) {
        return { recorded: false, returning: true }
      }
      await insert(db, data, 1)
      return { recorded: true, returning: true }
    }
  }

  await insert(db, data, 0)
  return { recorded: true, returning: false }
}

async function insert(db: ReturnType<typeof getDb>, data: VisitorData, returning: 0 | 1) {
  await db.execute({
    sql: `
      INSERT INTO visitors
        (name, user_agent, browser, os, screen_res, color_depth, timezone, language,
         platform, cookies_enabled, do_not_track, referrer, fingerprint, returning_visitor,
         device_type, pixel_ratio, time_to_submit, ip_address, country, city, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.name,
      data.userAgent    ?? null,
      data.browser      ?? null,
      data.os           ?? null,
      data.screenRes    ?? null,
      data.colorDepth   ?? null,
      data.timezone     ?? null,
      data.language     ?? null,
      data.platform     ?? null,
      data.cookiesEnabled != null ? (data.cookiesEnabled ? 1 : 0) : null,
      data.doNotTrack   ?? null,
      data.referrer     ?? null,
      data.fingerprint  ?? null,
      returning,
      data.deviceType   ?? null,
      data.pixelRatio   ?? null,
      data.timeToSubmit ?? null,
      data.ipAddress    ?? null,
      data.country      ?? null,
      data.city         ?? null,
      data.region       ?? null,
    ],
  })
}

export async function getAllVisitors() {
  const result = await getDb().execute(
    'SELECT * FROM visitors ORDER BY visit_time DESC'
  )
  return result.rows
}
