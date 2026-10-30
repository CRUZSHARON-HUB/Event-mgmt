# Orbit — Event Management Portal

A full-stack event management portal with a 3D WebGL hero, tilt-reactive event cards, instant
ticket reservations, and a complete admin console — backed by a real SQL database.

![Stack](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![Stack](https://img.shields.io/badge/Three.js-r169-8b5cf6?style=flat-square)
![Stack](https://img.shields.io/badge/Express-4-111?style=flat-square)
![Stack](https://img.shields.io/badge/SQLite-node%3Asqlite-34d399?style=flat-square)

---

## Features

**Public portal**
- 3D WebGL hero scene (Three.js / React Three Fiber) with orbit rings, satellites, star field and
  cursor parallax
- CSS 3D tilt cards with light glare, animated gradients and category accents
- Browse and filter events by category, keyword (title, venue, city) and price/popularity
- Event detail modal with seat availability and a validated registration form
- Instant ticket code, copy-to-clipboard and `.ics` calendar download
- Fully responsive (desktop, tablet, mobile) with reduced-motion support

**Admin console**
- Session-based sign-in (8-hour token, stored in `sessionStorage`)
- Dashboard KPIs: events, registrations, revenue, capacity
- Top-events chart, latest registrations feed, category mix
- Create / edit / delete events with server-side field validation
- Attendee table with search, event filter and CSV export

**Backend**
- Express REST API with parameterised SQL queries (no SQL injection)
- SQLite database via Node's built-in `node:sqlite` module — no native compilation, no DB server
- Capacity enforced inside a transaction; duplicate email prevented per event
- Passwords hashed with `scrypt` + per-admin salt; login rate limiting
- Auto-generated demo data on first run (10 events, ~5,000 registrations)

---

## Requirements

- **Node.js 24 or newer** (the backend uses the built-in `node:sqlite` module; Node 22.13+ also
  works, older versions do not)
- npm 10+

No database server needs to be installed — SQLite is embedded.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Run frontend + API together (dev mode)
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:4300>
- Vite proxies `/api` to the Express server.
- Change the API port with `PORT=4400 npm start`; the Vite dev proxy defaults to `4300`.

### Production-style run (single port)

```bash
npm install
npm run build
npm start
```

Open <http://localhost:4300> — Express serves the built React app and the API from the same origin.

### Demo admin login

| Username | Password |
| -------- | -------- |
| `admin`  | `admin123` |

The credentials hint is also shown on the admin sign-in screen.

---

## Project structure

```
event-management-portal/
├── client/
│   ├── index.html
│   ├── public/favicon.svg
│   └── src/
│       ├── main.jsx            # React entry + router
│       ├── App.jsx             # Layout, routes, toast provider
│       ├── api.js              # Fetch wrapper for the REST API
│       ├── format.js           # Date/price helpers, ICS download
│       ├── styles.css          # Design system (glass UI, 3D cards, responsive)
│       ├── components/
│       │   ├── Hero3D.jsx      # Three.js scene (rings, knot, stars, parallax)
│       │   ├── EventCard.jsx   # 3D tilt event card
│       │   ├── EventModal.jsx  # Details + reservation + ticket
│       │   ├── AdminEventForm.jsx
│       │   ├── Navbar.jsx      # Sticky glass nav + 3D cube logo
│       │   ├── Footer.jsx
│       │   ├── Modal.jsx       # Portal, ESC/backdrop close, scroll lock
│       │   ├── Toast.jsx
│       │   └── Icons.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Events.jsx
│           └── Admin.jsx
├── server/
│   ├── index.js                # Express app + REST endpoints
│   ├── db.js                   # SQLite connection + seed data
│   ├── schema.sql              # Tables, keys, constraints, indexes
│   ├── utils.js                # Ticket codes, date helpers
│   └── data/                   # SQLite file (created at first run, gitignored)
├── package.json
├── vite.config.js
└── README.md
```

---

## Database schema

SQL is defined in [`server/schema.sql`](server/schema.sql). Tables:

| Table           | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `categories`    | Event categories with accent colour                                     |
| `events`        | Title, description, venue, city, date/time, capacity, price, featured   |
| `registrations` | Attendee name/email/ticket code; unique per `(event_id, email)`         |
| `admins`        | Admin username + scrypt password hash + salt                            |

Key constraints:
- `registrations.event_id` → `events.id` with `ON DELETE CASCADE`
- `UNIQUE (event_id, email)` prevents duplicate sign-ups
- Unique ticket codes, indexed date and registration lookups

Seats left is derived (`capacity − COUNT(registrations)`), so the numbers can never drift out of sync.
Registration runs inside `BEGIN IMMEDIATE … COMMIT`, so two people cannot grab the last seat.

The SQLite file lives at `server/data/event-portal.db`. Delete it to reset the demo data.

---

## API reference

| Method | Endpoint                       | Auth  | Description                                        |
| ------ | ------------------------------ | ----- | -------------------------------------------------- |
| GET    | `/api/health`                  | —     | Service heartbeat                                  |
| GET    | `/api/categories`              | —     | Categories with event counts                       |
| GET    | `/api/events`                  | —     | List events (`search`, `category`, `sort`, `featured`, `limit`) |
| GET    | `/api/events/:id`              | —     | Single event with seats left                       |
| POST   | `/api/events/:id/register`     | —     | Reserve a seat, returns ticket code                |
| POST   | `/api/admin/login`             | —     | Get a bearer token                                 |
| POST   | `/api/admin/logout`            | Token | Revoke current token                               |
| GET    | `/api/admin/stats`             | Token | Dashboard totals, top events, recent registrations |
| GET    | `/api/admin/registrations`     | Token | Attendee list (`eventId`, `limit`)                 |
| POST   | `/api/events`                  | Token | Create event                                       |
| PUT    | `/api/events/:id`              | Token | Update event                                       |
| DELETE | `/api/events/:id`              | Token | Delete event (+ its registrations)                 |

Admin endpoints expect `Authorization: Bearer <token>`.

Example:

```bash
curl http://localhost:4300/api/events?category=Music&sort=popular

curl -X POST http://localhost:4300/api/events/1/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Rivera","email":"alex@example.com"}'
```

---

## Notes

- The WebGL hero degrades gracefully: if 3D is unavailable, the CSS glow/fallback remains.
- No paid APIs, external databases or API keys are used. Google Fonts is the only external asset;
  the layout falls back to system fonts if offline.
- Demo data and credentials are for development only. Before deploying publicly, change the admin
  password (update the `admins` row with a new scrypt hash), add HTTPS, and restrict CORS/hosts as
  needed.
