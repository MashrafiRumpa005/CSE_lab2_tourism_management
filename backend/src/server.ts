import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import {
  database,
  DEFAULT_PACKAGE_CAPACITY,
  deleteSession,
  findAllPackages,
  findBookingById,
  findBookingsByUserId,
  findPackageById,
  findSessionUser,
  findUserByEmail,
  findUserById,
  getPackageBookedCount,
  insertBooking,
  insertSession,
  insertUser,
} from './database.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)
const scrypt = promisify(scryptCallback)
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

const publicUser = (user: { id: number; full_name: string; email: string; created_at: string }) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  createdAt: user.created_at,
})

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

const verifyPassword = async (password: string, storedHash: string) => {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const storedKey = Buffer.from(key, 'hex')
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

const readSessionToken = (request: express.Request) => {
  const cookies = request.headers.cookie?.split(';').map((cookie) => cookie.trim()) ?? []
  return cookies.find((cookie) => cookie.startsWith('farflung_session='))?.split('=')[1]
}

const setSessionCookie = (response: express.Response, token: string) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `farflung_session=${token}; HttpOnly; Path=/; Max-Age=${sessionDurationMs / 1000}; SameSite=Lax${secure}`)
}

app.post('/api/auth/signup', async (request, response) => {
  const fullName = typeof request.body?.fullName === 'string' ? request.body.fullName.trim() : ''
  const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''

  if (!fullName || !email || password.length < 8) {
    response.status(400).json({ message: 'Name, valid email, and an 8-character password are required.' })
    return
  }

  if (findUserByEmail.get(email)) {
    response.status(409).json({ message: 'An account with that email already exists.' })
    return
  }

  try {
    const result = insertUser.run(fullName, email, await hashPassword(password))
    const user = findUserById.get(Number(result.lastInsertRowid))
    if (!user) throw new Error('User was not created')

    const token = randomBytes(32).toString('hex')
    insertSession.run(token, user.id, new Date(Date.now() + sessionDurationMs).toISOString())
    setSessionCookie(response, token)
    response.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      response.status(409).json({ message: 'An account with that email already exists.' })
      return
    }
    response.status(500).json({ message: 'Could not create the account.' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const email = typeof request.body?.email === 'string' ? normalizeEmail(request.body.email) : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  const user = findUserByEmail.get(email)

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    response.status(401).json({ message: 'Email or password is incorrect.' })
    return
  }

  const token = randomBytes(32).toString('hex')
  insertSession.run(token, user.id, new Date(Date.now() + sessionDurationMs).toISOString())
  setSessionCookie(response, token)
  response.json({ user: publicUser(user) })
})

app.get('/api/auth/me', (request, response) => {
  const token = readSessionToken(request)
  const user = token ? findSessionUser.get(token, new Date().toISOString()) : undefined
  if (!user) {
    response.status(401).json({ message: 'You are not signed in.' })
    return
  }
  response.json({ user: publicUser(user) })
})

app.post('/api/auth/logout', (request, response) => {
  const token = readSessionToken(request)
  if (token) deleteSession.run(token)
  response.setHeader('Set-Cookie', 'farflung_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  response.status(204).send()
})

const isValidPositiveInteger = (val: unknown): boolean => {
  if (typeof val === 'number') {
    return Number.isInteger(val) && val > 0
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val.trim())
    return Number.isInteger(num) && num > 0
  }
  return false
}

const isValidCalendarDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const dateObj = new Date(Date.UTC(year, month - 1, day))
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  )
}

app.post('/api/bookings', (request, response) => {
  const token = readSessionToken(request)
  const user = token ? findSessionUser.get(token, new Date().toISOString()) : undefined
  if (!user) {
    response.status(401).json({ message: 'You are not signed in.' })
    return
  }

  const rawPackageId = request.body?.package_id !== undefined ? request.body.package_id : request.body?.packageId
  const rawTravelDate = request.body?.travel_date !== undefined ? request.body.travel_date : request.body?.travelDate
  const rawTravelersCount = request.body?.travelers_count !== undefined ? request.body.travelers_count : request.body?.travelersCount

  // 1. Validate package_id
  if (rawPackageId === undefined || rawPackageId === null || (typeof rawPackageId === 'string' && rawPackageId.trim() === '')) {
    response.status(400).json({ message: 'Package ID is required.' })
    return
  }
  if (!isValidPositiveInteger(rawPackageId)) {
    response.status(400).json({ message: 'Package ID must be a valid positive integer.' })
    return
  }

  // 2. Validate travel_date
  if (rawTravelDate === undefined || rawTravelDate === null || (typeof rawTravelDate === 'string' && rawTravelDate.trim() === '')) {
    response.status(400).json({ message: 'Travel date is required.' })
    return
  }
  if (typeof rawTravelDate !== 'string' || !isValidCalendarDate(rawTravelDate.trim())) {
    response.status(400).json({ message: 'Travel date must be a valid date in YYYY-MM-DD format.' })
    return
  }

  // 3. Validate travelers_count
  if (rawTravelersCount === undefined || rawTravelersCount === null || (typeof rawTravelersCount === 'string' && rawTravelersCount.trim() === '')) {
    response.status(400).json({ message: 'Number of travelers is required.' })
    return
  }
  if (!isValidPositiveInteger(rawTravelersCount)) {
    response.status(400).json({ message: 'Number of travelers must be a positive integer greater than 0.' })
    return
  }

  const packageId = Number(rawPackageId)
  const travelDate = String(rawTravelDate).trim()
  const travelersCount = Number(rawTravelersCount)

  const pkg = findPackageById.get(packageId)
  if (!pkg) {
    response.status(404).json({ message: 'Tourism package not found.' })
    return
  }

  // Check whether the requested package has enough availability for the requested travelers_count
  const packageCapacity = (pkg as any).capacity ?? DEFAULT_PACKAGE_CAPACITY
  const bookedTravelers = getPackageBookedCount.get(pkg.id)?.total ?? 0
  const availableCapacity = packageCapacity - bookedTravelers

  if (travelersCount > availableCapacity) {
    response.status(400).json({ message: 'Not enough availability for this package.' })
    return
  }

  // Calculate total price on server using package price stored in database
  const totalPrice = pkg.price * travelersCount

  try {
    const result = insertBooking.run(user.id, pkg.id, travelDate, travelersCount, totalPrice, 'confirmed')
    const booking = findBookingById.get(Number(result.lastInsertRowid))
    if (!booking) {
      throw new Error('Booking could not be retrieved')
    }

    response.status(201).json({
      success: true,
      booking: {
        id: booking.id,
        user_id: booking.user_id,
        package_id: booking.package_id,
        travel_date: booking.travel_date,
        travelers_count: booking.travelers_count,
        total_price: booking.total_price,
        status: booking.status,
        created_at: booking.created_at,
      },
    })
  } catch (error) {
    response.status(500).json({ message: 'Could not create the booking.' })
  }
})

app.get('/api/bookings/my', (request, response) => {
  const token = readSessionToken(request)
  const user = token ? findSessionUser.get(token, new Date().toISOString()) : undefined
  if (!user) {
    response.status(401).json({ message: 'You are not signed in.' })
    return
  }

  const userBookings = findBookingsByUserId.all(user.id)
  const bookings = userBookings.map((b) => {
    const pkg = findPackageById.get(b.package_id)
    return {
      id: b.id,
      booking_id: b.id,
      package_id: b.package_id,
      package_title: pkg?.title ?? '',
      destination: pkg?.destination ?? '',
      travel_date: b.travel_date,
      travelers_count: b.travelers_count,
      total_price: b.total_price,
      status: b.status,
      created_at: b.created_at,
    }
  })

  response.json(bookings)
})


app.get('/api/packages', (_request, response) => {
  try {
    const packages = findAllPackages.all().map((pkg) => ({
      ...pkg,
      highlights: JSON.parse(pkg.highlights),
    }))
    response.json({ packages })
  } catch {
    response.status(500).json({ message: 'Could not retrieve packages.' })
  }
})

app.get('/api/packages/:id', (request, response) => {
  const id = Number(request.params.id)
  if (!id || isNaN(id) || id <= 0) {
    response.status(400).json({ message: 'Invalid package ID.' })
    return
  }
  const pkg = findPackageById.get(id)
  if (!pkg) {
    response.status(404).json({ message: 'Tourism package not found.' })
    return
  }
  response.json({
    package: {
      ...pkg,
      highlights: JSON.parse(pkg.highlights),
    },
  })
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'backend' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[backend] listening on http://localhost:${port}`)
  })
}

export { app }

process.on('SIGINT', () => {
  database.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  database.close()
  process.exit(0)
})
