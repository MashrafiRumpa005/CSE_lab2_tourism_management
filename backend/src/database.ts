import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const databasePath = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'farflung.db')
mkdirSync(dirname(databasePath), { recursive: true })

export const database = new Database(databasePath)
database.pragma('journal_mode = WAL')
database.pragma('foreign_keys = ON')
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

export type UserRecord = {
  id: number
  full_name: string
  email: string
  password_hash: string
  created_at: string
}

export type PublicUser = Omit<UserRecord, 'password_hash'>

export const findUserByEmail = database.prepare<[string], UserRecord>(
  'SELECT id, full_name, email, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE',
)

export const insertUser = database.prepare<[string, string, string]>(
  'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
)

export const findUserById = database.prepare<[number], PublicUser>(
  'SELECT id, full_name, email, created_at FROM users WHERE id = ?',
)

export const insertSession = database.prepare<[string, number, string]>(
  'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
)

export const findSessionUser = database.prepare<[string, string], PublicUser>(`
  SELECT users.id, users.full_name, users.email, users.created_at
  FROM sessions
  INNER JOIN users ON users.id = sessions.user_id
  WHERE sessions.token = ? AND sessions.expires_at > ?
`)

export const deleteSession = database.prepare<[string]>('DELETE FROM sessions WHERE token = ?')
