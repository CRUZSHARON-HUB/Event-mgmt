import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { db } from './db.js'
import { makeTicketCode, todayISO } from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 4300
const SESSION_TTL = 8 * 60 * 60 * 1000
const distDir = path.join(__dirname, '..', 'client', 'dist')

app.disable('x-powered-by')
app.use(express.json({ limit: '200kb' }))

const sessions = new Map()
const loginAttempts = new Map()

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expiresAt = sessions.get(token)
  if (!expiresAt || expiresAt < Date.now()) {
    if (token) sessions.delete(token)
    return res.status(401).json({ error: 'Your admin session has expired. Please sign in again.' })
  }
  sessions.set(token, Date.now() + SESSION_TTL)
  return next()
}

const EVENT_SELECT = `
  SELECT e.id, e.title, e.description, e.emoji, e.venue, e.city, e.event_date,
         e.start_time, e.end_time, e.capacity, e.price, e.featured, e.created_at,
         c.id AS category_id, c.name AS category, c.accent,
         (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
  FROM events e
  JOIN categories c ON c.id = e.category_id
`

function shapeEvent(row) {
  if (!row) return null
  const registered = Number(row.registered) || 0
  return {
    ...row,
    price: Number(row.price),
    featured: Boolean(row.featured),
    registered,
    seats_left: Math.max(0, row.capacity - registered),
    sold_out: registered >= row.capacity,
  }
}

function parseId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateEventBody(rawBody) {
  const body = rawBody && typeof rawBody === 'object' ? rawBody : {}
  const fields = {}
  const data = {}

  data.title = cleanString(body.title)
  if (data.title.length < 3 || data.title.length > 120) fields.title = 'Title must be 3–120 characters.'

  data.description = cleanString(body.description)
  if (data.description.length < 20 || data.description.length > 2000) {
    fields.description = 'Description must be 20–2000 characters.'
  }

  const categoryId = Number(body.category_id)
  const category = Number.isInteger(categoryId)
    ? db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId)
    : null
  if (!category) fields.category_id = 'Choose a category.'
  else data.category_id = category.id

  data.emoji = Array.from(cleanString(body.emoji) || '🎟️').slice(0, 2).join('')

  data.venue = cleanString(body.venue)
  if (data.venue.length < 2 || data.venue.length > 120) fields.venue = 'Venue must be 2–120 characters.'

  data.city = cleanString(body.city)
  if (data.city.length < 2 || data.city.length > 80) fields.city = 'City must be 2–80 characters.'

  data.event_date = cleanString(body.event_date)
  const dateValid =
    /^\d{4}-\d{2}-\d{2}$/.test(data.event_date) &&
    !Number.isNaN(new Date(`${data.event_date}T12:00:00`).getTime())
  if (!dateValid) fields.event_date = 'Use a valid date.'

  const timeValid = (time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  data.start_time = cleanString(body.start_time)
  data.end_time = cleanString(body.end_time)
  if (!timeValid(data.start_time)) fields.start_time = 'Use a valid start time.'
  if (!timeValid(data.end_time)) fields.end_time = 'Use a valid end time.'
  if (!fields.start_time && !fields.end_time && data.end_time <= data.start_time) {
    fields.end_time = 'End time must be after the start time.'
  }

  const capacity = Number(body.capacity)
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
    fields.capacity = 'Capacity must be between 1 and 100,000.'
  } else {
    data.capacity = capacity
  }

  const price = Number(body.price)
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    fields.price = 'Price must be between 0 and 100,000.'
  } else {
    data.price = Math.round(price * 100) / 100
  }

  data.featured = body.featured ? 1 : 0

  return { data, fields }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'orbit-events-api', time: new Date().toISOString() })
})

app.get('/api/categories', (req, res) => {
  const categories = db
    .prepare(
      `SELECT c.id, c.name, c.accent, COUNT(e.id) AS event_count
       FROM categories c
       LEFT JOIN events e ON e.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`,
    )
    .all()
  res.json({ categories })
})

app.get('/api/events', (req, res) => {
  const { search, category, sort, featured } = req.query
  const conditions = []
  const params = []

  if (typeof search === 'string' && search.trim()) {
    const like = `%${search.trim().slice(0, 60)}%`
    conditions.push('(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.city LIKE ?)')
    params.push(like, like, like, like)
  }

  if (typeof category === 'string' && category.trim() && category !== 'All') {
    conditions.push('c.name = ?')
    params.push(category.trim())
  }

  if (featured === '1') conditions.push('e.featured = 1')
  if (req.query.upcoming === '1') {
    conditions.push('e.event_date >= ?')
    params.push(todayISO())
  }

  let orderBy = 'e.event_date ASC, e.start_time ASC'
  if (sort === 'popular') orderBy = 'registered DESC, e.event_date ASC'
  if (sort === 'price-low') orderBy = 'e.price ASC, e.event_date ASC'
  if (sort === 'price-high') orderBy = 'e.price DESC, e.event_date ASC'
  if (sort === 'newest') orderBy = 'e.created_at DESC'

  const limit = Math.min(Math.max(Number(req.query.limit) || 0, 0), 100)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `${EVENT_SELECT} ${where} ORDER BY ${orderBy}${limit ? ' LIMIT ?' : ''}`
  if (limit) params.push(limit)

  const events = db.prepare(sql).all(...params).map(shapeEvent)
  res.json({ events, today: todayISO() })
})

app.get('/api/events/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid event id.' })

  const row = db.prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(id)
  if (!row) return res.status(404).json({ error: 'Event not found.' })

  return res.json({ event: shapeEvent(row) })
})

app.post('/api/events/:id/register', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid event id.' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const name = cleanString(body.name)
  const email = cleanString(body.email).toLowerCase()

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Please enter your full name.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id)
  if (!event) return res.status(404).json({ error: 'Event not found.' })

  const eventEnd = new Date(`${event.event_date}T${event.end_time || '23:59'}:00`)
  if (!Number.isNaN(eventEnd.getTime()) && eventEnd.getTime() < Date.now()) {
    return res.status(400).json({ error: 'This event has already ended.' })
  }

  try {
    db.exec('BEGIN IMMEDIATE')

    const { count } = db.prepare('SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?').get(id)
    if (count >= event.capacity) {
      db.exec('ROLLBACK')
      return res.status(409).json({ error: 'This event is sold out.' })
    }

    const existing = db
      .prepare('SELECT ticket_code FROM registrations WHERE event_id = ? AND email = ?')
      .get(id, email)
    if (existing) {
      db.exec('ROLLBACK')
      return res.status(409).json({
        error: `This email is already registered for this event. Your ticket is ${existing.ticket_code}.`,
      })
    }

    let ticketCode = makeTicketCode()
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (!db.prepare('SELECT 1 FROM registrations WHERE ticket_code = ?').get(ticketCode)) break
      ticketCode = makeTicketCode()
    }

    const createdAt = new Date().toISOString()
    const info = db
      .prepare(
        'INSERT INTO registrations (event_id, name, email, ticket_code, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, name, email, ticketCode, createdAt)

    db.exec('COMMIT')

    return res.status(201).json({
      registration: {
        id: Number(info.lastInsertRowid),
        ticket_code: ticketCode,
        name,
        email,
        created_at: createdAt,
        event: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          start_time: event.start_time,
          end_time: event.end_time,
          venue: event.venue,
          city: event.city,
        },
      },
      seats_left: Math.max(0, event.capacity - count - 1),
    })
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      // transaction already closed
    }
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'This email is already registered for this event.' })
    }
    console.error(err)
    return res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

app.post('/api/admin/login', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const username = cleanString(body.username)
  const password = typeof body.password === 'string' ? body.password : ''

  const ip = req.ip || 'local'
  const now = Date.now()
  const attempt = loginAttempts.get(ip)
  if (!attempt || attempt.resetAt < now) {
    loginAttempts.set(ip, { count: 0, resetAt: now + 10 * 60 * 1000 })
  } else if (attempt.count >= 10) {
    return res.status(429).json({ error: 'Too many sign-in attempts. Try again in a few minutes.' })
  }

  const admin = username ? db.prepare('SELECT * FROM admins WHERE username = ?').get(username) : null
  let valid = false
  if (admin && password) {
    const hash = crypto.scryptSync(password, admin.salt, 64)
    const expected = Buffer.from(admin.password_hash, 'hex')
    valid = hash.length === expected.length && crypto.timingSafeEqual(hash, expected)
  }

  if (!valid) {
    const current = loginAttempts.get(ip)
    loginAttempts.set(ip, { count: (current?.count || 0) + 1, resetAt: current?.resetAt || now + 10 * 60 * 1000 })
    return res.status(401).json({ error: 'Invalid username or password.' })
  }

  loginAttempts.delete(ip)
  const token = crypto.randomBytes(24).toString('hex')
  sessions.set(token, Date.now() + SESSION_TTL)
  return res.json({ token, username: admin.username, expiresIn: SESSION_TTL })
})

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization.slice(7)
  sessions.delete(token)
  res.json({ ok: true })
})

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const today = todayISO()
  const totals = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM events) AS events,
         (SELECT COUNT(*) FROM events WHERE event_date >= ?) AS upcoming,
         (SELECT COUNT(*) FROM registrations) AS registrations,
         (SELECT COALESCE(SUM(e.price), 0) FROM registrations r JOIN events e ON e.id = r.event_id) AS revenue,
         (SELECT COALESCE(SUM(e.capacity), 0) FROM events e) AS seats`,
    )
    .get(today)

  const topEvents = db
    .prepare(
      `SELECT e.id, e.title, e.emoji, e.capacity, COUNT(r.id) AS registered
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       GROUP BY e.id
       ORDER BY registered DESC, e.title ASC
       LIMIT 6`,
    )
    .all()

  const recent = db
    .prepare(
      `SELECT r.id, r.name, r.email, r.ticket_code, r.created_at, e.title AS event_title
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       ORDER BY r.created_at DESC
       LIMIT 8`,
    )
    .all()

  const categories = db
    .prepare(
      `SELECT c.name, c.accent, COUNT(e.id) AS events
       FROM categories c
       LEFT JOIN events e ON e.category_id = c.id
       GROUP BY c.id
       ORDER BY events DESC, c.name ASC`,
    )
    .all()

  res.json({
    totals: {
      ...totals,
      revenue: Math.round(Number(totals.revenue) || 0),
      fillRate: totals.seats ? Math.round((totals.registrations / totals.seats) * 100) : 0,
    },
    topEvents,
    recent,
    categories,
  })
})

app.get('/api/admin/registrations', requireAdmin, (req, res) => {
  const eventId = req.query.eventId ? parseId(req.query.eventId) : null
  if (req.query.eventId && !eventId) return res.status(400).json({ error: 'Invalid event id.' })

  const limit = Math.min(Math.max(Number(req.query.limit) || 250, 1), 500)
  const where = eventId ? 'WHERE r.event_id = ?' : ''
  const params = eventId ? [eventId] : []

  const registrations = db
    .prepare(
      `SELECT r.id, r.name, r.email, r.ticket_code, r.created_at,
              e.id AS event_id, e.title AS event_title, e.event_date
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ?`,
    )
    .all(...params, limit)

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM registrations r ${eventId ? 'WHERE r.event_id = ?' : ''}`)
    .get(...params)

  res.json({ registrations, total, limit })
})

app.post('/api/events', requireAdmin, (req, res) => {
  const { data, fields } = validateEventBody(req.body)
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields })
  }

  const info = db
    .prepare(
      `INSERT INTO events
         (title, description, category_id, emoji, venue, city, event_date, start_time, end_time, capacity, price, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.title,
      data.description,
      data.category_id,
      data.emoji,
      data.venue,
      data.city,
      data.event_date,
      data.start_time,
      data.end_time,
      data.capacity,
      data.price,
      data.featured,
    )

  const row = db.prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(Number(info.lastInsertRowid))
  return res.status(201).json({ event: shapeEvent(row) })
})

app.put('/api/events/:id', requireAdmin, (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid event id.' })

  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Event not found.' })

  const { data, fields } = validateEventBody(req.body)
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields })
  }

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?').get(id)
  if (data.capacity < count) {
    return res.status(400).json({
      error: `Capacity cannot be lower than the ${count} seats already booked.`,
      fields: { capacity: `At least ${count} seats are already booked.` },
    })
  }

  db.prepare(
    `UPDATE events SET
        title = ?, description = ?, category_id = ?, emoji = ?, venue = ?, city = ?,
        event_date = ?, start_time = ?, end_time = ?, capacity = ?, price = ?, featured = ?
      WHERE id = ?`,
  ).run(
    data.title,
    data.description,
    data.category_id,
    data.emoji,
    data.venue,
    data.city,
    data.event_date,
    data.start_time,
    data.end_time,
    data.capacity,
    data.price,
    data.featured,
    id,
  )

  const row = db.prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(id)
  return res.json({ event: shapeEvent(row) })
})

app.delete('/api/events/:id', requireAdmin, (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid event id.' })

  const info = db.prepare('DELETE FROM events WHERE id = ?').run(id)
  if (!info.changes) return res.status(404).json({ error: 'Event not found.' })

  return res.json({ ok: true })
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' })
})

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }
  console.error(err)
  return res.status(500).json({ error: 'Unexpected server error.' })
})

setInterval(() => {
  const now = Date.now()
  for (const [token, expiresAt] of sessions) {
    if (expiresAt < now) sessions.delete(token)
  }
  for (const [ip, attempt] of loginAttempts) {
    if (attempt.resetAt < now) loginAttempts.delete(ip)
  }
}, 60 * 60 * 1000).unref()

app.listen(PORT, () => {
  console.log(`\n  Orbit Event Management Portal`)
  console.log(`  API + site: http://localhost:${PORT}`)
  if (!fs.existsSync(distDir)) {
    console.log('  No production build found — run "npm run build" or use "npm run dev".')
  }
  console.log('  Admin demo login: admin / admin123\n')
})
