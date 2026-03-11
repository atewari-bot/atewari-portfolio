import bcrypt from 'bcryptjs'
import { getDb, initDb } from './db'

const ADMIN_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'password123'

export async function initAdminDb() {
  await initDb()
  const db = getDb()

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Seed default password hash if not already set
  const existing = await db.execute({
    sql: `SELECT value FROM admin_config WHERE key = 'password_hash'`,
    args: [],
  })

  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    await db.execute({
      sql: `INSERT INTO admin_config (key, value) VALUES ('password_hash', ?)`,
      args: [hash],
    })
  }
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  await initAdminDb()

  if (username !== ADMIN_USERNAME) return false

  const result = await getDb().execute({
    sql: `SELECT value FROM admin_config WHERE key = 'password_hash'`,
    args: [],
  })

  if (result.rows.length === 0) return false

  return bcrypt.compare(password, result.rows[0].value as string)
}

export async function changePassword(newPassword: string): Promise<void> {
  await initAdminDb()
  const hash = await bcrypt.hash(newPassword, 12)
  await getDb().execute({
    sql: `UPDATE admin_config SET value = ? WHERE key = 'password_hash'`,
    args: [hash],
  })
}
