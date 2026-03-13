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
  name?: string
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
  id: number
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
        // Dedup: return the existing row id so client can still patch name
        const existing = await db.execute({
          sql: `SELECT id FROM visitors WHERE fingerprint = ? ORDER BY visit_time DESC LIMIT 1`,
          args: [data.fingerprint],
        })
        const id = Number(existing.rows[0]?.id ?? 0)
        return { recorded: false, returning: true, id }
      }
      const id = await insert(db, data, 1)
      return { recorded: true, returning: true, id }
    }
  }

  const id = await insert(db, data, 0)
  return { recorded: true, returning: false, id }
}

async function insert(db: ReturnType<typeof getDb>, data: VisitorData, returning: 0 | 1): Promise<number> {
  const result = await db.execute({
    sql: `
      INSERT INTO visitors
        (name, user_agent, browser, os, screen_res, color_depth, timezone, language,
         platform, cookies_enabled, do_not_track, referrer, fingerprint, returning_visitor,
         device_type, pixel_ratio, time_to_submit, ip_address, country, city, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.name         ?? '',
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
  return Number(result.lastInsertRowid)
}

export async function updateVisitor(id: number, name: string, timeToSubmit?: number): Promise<void> {
  await initDb()
  await getDb().execute({
    sql: `UPDATE visitors SET name = ?, time_to_submit = COALESCE(?, time_to_submit) WHERE id = ?`,
    args: [name, timeToSubmit ?? null, id],
  })
}

export async function getAllVisitors() {
  const result = await getDb().execute(
    'SELECT * FROM visitors ORDER BY visit_time DESC'
  )
  return result.rows
}

export async function deleteVisitors(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await initDb()
  const placeholders = ids.map(() => '?').join(',')
  await getDb().execute({
    sql: `DELETE FROM visitors WHERE id IN (${placeholders})`,
    args: ids,
  })
}

// ─── Journal entries ──────────────────────────────────────────────────────────

export async function initJournalDb() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      body       TEXT,
      category   TEXT    NOT NULL DEFAULT 'note',
      tags       TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_reactions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id   TEXT    NOT NULL,
      reaction   TEXT    NOT NULL,
      visitor_id INTEGER NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(entry_id, visitor_id)
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS visitor_questions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      question     TEXT    NOT NULL,
      visitor_id   INTEGER,
      visitor_name TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      answered     INTEGER NOT NULL DEFAULT 0,
      answer       TEXT
    )
  `)
}

export interface JournalEntryRow {
  id: number
  title: string
  body: string | null
  category: string
  tags: string | null
  created_at: string
}

export async function createJournalEntry(data: {
  title: string
  body?: string
  category: string
  tags?: string
}): Promise<number> {
  await initJournalDb()
  const result = await getDb().execute({
    sql: `INSERT INTO journal_entries (title, body, category, tags) VALUES (?, ?, ?, ?)`,
    args: [data.title, data.body ?? null, data.category, data.tags ?? null],
  })
  return Number(result.lastInsertRowid)
}

export async function getAllJournalEntries(): Promise<JournalEntryRow[]> {
  await initJournalDb()
  const result = await getDb().execute(
    `SELECT * FROM journal_entries ORDER BY created_at DESC`
  )
  return result.rows as unknown as JournalEntryRow[]
}

export async function deleteJournalEntry(id: number): Promise<void> {
  await getDb().execute({ sql: `DELETE FROM journal_entries WHERE id = ?`, args: [id] })
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export interface ReactionCounts {
  likes: number
  dislikes: number
  userReaction: 'like' | 'dislike' | null
}

export async function toggleReaction(
  entryId: string,
  reaction: 'like' | 'dislike',
  visitorId: number,
): Promise<ReactionCounts> {
  await initJournalDb()
  const db = getDb()

  const existing = await db.execute({
    sql: `SELECT reaction FROM journal_reactions WHERE entry_id = ? AND visitor_id = ?`,
    args: [entryId, visitorId],
  })

  if (existing.rows.length > 0) {
    const current = existing.rows[0].reaction as string
    if (current === reaction) {
      // Same reaction — remove (toggle off)
      await db.execute({
        sql: `DELETE FROM journal_reactions WHERE entry_id = ? AND visitor_id = ?`,
        args: [entryId, visitorId],
      })
    } else {
      // Different reaction — update
      await db.execute({
        sql: `UPDATE journal_reactions SET reaction = ? WHERE entry_id = ? AND visitor_id = ?`,
        args: [reaction, entryId, visitorId],
      })
    }
  } else {
    await db.execute({
      sql: `INSERT INTO journal_reactions (entry_id, reaction, visitor_id) VALUES (?, ?, ?)`,
      args: [entryId, reaction, visitorId],
    })
  }

  return getReactionCounts(entryId, visitorId)
}

export async function getReactionCounts(entryId: string, visitorId?: number): Promise<ReactionCounts> {
  const db = getDb()
  const counts = await db.execute({
    sql: `SELECT reaction, COUNT(*) as cnt FROM journal_reactions WHERE entry_id = ? GROUP BY reaction`,
    args: [entryId],
  })
  let likes = 0, dislikes = 0
  for (const row of counts.rows) {
    if (row.reaction === 'like') likes = Number(row.cnt)
    if (row.reaction === 'dislike') dislikes = Number(row.cnt)
  }
  let userReaction: 'like' | 'dislike' | null = null
  if (visitorId) {
    const mine = await db.execute({
      sql: `SELECT reaction FROM journal_reactions WHERE entry_id = ? AND visitor_id = ?`,
      args: [entryId, visitorId],
    })
    if (mine.rows.length > 0) userReaction = mine.rows[0].reaction as 'like' | 'dislike'
  }
  return { likes, dislikes, userReaction }
}

export async function getBulkReactionCounts(
  entryIds: string[],
  visitorId?: number,
): Promise<Map<string, ReactionCounts>> {
  if (!entryIds.length) return new Map()
  const db = getDb()
  const placeholders = entryIds.map(() => '?').join(',')

  const counts = await db.execute({
    sql: `SELECT entry_id, reaction, COUNT(*) as cnt FROM journal_reactions WHERE entry_id IN (${placeholders}) GROUP BY entry_id, reaction`,
    args: entryIds,
  })

  const map = new Map<string, ReactionCounts>()
  for (const id of entryIds) map.set(id, { likes: 0, dislikes: 0, userReaction: null })
  for (const row of counts.rows) {
    const id = row.entry_id as string
    const r = map.get(id)!
    if (row.reaction === 'like') r.likes = Number(row.cnt)
    if (row.reaction === 'dislike') r.dislikes = Number(row.cnt)
  }

  if (visitorId) {
    const mine = await db.execute({
      sql: `SELECT entry_id, reaction FROM journal_reactions WHERE entry_id IN (${placeholders}) AND visitor_id = ?`,
      args: [...entryIds, visitorId],
    })
    for (const row of mine.rows) {
      const r = map.get(row.entry_id as string)
      if (r) r.userReaction = row.reaction as 'like' | 'dislike'
    }
  }

  return map
}

// ─── Visitor questions ────────────────────────────────────────────────────────

export interface QuestionRow {
  id: number
  question: string
  visitor_id: number | null
  visitor_name: string | null
  created_at: string
  answered: number
  answer: string | null
}

export async function createQuestion(data: {
  question: string
  visitorId?: number
  visitorName?: string
}): Promise<number> {
  await initJournalDb()
  const result = await getDb().execute({
    sql: `INSERT INTO visitor_questions (question, visitor_id, visitor_name) VALUES (?, ?, ?)`,
    args: [data.question, data.visitorId ?? null, data.visitorName ?? null],
  })
  return Number(result.lastInsertRowid)
}

export async function getAllQuestions(): Promise<QuestionRow[]> {
  await initJournalDb()
  const result = await getDb().execute(
    `SELECT * FROM visitor_questions ORDER BY created_at DESC`
  )
  return result.rows as unknown as QuestionRow[]
}

export async function deleteQuestion(id: number): Promise<void> {
  await getDb().execute({ sql: `DELETE FROM visitor_questions WHERE id = ?`, args: [id] })
}

export async function answerQuestion(id: number, answer: string): Promise<void> {
  await getDb().execute({
    sql: `UPDATE visitor_questions SET answered = 1, answer = ? WHERE id = ?`,
    args: [answer, id],
  })
}
