import { useState } from 'react'
import { api } from '../api.js'
import { downloadIcs, fillPercent, formatFullDate, formatPrice } from '../format.js'
import { useToast } from './Toast.jsx'
import Modal from './Modal.jsx'
import {
  IconAlert,
  IconCalendar,
  IconCheck,
  IconClock,
  IconClose,
  IconPin,
  IconTicket,
} from './Icons.jsx'

export default function EventModal({ event, onClose, onRegistered }) {
  const { push } = useToast()
  const [name, setName] = useState(() => localStorage.getItem('orbit.attendee.name') || '')
  const [email, setEmail] = useState(() => localStorage.getItem('orbit.attendee.email') || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [copied, setCopied] = useState(false)

  const pct = fillPercent(event)
  const firstName = ticket?.name?.split(/\s+/)[0] || 'friend'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    const cleanEmail = email.trim()
    if (cleanName.length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const data = await api.register(event.id, { name: cleanName, email: cleanEmail })
      setTicket(data.registration)
      localStorage.setItem('orbit.attendee.name', cleanName)
      localStorage.setItem('orbit.attendee.email', cleanEmail)
      push('Seat reserved — your ticket is ready.', 'success')
      onRegistered?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(ticket.ticket_code)
      setCopied(true)
      push('Ticket code copied to clipboard.', 'info')
      setTimeout(() => setCopied(false), 2200)
    } catch {
      push('Could not copy automatically — select the code instead.', 'error')
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="event-modal-title" className="event-modal">
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close event details">
        <IconClose size={18} />
      </button>

      <div className="modal-art" style={{ '--accent': event.accent }}>
        <span className="modal-art-glow" aria-hidden="true" />
        <span className="modal-emoji" aria-hidden="true">
          {event.emoji}
        </span>
        <span className="event-cat">
          <span className="dot" />
          {event.category}
        </span>
        <h2 id="event-modal-title">{event.title}</h2>
        <p className="modal-desc">{event.description}</p>

        <ul className="detail-list">
          <li>
            <IconCalendar size={17} />
            <span>
              <small>Date</small>
              {formatFullDate(event.event_date)}
            </span>
          </li>
          <li>
            <IconClock size={17} />
            <span>
              <small>Time</small>
              {event.start_time} – {event.end_time}
            </span>
          </li>
          <li>
            <IconPin size={17} />
            <span>
              <small>Venue</small>
              {event.venue}, {event.city}
            </span>
          </li>
          <li>
            <IconTicket size={17} />
            <span>
              <small>Entry</small>
              {formatPrice(event.price)} per seat
            </span>
          </li>
        </ul>

        <div className="modal-capacity">
          <div className="capacity-labels">
            <span>
              {event.registered.toLocaleString('en-US')} / {event.capacity.toLocaleString('en-US')} seats taken
            </span>
            <span>{pct}% full</span>
          </div>
          <div className="capacity-track">
            <span
              className="capacity-fill"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${event.accent}, rgba(255,255,255,.6))`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="modal-form">
        {ticket ? (
          <div className="ticket-success">
            <span className="success-mark">
              <IconCheck size={22} />
            </span>
            <span className="eyebrow">Reservation confirmed</span>
            <h3>You're in, {firstName}.</h3>
            <p className="muted">
              Your seat for <strong>{ticket.event.title}</strong> is locked in. Keep this ticket code
              handy — it's your entry pass.
            </p>

            <div className="ticket-code">
              <div>
                <small>Ticket code</small>
                <strong>{ticket.ticket_code}</strong>
              </div>
              <button type="button" className="btn btn-soft btn-sm" onClick={copyCode}>
                {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>

            <ul className="ticket-meta">
              <li>
                <IconCalendar size={15} /> {formatFullDate(ticket.event.event_date)}
              </li>
              <li>
                <IconClock size={15} /> {ticket.event.start_time} – {ticket.event.end_time}
              </li>
              <li>
                <IconPin size={15} /> {ticket.event.venue}, {ticket.event.city}
              </li>
            </ul>

            <div className="ticket-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => downloadIcs(ticket.event, ticket.ticket_code)}
              >
                Add to calendar
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Done
              </button>
            </div>

            <p className="fine-print">
              Confirmation for {ticket.email}. Demo mode — no email is actually sent.
            </p>
          </div>
        ) : (
          <>
            <div className="reserve-head">
              <h3>Reserve your seat</h3>
              <p className="muted small">Instant confirmation. No payment is taken in this demo.</p>
            </div>

            {event.sold_out ? (
              <div className="sold-out">
                <span aria-hidden="true">🛰️</span>
                <h4>Every seat is taken</h4>
                <p>This event is fully booked. There are plenty of other orbits to explore.</p>
                <button type="button" className="btn btn-soft btn-block" onClick={onClose}>
                  Back to the portal
                </button>
              </div>
            ) : (
              <form className="reserve-form" onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="reserve-name">Full name</label>
                  <input
                    id="reserve-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    autoComplete="name"
                    maxLength={80}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="reserve-email">Email address</label>
                  <input
                    id="reserve-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    autoComplete="email"
                    maxLength={160}
                    required
                  />
                </div>

                {error && (
                  <p className="form-error" role="alert">
                    <IconAlert size={15} /> {error}
                  </p>
                )}

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                  {submitting ? (
                    'Reserving your seat…'
                  ) : (
                    <>
                      Reserve my seat <span className="price-tag">{formatPrice(event.price)}</span>
                    </>
                  )}
                </button>

                <p className="fine-print">
                  You'll receive a ticket code instantly. All demo data is stored in the local SQLite
                  database.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
