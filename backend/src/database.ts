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
    role TEXT NOT NULL DEFAULT 'traveler',
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
    image TEXT NOT NULL DEFAULT '',
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

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,
    style TEXT NOT NULL,
    duration TEXT NOT NULL,
    from_price REAL NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, package_id)
  );
`)

try { database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'traveler'") } catch {}

try { database.exec("ALTER TABLE packages ADD COLUMN image TEXT NOT NULL DEFAULT ''") } catch {}
try { database.exec("ALTER TABLE destinations ADD COLUMN image TEXT NOT NULL DEFAULT ''") } catch {}

database.prepare(`
  INSERT OR IGNORE INTO users (full_name, email, password_hash, role)
  VALUES (?, ?, ?, 'admin')
`).run(
  'Farflung Admin',
  'admin@farflung.local',
  'adminsalt123456:91f303e36eed906fb8fdc0a5c0934084297ac5ea7137e5b1ea7cb46b032a4fae142f2665addd7389d0561028275c402092c97b9257e9f60415ae305d4b85757c',
)

const initialDestinations = [
  ['Kyoto', 'Japan', 'Asia', 'Culture', '7 days', 1180, 'Temple gardens, lantern-lit lanes, and a slower rhythm at the edge of the Higashiyama hills.'],
  ['Santorini', 'Greece', 'Europe', 'Beach', '5 days', 940, 'Whitewashed cliffs, caldera views, and a coastline built for long sunsets.'],
  ['Patagonia', 'Argentina · Chile', 'Americas', 'Adventure', '10 days', 1640, 'Glacier trails, granite towers, and wide-open silence at the edge of the map.'],
  ['Marrakech', 'Morocco', 'Africa', 'Culture', '6 days', 860, 'Souks, riads, and the Atlas Mountains rising beyond the city walls.'],
]
if ((database.prepare('SELECT COUNT(*) AS count FROM destinations').get() as { count: number }).count === 0) {
  const seedDestination = database.prepare('INSERT INTO destinations (name, country, region, style, duration, from_price, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const destination of initialDestinations) seedDestination.run(...destination)
}

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
  role: 'traveler' | 'admin'
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
  image: string
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

export type DestinationRecord = {
  id: number
  name: string
  country: string
  region: string
  style: string
  duration: string
  from_price: number
  description: string
  image: string
  created_at: string
}

export type ReviewRecord = {
  id: number
  user_id: number
  package_id: number
  rating: number
  comment: string
  status: string
  created_at: string
  full_name?: string
}

export const findUserByEmail = database.prepare<[string], UserRecord>(
  'SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE email = ? COLLATE NOCASE',
)

export const insertUser = database.prepare<[string, string, string]>(
  "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'traveler')",
)

export const findUserById = database.prepare<[number], PublicUser>(
  'SELECT id, full_name, email, role, created_at FROM users WHERE id = ?',
)

export const insertSession = database.prepare<[string, number, string]>(
  'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
)

export const findSessionUser = database.prepare<[string, string], PublicUser>(`
  SELECT users.id, users.full_name, users.email, users.role, users.created_at
  FROM sessions
  INNER JOIN users ON users.id = sessions.user_id
  WHERE sessions.token = ? AND sessions.expires_at > ?
`)

export const deleteSession = database.prepare<[string]>('DELETE FROM sessions WHERE token = ?')

export const findAllPackages = database.prepare<[], PackageRecord>(
  'SELECT id, title, destination, days, price, route, detail, highlights, image, created_at FROM packages ORDER BY id ASC',
)

export const findPackageById = database.prepare<[number], PackageRecord>(
  'SELECT id, title, destination, days, price, route, detail, highlights, image, created_at FROM packages WHERE id = ?',
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

export const updateBookingStatus = database.prepare<[string, number]>(
  'UPDATE bookings SET status = ? WHERE id = ?',
)

export const findAllDestinations = database.prepare<[], DestinationRecord>('SELECT * FROM destinations ORDER BY id ASC')
export const findDestinationById = database.prepare<[number], DestinationRecord>('SELECT * FROM destinations WHERE id = ?')
export const insertDestination = database.prepare<[string, string, string, string, string, number, string, string]>(
  'INSERT INTO destinations (name, country, region, style, duration, from_price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
)
export const updateDestination = database.prepare<[string, string, string, string, string, number, string, string, number]>(
  'UPDATE destinations SET name = ?, country = ?, region = ?, style = ?, duration = ?, from_price = ?, description = ?, image = ? WHERE id = ?',
)
export const deleteDestination = database.prepare<[number]>('DELETE FROM destinations WHERE id = ?')

export const insertPackage = database.prepare<[string, string, string, number, string, string, string, string]>(
  'INSERT INTO packages (title, destination, days, price, route, detail, highlights, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
)
export const updatePackage = database.prepare<[string, string, string, number, string, string, string, string, number]>(
  'UPDATE packages SET title = ?, destination = ?, days = ?, price = ?, route = ?, detail = ?, highlights = ?, image = ? WHERE id = ?',
)
export const deletePackage = database.prepare<[number]>('DELETE FROM packages WHERE id = ?')
export const findAllBookings = database.prepare<[], BookingRecord & { full_name: string; email: string; package_title: string }>(`
  SELECT bookings.*, users.full_name, users.email, packages.title AS package_title
  FROM bookings INNER JOIN users ON users.id = bookings.user_id INNER JOIN packages ON packages.id = bookings.package_id
  ORDER BY bookings.created_at DESC
`)
export const insertReview = database.prepare<[number, number, number, string]>('INSERT INTO reviews (user_id, package_id, rating, comment) VALUES (?, ?, ?, ?)')
export const findReviewsByPackage = database.prepare<[number], ReviewRecord>(`
  SELECT reviews.*, users.full_name FROM reviews INNER JOIN users ON users.id = reviews.user_id
  WHERE package_id = ? AND status = 'published' ORDER BY reviews.created_at DESC
`)
export const findAllReviews = database.prepare<[], ReviewRecord & { package_title: string }>(`
  SELECT reviews.*, users.full_name, packages.title AS package_title FROM reviews
  INNER JOIN users ON users.id = reviews.user_id INNER JOIN packages ON packages.id = reviews.package_id ORDER BY reviews.created_at DESC
`)
export const updateReviewStatus = database.prepare<[string, number]>('UPDATE reviews SET status = ? WHERE id = ?')
export const deleteReview = database.prepare<[number]>('DELETE FROM reviews WHERE id = ?')



