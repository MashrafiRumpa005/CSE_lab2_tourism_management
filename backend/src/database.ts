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
  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    days TEXT NOT NULL,
    price REAL NOT NULL,
    route TEXT NOT NULL,
    detail TEXT NOT NULL,
    highlights TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    travel_date TEXT NOT NULL,
    travelers_count INTEGER NOT NULL DEFAULT 1,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const initialPackages = [
  {
    title: 'Kyoto, slowly',
    destination: 'Japan',
    days: '7 days',
    price: 1180,
    route: 'Dhaka -> Tokyo -> Kyoto',
    detail: 'Ryokan stay, daily breakfast, and Japan visa guidance.',
    highlights: JSON.stringify([
      'Arashiyama bamboo grove at sunrise',
      'Tea ceremony in Gion',
      'Day trip to Nara',
    ]),
  },
  {
    title: 'Santorini escape',
    destination: 'Greece',
    days: '5 days',
    price: 940,
    route: 'Dhaka -> Athens -> Santorini',
    detail: 'Caldera-facing stay, private sailing, and Schengen checklist.',
    highlights: JSON.stringify([
      'Sunset walk in Oia',
      'Private caldera sailing',
      'Wine tasting in Pyrgos',
    ]),
  },
  {
    title: 'Patagonia trek',
    destination: 'Argentina · Chile',
    days: '10 days',
    price: 1640,
    route: 'Dhaka -> Santiago -> Patagonia',
    detail: 'Trek lodge, guided camps, and border support for the W circuit.',
    highlights: JSON.stringify([
      'Torres del Paine W trek',
      'Glacier boat crossing',
      'Guided camp nights',
    ]),
  },
  {
    title: 'Marrakech & the Atlas',
    destination: 'Morocco',
    days: '6 days',
    price: 860,
    route: 'Dhaka -> Casablanca -> Marrakech',
    detail: 'A riad stay, local food, and document review before departure.',
    highlights: JSON.stringify([
      'Medina riad stay',
      'Atlas Mountains day hike',
      'Evening at Jemaa el-Fnaa',
    ]),
  },
]

const countPackages = database.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number }
if (countPackages.count === 0) {
  const insertPackage = database.prepare(`
    INSERT INTO packages (title, destination, days, price, route, detail, highlights)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const pkg of initialPackages) {
    insertPackage.run(
      pkg.title,
      pkg.destination,
      pkg.days,
      pkg.price,
      pkg.route,
      pkg.detail,
      pkg.highlights,
    )
  }
}

export type UserRecord = {
  id: number
  full_name: string
  email: string
  password_hash: string
  created_at: string
}

export type PublicUser = Omit<UserRecord, 'password_hash'>

export type PackageRecord = {
  id: number
  title: string
  destination: string
  days: string
  price: number
  route: string
  detail: string
  highlights: string
  created_at: string
}

export type BookingRecord = {
  id: number
  user_id: number
  package_id: number
  travel_date: string
  travelers_count: number
  total_price: number
  status: string
  created_at: string
}

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

export const findAllPackages = database.prepare<[], PackageRecord>(
  'SELECT id, title, destination, days, price, route, detail, highlights, created_at FROM packages ORDER BY id ASC',
)

export const findPackageById = database.prepare<[number], PackageRecord>(
  'SELECT id, title, destination, days, price, route, detail, highlights, created_at FROM packages WHERE id = ?',
)

export const insertBooking = database.prepare<[number, number, string, number, number, string]>(
  'INSERT INTO bookings (user_id, package_id, travel_date, travelers_count, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
)

export const findBookingById = database.prepare<[number], BookingRecord>(
  'SELECT id, user_id, package_id, travel_date, travelers_count, total_price, status, created_at FROM bookings WHERE id = ?',
)

export const findBookingsByUserId = database.prepare<[number], BookingRecord>(
  'SELECT id, user_id, package_id, travel_date, travelers_count, total_price, status, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
)

export const DEFAULT_PACKAGE_CAPACITY = 10

export const getPackageBookedCount = database.prepare<[number], { total: number }>(`
  SELECT COALESCE(SUM(travelers_count), 0) AS total
  FROM bookings
  WHERE package_id = ? AND status = 'confirmed'
`)



