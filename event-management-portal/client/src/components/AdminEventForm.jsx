import { useState } from 'react'
import { api } from '../api.js'
import { useToast } from './Toast.jsx'
import Modal from './Modal.jsx'
import { IconAlert, IconClose } from './Icons.jsx'

function defaultDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function AdminEventForm({ initial, categories, token, onClose, onSaved }) {
  const { push } = useToast()
  const isEdit = Boolean(initial)

  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    category_id: initial?.category_id ?? categories[0]?.id ?? '',
    emoji: initial?.emoji || '🎟️',
    venue: initial?.venue || '',
    city: initial?.city || '',
    event_date: initial?.event_date || defaultDate(),
    start_time: initial?.start_time || '18:00',
    end_time: initial?.end_time || '22:00',
    capacity: initial?.capacity ?? 100,
    price: initial?.price ?? 0,
    description: initial?.description || '',
    featured: Boolean(initial?.featured),
  }))
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setErrors({})
    setSaving(true)

    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        capacity: Number(form.capacity),
        price: Number(form.price),
      }
      if (isEdit) await api.updateEvent(token, initial.id, payload)
      else await api.createEvent(token, payload)

      push(isEdit ? 'Event updated.' : 'Event created and live.', 'success')
      onSaved()
      onClose()
    } catch (err) {
      if (err.fields) setErrors(err.fields)
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="event-form-title" className="modal-single">
      <div className="modal-head">
        <div>
          <span className="eyebrow">{isEdit ? 'Edit' : 'Create'}</span>
          <h2 id="event-form-title">{isEdit ? 'Update event' : 'Launch a new event'}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close event form">
          <IconClose size={18} />
        </button>
      </div>

      <form className="event-form" onSubmit={handleSubmit} noValidate>
        {message && (
          <p className="form-alert" role="alert">
            <IconAlert size={16} /> {message}
          </p>
        )}

        <div className="field">
          <label htmlFor="event-title">Event title</label>
          <input
            id="event-title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Neon Nights Music Festival"
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="event-category">Category</label>
            <select
              id="event-category"
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
              aria-invalid={Boolean(errors.category_id)}
            >
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <span className="field-error">{errors.category_id}</span>}
          </div>
          <div className="field field-narrow">
            <label htmlFor="event-emoji">Emoji</label>
            <input
              id="event-emoji"
              value={form.emoji}
              onChange={(e) => update('emoji', e.target.value)}
              placeholder="🎟️"
              maxLength={4}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="event-venue">Venue</label>
            <input
              id="event-venue"
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
              placeholder="Pulse Arena"
              maxLength={120}
              aria-invalid={Boolean(errors.venue)}
            />
            {errors.venue && <span className="field-error">{errors.venue}</span>}
          </div>
          <div className="field">
            <label htmlFor="event-city">City</label>
            <input
              id="event-city"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              placeholder="San Francisco"
              maxLength={80}
              aria-invalid={Boolean(errors.city)}
            />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>
        </div>

        <div className="field-row three">
          <div className="field">
            <label htmlFor="event-date">Date</label>
            <input
              id="event-date"
              type="date"
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
              aria-invalid={Boolean(errors.event_date)}
            />
            {errors.event_date && <span className="field-error">{errors.event_date}</span>}
          </div>
          <div className="field">
            <label htmlFor="event-start">Start time</label>
            <input
              id="event-start"
              type="time"
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
              aria-invalid={Boolean(errors.start_time)}
            />
            {errors.start_time && <span className="field-error">{errors.start_time}</span>}
          </div>
          <div className="field">
            <label htmlFor="event-end">End time</label>
            <input
              id="event-end"
              type="time"
              value={form.end_time}
              onChange={(e) => update('end_time', e.target.value)}
              aria-invalid={Boolean(errors.end_time)}
            />
            {errors.end_time && <span className="field-error">{errors.end_time}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="event-capacity">Capacity</label>
            <input
              id="event-capacity"
              type="number"
              min="1"
              max="100000"
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
              aria-invalid={Boolean(errors.capacity)}
            />
            {errors.capacity && <span className="field-error">{errors.capacity}</span>}
          </div>
          <div className="field">
            <label htmlFor="event-price">Price (USD)</label>
            <input
              id="event-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              aria-invalid={Boolean(errors.price)}
            />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="event-description">Description</label>
          <textarea
            id="event-description"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What makes this event unmissable? Two or three sentences works best."
            maxLength={2000}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <label className="switch-field">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => update('featured', e.target.checked)}
          />
          <span className="switch" aria-hidden="true" />
          <span>
            <strong>Feature on the home page</strong>
            <small>Featured events appear in the handpicked highlights row.</small>
          </span>
        </label>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
