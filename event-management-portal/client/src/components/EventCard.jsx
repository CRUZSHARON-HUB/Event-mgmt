import { useRef } from 'react'
import { dateParts, fillPercent, formatDate, formatPrice } from '../format.js'
import { IconArrow, IconClock, IconPin } from './Icons.jsx'

export default function EventCard({ event, onOpen }) {
  const cardRef = useRef(null)
  const pct = fillPercent(event)
  const { day, month } = dateParts(event.event_date)

  function handleMove(e) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    card.style.setProperty('--rx', `${(0.5 - py) * 10}deg`)
    card.style.setProperty('--ry', `${(px - 0.5) * 12}deg`)
    card.style.setProperty('--mx', `${px * 100}%`)
    card.style.setProperty('--my', `${py * 100}%`)
  }

  function handleLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--rx', '0deg')
    card.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="tilt-wrap">
      <article
        ref={cardRef}
        className="tilt event-card"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div className="event-banner" style={{ '--accent': event.accent }}>
          <span className="banner-halo" aria-hidden="true" />
          <span className="banner-date">
            <strong>{day}</strong>
            <span>{month}</span>
          </span>
          <span className="event-emoji" aria-hidden="true">
            {event.emoji}
          </span>
          <span className="event-cat">
            <span className="dot" />
            {event.category}
          </span>
          <span className={`event-price${Number(event.price) === 0 ? ' free' : ''}`}>
            {formatPrice(event.price)}
          </span>
        </div>

        <div className="event-body">
          <h3>{event.title}</h3>
          <p className="event-meta">
            <IconPin size={15} /> {event.venue} · {event.city}
          </p>
          <p className="event-meta">
            <IconClock size={15} /> {formatDate(event.event_date)} · {event.start_time}
          </p>

          <div className="capacity">
            <div className="capacity-labels">
              <span>{event.sold_out ? 'Sold out' : `${event.seats_left.toLocaleString('en-US')} seats left`}</span>
              <span>{pct}% full</span>
            </div>
            <div className="capacity-track">
              <span
                className="capacity-fill"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${event.accent}, rgba(255,255,255,.55))`,
                }}
              />
            </div>
          </div>

          <button type="button" className="btn btn-soft btn-block event-cta" onClick={() => onOpen(event)}>
            View &amp; reserve <IconArrow size={16} />
          </button>
        </div>

        <span className="tilt-glare" aria-hidden="true" />
      </article>
    </div>
  )
}
