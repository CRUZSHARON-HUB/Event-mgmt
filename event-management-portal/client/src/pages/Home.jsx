import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import EventModal from '../components/EventModal.jsx'
import Hero3D from '../components/Hero3D.jsx'
import { IconArrow, IconCompass, IconShield, IconSpark, IconTicket } from '../components/Icons.jsx'
import { api } from '../api.js'

const STEPS = [
  {
    emoji: '🔭',
    title: 'Explore the orbit',
    text: 'Browse curated events by category, city or vibe — every card opens a full event brief.',
    accent: '#a78bfa',
  },
  {
    emoji: '🎟️',
    title: 'Reserve in seconds',
    text: 'Enter your name and email to lock in a seat and receive a ticket code instantly.',
    accent: '#22d3ee',
  },
  {
    emoji: '🛰️',
    title: 'Run the whole show',
    text: 'Create events, track capacity and export attendee lists from the admin console.',
    accent: '#f472b6',
  },
]

export default function Home() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(() => {
    api
      .events()
      .then((data) => setEvents(data.events))
      .catch(() => {})
      .finally(() => setLoaded(true))
    api
      .categories()
      .then((data) => setCategories(data.categories))
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const featuredPool = events.filter((event) => event.featured)
  const featured = (featuredPool.length ? featuredPool : events).slice(0, 3)
  const cities = new Set(events.map((event) => event.city)).size
  const reserved = events.reduce((sum, event) => sum + event.registered, 0)

  const stats = [
    { value: events.length ? events.length : '—', label: 'Live events' },
    { value: cities || '—', label: 'Cities' },
    { value: reserved ? reserved.toLocaleString('en-US') : '—', label: 'Seats reserved' },
  ]

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="pulse-dot" /> Event management, reimagined in 3D
          </span>
          <h1>
            Discover events that <span className="grad-text">pull you in.</span>
          </h1>
          <p className="lede">
            Explore handpicked experiences, reserve your seat in seconds and run every event from a
            single luminous dashboard.
          </p>

          <div className="hero-actions">
            <Link to="/events" className="btn btn-primary btn-lg">
              Explore events <IconArrow size={17} />
            </Link>
            <Link to="/admin" className="btn btn-ghost btn-lg">
              <IconShield size={17} /> Admin console
            </Link>
          </div>

          <div className="hero-stats">
            {stats.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-glow" aria-hidden="true" />
          <Hero3D />
          <div className="float-chip chip-a">
            <span className="chip-icon">
              <IconTicket size={17} />
            </span>
            <span>
              <strong>Ticket confirmed</strong>
              <small>EVT-9F3A21 · Neon Nights</small>
            </span>
          </div>
          <div className="float-chip chip-b">
            <span className="chip-emoji" aria-hidden="true">
              🎤
            </span>
            <span>
              <strong>{events.length || 10} live events</strong>
              <small>across {cities || 10} cities</small>
            </span>
          </div>
          <div className="float-chip chip-c">
            <span className="chip-emoji" aria-hidden="true">
              🌐
            </span>
            <span>
              <strong>WebGL portal</strong>
              <small>move your cursor to explore</small>
            </span>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div className="marquee-group" key={copy}>
                {categories.map((category) => (
                  <span className="marquee-item" key={`${copy}-${category.id}`}>
                    <span className="dot" style={{ background: category.accent }} />
                    {category.name}
                  </span>
                ))}
                <span className="marquee-item">
                  <span className="dot" style={{ background: '#8b5cf6' }} />
                  {events.length || 10} events this season
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <IconCompass size={14} /> Browse by orbit
            </span>
            <h2>Every kind of gathering</h2>
          </div>
          <Link to="/events" className="text-link">
            All events <IconArrow size={16} />
          </Link>
        </div>

        <div className="category-grid">
          {categories.length
            ? categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className="category-card"
                  style={{ '--accent': category.accent }}
                  onClick={() => navigate(`/events?category=${encodeURIComponent(category.name)}`)}
                >
                  <strong>
                    <span className="dot" style={{ background: category.accent }} />
                    {category.name}
                  </strong>
                  <span className="category-count">
                    {category.event_count} event{category.event_count === 1 ? '' : 's'}
                  </span>
                  <IconArrow size={15} className="category-arrow" />
                </button>
              ))
            : Array.from({ length: 8 }).map((_, index) => (
                <div className="category-card skeleton" key={index} aria-hidden="true" />
              ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <IconSpark size={14} /> Featured this season
            </span>
            <h2>Handpicked highlights</h2>
          </div>
          <Link to="/events" className="text-link">
            Browse all <IconArrow size={16} />
          </Link>
        </div>

        <div className="event-grid">
          {featured.map((event, index) => (
            <div className="reveal" style={{ animationDelay: `${index * 90}ms` }} key={event.id}>
              <EventCard event={event} onOpen={setSelected} />
            </div>
          ))}
          {!loaded &&
            Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-card" key={`skeleton-${index}`} aria-hidden="true" />
            ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head center">
          <div>
            <span className="eyebrow">How it works</span>
            <h2>Three steps from curious to confirmed</h2>
          </div>
        </div>

        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <article className="step-card" style={{ '--accent': step.accent }} key={step.title}>
              <span className="step-index">0{index + 1}</span>
              <span className="step-icon" aria-hidden="true">
                {step.emoji}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="cta-panel">
          <div className="cta-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="cta-copy">
            <span className="eyebrow">For organizers</span>
            <h2>Launch your next event into orbit.</h2>
            <p>
              Create events, watch capacity fill in real time and manage every attendee from one
              console.
            </p>
          </div>
          <div className="cta-actions">
            <Link to="/admin" className="btn btn-primary btn-lg">
              <IconSpark size={17} /> Open admin console
            </Link>
            <Link to="/events" className="btn btn-ghost btn-lg">
              See what's on
            </Link>
          </div>
        </div>
      </section>

      {selected && (
        <EventModal
          key={selected.id}
          event={selected}
          onClose={() => setSelected(null)}
          onRegistered={load}
        />
      )}
    </>
  )
}
