import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dateInDays, makeTicketCode } from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(path.join(dataDir, 'event-portal.db'))

db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))

function uniqueTicket() {
  for (let i = 0; i < 8; i += 1) {
    const code = makeTicketCode()
    if (!db.prepare('SELECT 1 FROM registrations WHERE ticket_code = ?').get(code)) return code
  }
  return `EVT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
}

function seedAdmin() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM admins').get().count
  if (existing > 0) return

  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync('admin123', salt, 64).toString('hex')
  db.prepare('INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)').run('admin', hash, salt)
}

const CATEGORIES = [
  ['Music', '#a78bfa'],
  ['Technology', '#38bdf8'],
  ['Sports', '#34d399'],
  ['Art', '#f472b6'],
  ['Business', '#fbbf24'],
  ['Food', '#fb7185'],
  ['Wellness', '#2dd4bf'],
  ['Film', '#c084fc'],
]

const EVENTS = [
  {
    title: 'Neon Nights Music Festival',
    category: 'Music',
    emoji: '🎧',
    venue: 'Pulse Arena',
    city: 'San Francisco',
    offset: 18,
    start: '19:00',
    end: '23:30',
    capacity: 5000,
    price: 79,
    featured: 1,
    description:
      "Three stages, twelve artists and a laser-lit skyline. Neon Nights brings the city's loudest electronic, indie and hip-hop acts together for one unforgettable night.",
  },
  {
    title: 'AI & The Future Summit',
    category: 'Technology',
    emoji: '🤖',
    venue: 'Moscone West',
    city: 'San Francisco',
    offset: 12,
    start: '09:00',
    end: '18:00',
    capacity: 800,
    price: 149,
    featured: 1,
    description:
      'A full day with the builders shaping autonomous systems, creative models and the next wave of the web. Keynotes, live demos and deep-dive workshops included.',
  },
  {
    title: 'Street Food Carnival',
    category: 'Food',
    emoji: '🌮',
    venue: 'Central Plaza',
    city: 'Austin',
    offset: 5,
    start: '12:00',
    end: '22:00',
    capacity: 1500,
    price: 10,
    featured: 0,
    description:
      "Forty trucks, live salsa and a dessert alley that never ends. Bring an appetite and cast your vote for the city's best bite of the year.",
  },
  {
    title: 'Canvas & Corks Art Evening',
    category: 'Art',
    emoji: '🎨',
    venue: 'Downtown Gallery',
    city: 'New York',
    offset: 8,
    start: '18:30',
    end: '21:30',
    capacity: 80,
    price: 45,
    featured: 0,
    description:
      'A guided painting session with a glass of wine in hand. All materials, aprons and a frame for your finished piece are included.',
  },
  {
    title: 'Startup Pitch Battle',
    category: 'Business',
    emoji: '🚀',
    venue: 'Innovation Hub',
    city: 'Seattle',
    offset: 15,
    start: '17:00',
    end: '21:00',
    capacity: 300,
    price: 0,
    featured: 0,
    description:
      "Twelve founders, six minutes each and a room full of investors. Watch the region's sharpest early-stage teams compete for the grand prize.",
  },
  {
    title: 'Midnight City Run',
    category: 'Sports',
    emoji: '🏃',
    venue: 'Riverside Park',
    city: 'Chicago',
    offset: 26,
    start: '21:00',
    end: '23:30',
    capacity: 2000,
    price: 25,
    featured: 0,
    description:
      'A glow-in-the-dark 10K through the lit-up riverfront. Headlamps, pacing groups and a finish-line party come with your bib.',
  },
  {
    title: 'Wellness & Yoga Retreat',
    category: 'Wellness',
    emoji: '🧘',
    venue: 'Lakeside Resort',
    city: 'Denver',
    offset: 31,
    start: '07:00',
    end: '16:00',
    capacity: 120,
    price: 89,
    featured: 0,
    description:
      'A slow morning of breathwork, flow and lakeside meditation. Lunch, a tea ceremony and a guided nature walk are all part of the day.',
  },
  {
    title: 'Indie Film Showcase',
    category: 'Film',
    emoji: '🎬',
    venue: 'Grand Cinema',
    city: 'Portland',
    offset: 21,
    start: '18:00',
    end: '23:00',
    capacity: 220,
    price: 30,
    featured: 0,
    description:
      'Six short films from emerging directors, followed by a Q&A with the filmmakers. Your ticket includes popcorn and a program zine.',
  },
  {
    title: 'Gaming Expo Xtreme',
    category: 'Technology',
    emoji: '🎮',
    venue: 'Expo Hall',
    city: 'Miami',
    offset: 38,
    start: '10:00',
    end: '20:00',
    capacity: 3000,
    price: 55,
    featured: 1,
    description:
      'Hands-on demos, esports finals and unreleased titles before anyone else. Meet studios, join tournaments and take home exclusive swag.',
  },
  {
    title: 'Symphony Under the Stars',
    category: 'Music',
    emoji: '🎻',
    venue: 'Moonlight Amphitheater',
    city: 'Nashville',
    offset: 45,
    start: '19:30',
    end: '22:00',
    capacity: 900,
    price: 65,
    featured: 0,
    description:
      'An open-air evening of film scores and modern classics. Bring a blanket, grab a drink and let the orchestra carry the night.',
  },
]

const FIRST_NAMES = ['Ava', 'Liam', 'Maya', 'Noah', 'Zoe', 'Ethan', 'Nina', 'Leo', 'Amara', 'Kai', 'Sofia', 'Owen']
const LAST_NAMES = ['Patel', 'Nguyen', 'Garcia', 'Kim', 'Okafor', 'Silva', 'Haddad', 'Novak', 'Chen', 'Ali', 'Rossi', 'Meyer']
const FILL_RATIOS = [0.284, 0.575, 0.347, 0.888, 0.693, 0.39, 0.867, 0.586, 0.32, 0.431]

function seedDemoData() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM events').get().count
  if (existing > 0) return

  db.exec('BEGIN')
  try {
    const categoryIds = new Map()
    const insertCategory = db.prepare('INSERT INTO categories (name, accent) VALUES (?, ?)')
    for (const [name, accent] of CATEGORIES) {
      const info = insertCategory.run(name, accent)
      categoryIds.set(name, Number(info.lastInsertRowid))
    }

    const insertEvent = db.prepare(`
      INSERT INTO events
        (title, description, category_id, emoji, venue, city, event_date, start_time, end_time, capacity, price, featured, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const event of EVENTS) {
      insertEvent.run(
        event.title,
        event.description,
        categoryIds.get(event.category),
        event.emoji,
        event.venue,
        event.city,
        dateInDays(event.offset),
        event.start,
        event.end,
        event.capacity,
        event.price,
        event.featured,
        new Date(Date.now() - 40 * 86400000).toISOString(),
      )
    }

    const events = db.prepare('SELECT id, capacity FROM events ORDER BY id').all()
    const insertRegistration = db.prepare(
      'INSERT INTO registrations (event_id, name, email, ticket_code, created_at) VALUES (?, ?, ?, ?, ?)',
    )

    events.forEach((event, eventIndex) => {
      const ratio = FILL_RATIOS[eventIndex % FILL_RATIOS.length]
      const target = Math.min(event.capacity, Math.max(1, Math.round(event.capacity * ratio)))
      for (let i = 0; i < target; i += 1) {
        const first = FIRST_NAMES[(i * 5 + eventIndex) % FIRST_NAMES.length]
        const last = LAST_NAMES[(i * 7 + eventIndex * 3) % LAST_NAMES.length]
        const email = `${first.toLowerCase()}.${last.toLowerCase()}${eventIndex}${i}@example.com`
        const createdAt = new Date(
          Date.now() - Math.round(Math.random() * 24 + 1) * 86400000 - Math.round(Math.random() * 20) * 3600000,
        ).toISOString()
        insertRegistration.run(event.id, `${first} ${last}`, email, uniqueTicket(), createdAt)
      }
    })

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

seedAdmin()
seedDemoData()
