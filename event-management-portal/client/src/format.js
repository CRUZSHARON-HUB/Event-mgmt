export function eventDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`)
}

export function formatDate(dateStr) {
  return eventDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatFullDate(dateStr) {
  return eventDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function dateParts(dateStr) {
  const date = eventDate(dateStr)
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

export function formatPrice(price) {
  const value = Number(price) || 0
  if (value <= 0) return 'Free'
  return `$${value.toFixed(value % 1 ? 2 : 0)}`
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatDateTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fillPercent(event) {
  if (!event?.capacity) return 0
  return Math.min(100, Math.round((event.registered / event.capacity) * 100))
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function compact(dateStr, time) {
  return `${dateStr.replaceAll('-', '')}T${time.replace(':', '')}00`
}

export function downloadIcs(event, ticketCode) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Orbit Events//EN',
    'BEGIN:VEVENT',
    `UID:${ticketCode}@orbit.events`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${compact(event.event_date, event.start_time)}`,
    `DTEND:${compact(event.event_date, event.end_time || event.start_time)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${[event.venue, event.city].filter(Boolean).join(', ')}`,
    `DESCRIPTION:${(event.description || 'Orbit event reservation').replace(/\n/g, ' ')} Ticket: ${ticketCode}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
