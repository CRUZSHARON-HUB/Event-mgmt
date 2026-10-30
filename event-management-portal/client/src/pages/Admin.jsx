import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, NAME_KEY, TOKEN_KEY } from '../api.js'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPrice,
  fillPercent,
  initials,
} from '../format.js'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import AdminEventForm from '../components/AdminEventForm.jsx'
import { CubeLogo } from '../components/Navbar.jsx'
import {
  IconAlert,
  IconCalendar,
  IconCash,
  IconCheck,
  IconDownload,
  IconEdit,
  IconLogout,
  IconPlus,
  IconSearch,
  IconShield,
  IconTicket,
  IconTrash,
  IconUsers,
} from '../components/Icons.jsx'

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onLogin(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <section className="auth-wrap container">
      <div className="auth-card">
        <div className="auth-orb" aria-hidden="true">
          <CubeLogo />
        </div>
        <span className="eyebrow">
          <IconShield size={14} /> Admin access
        </span>
        <h1>Mission control</h1>
        <p className="lede">
          Sign in to create events, monitor capacity and manage attendee registrations.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              <IconAlert size={15} /> {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to console'}
          </button>
        </form>

        <button
          type="button"
          className="demo-credentials"
          onClick={() => {
            setUsername('admin')
            setPassword('admin123')
          }}
        >
          <span>
            Demo credentials <strong>admin / admin123</strong>
          </span>
          <span className="demo-fill">Fill in</span>
        </button>

        <Link to="/" className="back-link">
          ← Back to the portal
        </Link>
      </div>
    </section>
  )
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <article className="stat-card" style={{ '--accent': accent }}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-sub">{sub}</span>
      <span className="stat-glow" aria-hidden="true" />
    </article>
  )
}

export default function Admin() {
  const { push } = useToast()
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [adminName, setAdminName] = useState(() => sessionStorage.getItem(NAME_KEY) || 'admin')
  const [booting, setBooting] = useState(Boolean(token))
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [regTotal, setRegTotal] = useState(0)
  const [regEvent, setRegEvent] = useState('')
  const [regSearch, setRegSearch] = useState('')
  const [form, setForm] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [version, setVersion] = useState(0)
  const [error, setError] = useState('')

  const signOut = useCallback(
    (notify) => {
      const current = sessionStorage.getItem(TOKEN_KEY)
      if (current) api.logout(current).catch(() => {})
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(NAME_KEY)
      setToken(null)
      setAdminName('admin')
      setStats(null)
      setEvents([])
      setRegistrations([])
      setRegTotal(0)
      setTab('overview')
      setForm(null)
      setConfirmTarget(null)
      if (notify) push('Signed out of the admin console.', 'info')
    },
    [push],
  )

  const handleLogin = useCallback(async (username, password) => {
    const data = await api.login(username, password)
    sessionStorage.setItem(TOKEN_KEY, data.token)
    sessionStorage.setItem(NAME_KEY, data.username)
    setAdminName(data.username)
    setToken(data.token)
  }, [])

  useEffect(() => {
    if (!token) {
      setBooting(false)
      return undefined
    }

    let active = true
    setBooting(true)
    setError('')

    Promise.all([api.stats(token), api.events(), api.categories()])
      .then(([statsData, eventsData, categoriesData]) => {
        if (!active) return
        setStats(statsData)
        setEvents(eventsData.events)
        setCategories(categoriesData.categories)
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 401) signOut(false)
        else setError(err.message)
      })
      .finally(() => {
        if (active) setBooting(false)
      })

    return () => {
      active = false
    }
  }, [token, version, signOut])

  useEffect(() => {
    if (!token) return undefined

    let active = true
    api
      .registrations(token, regEvent || undefined)
      .then((data) => {
        if (!active) return
        setRegistrations(data.registrations)
        setRegTotal(data.total)
      })
      .catch((err) => {
        if (active && err.status === 401) signOut(false)
      })

    return () => {
      active = false
    }
  }, [token, regEvent, version, signOut])

  const visibleRegs = useMemo(() => {
    const query = regSearch.trim().toLowerCase()
    if (!query) return registrations
    return registrations.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.ticket_code.toLowerCase().includes(query),
    )
  }, [registrations, regSearch])

  function exportCsv() {
    const lines = [
      ['Name', 'Email', 'Ticket', 'Event', 'Event date', 'Registered'],
      ...visibleRegs.map((row) => [
        row.name,
        row.email,
        row.ticket_code,
        row.event_title,
        row.event_date,
        row.created_at,
      ]),
    ]
    const csv = lines
      .map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `orbit-registrations-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    push(`${visibleRegs.length} registration${visibleRegs.length === 1 ? '' : 's'} exported.`, 'success')
  }

  async function handleDelete(event) {
    try {
      await api.deleteEvent(token, event.id)
      setConfirmTarget(null)
      push(`“${event.title}” deleted.`, 'success')
      setVersion((value) => value + 1)
    } catch (err) {
      push(err.message, 'error')
    }
  }

  if (!token) return <AdminLogin onLogin={handleLogin} />

  if (booting) {
    return (
      <section className="admin-loading container">
        <span className="spinner" aria-hidden="true" />
        <p>Syncing mission control…</p>
      </section>
    )
  }

  if (!stats) {
    return (
      <section className="empty-state container">
        <span className="empty-emoji" aria-hidden="true">
          📡
        </span>
        <h3>Could not load the dashboard</h3>
        <p>{error || 'The API did not respond.'}</p>
        <div className="empty-actions">
          <button type="button" className="btn btn-soft" onClick={() => setVersion((value) => value + 1)}>
            Retry
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => signOut(false)}>
            Sign out
          </button>
        </div>
      </section>
    )
  }

  return (
    <>
      <header className="admin-head container">
        <div>
          <span className="eyebrow">
            <IconShield size={14} /> Admin console
          </span>
          <h1>Mission control</h1>
          <p className="muted">
            Signed in as <strong>{adminName}</strong> · {stats.totals.upcoming} upcoming event
            {stats.totals.upcoming === 1 ? '' : 's'} · {stats.totals.fillRate}% of all seats filled
          </p>
        </div>
        <div className="admin-head-actions">
          <Link to="/" className="btn btn-ghost btn-sm">
            View site
          </Link>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => signOut(true)}>
            <IconLogout size={15} /> Sign out
          </button>
        </div>
      </header>

      <div className="container admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          className={`tab${tab === 'overview' ? ' active' : ''}`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'events'}
          className={`tab${tab === 'events' ? ' active' : ''}`}
          onClick={() => setTab('events')}
        >
          Events <span className="tab-count">{events.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'registrations'}
          className={`tab${tab === 'registrations' ? ' active' : ''}`}
          onClick={() => setTab('registrations')}
        >
          Registrations <span className="tab-count">{regTotal}</span>
        </button>
        <span className="tabs-spacer" />
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm({ event: null })}>
          <IconPlus size={15} /> New event
        </button>
      </div>

      <div className="container admin-body">
        {tab === 'overview' && (
          <>
            <div className="stat-grid">
              <StatCard
                icon={<IconCalendar size={20} />}
                accent="#a78bfa"
                label="Total events"
                value={stats.totals.events}
                sub={`${stats.totals.upcoming} upcoming`}
              />
              <StatCard
                icon={<IconUsers size={20} />}
                accent="#22d3ee"
                label="Registrations"
                value={Number(stats.totals.registrations).toLocaleString('en-US')}
                sub={`${stats.totals.fillRate}% of all seats filled`}
              />
              <StatCard
                icon={<IconCash size={20} />}
                accent="#34d399"
                label="Ticket revenue"
                value={formatMoney(stats.totals.revenue)}
                sub="Based on current registrations"
              />
              <StatCard
                icon={<IconTicket size={20} />}
                accent="#f472b6"
                label="Seats available"
                value={Math.max(0, stats.totals.seats - stats.totals.registrations).toLocaleString('en-US')}
                sub={`${Number(stats.totals.seats).toLocaleString('en-US')} total capacity`}
              />
            </div>

            <div className="admin-grid">
              <section className="panel">
                <div className="panel-head">
                  <h3>Top events</h3>
                  <span className="muted small">by registrations</span>
                </div>
                <div className="bar-list">
                  {stats.topEvents.map((event) => {
                    const pct = event.capacity
                      ? Math.min(100, Math.round((event.registered / event.capacity) * 100))
                      : 0
                    return (
                      <div className="bar-row" key={event.id}>
                        <div className="bar-labels">
                          <span>
                            <span aria-hidden="true">{event.emoji}</span> {event.title}
                          </span>
                          <span>
                            {Number(event.registered).toLocaleString('en-US')}{' '}
                            <small>/ {Number(event.capacity).toLocaleString('en-US')}</small>
                          </span>
                        </div>
                        <div className="bar-track">
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>Latest registrations</h3>
                  <button type="button" className="text-link subtle" onClick={() => setTab('registrations')}>
                    View all
                  </button>
                </div>
                <ul className="recent-list">
                  {stats.recent.map((item) => (
                    <li key={item.id}>
                      <span className="avatar">{initials(item.name)}</span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.event_title}</small>
                      </div>
                      <span className="recent-time">{formatDateTime(item.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="panel category-panel">
              <div className="panel-head">
                <h3>Category mix</h3>
                <span className="muted small">events per category</span>
              </div>
              <div className="category-mix">
                {stats.categories.map((category) => (
                  <span className="mix-chip" key={category.name} style={{ '--accent': category.accent }}>
                    <span className="dot" style={{ background: category.accent }} />
                    {category.name}
                    <strong>{category.events}</strong>
                  </span>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'events' && (
          <section className="panel">
            <div className="panel-head">
              <h3>All events</h3>
              <span className="muted small">{events.length} total</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Seats</th>
                    <th>Price</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className="table-event">
                          <span className="table-emoji" style={{ '--accent': event.accent }}>
                            {event.emoji}
                          </span>
                          <div>
                            <strong>{event.title}</strong>
                            <small>
                              <span className="dot" style={{ background: event.accent }} />
                              {event.category}
                              {event.featured ? ' · Featured' : ''}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="nowrap">{formatDate(event.event_date)}</span>
                        <small className="cell-sub">{event.start_time}</small>
                      </td>
                      <td>
                        <span>{event.venue}</span>
                        <small className="cell-sub">{event.city}</small>
                      </td>
                      <td>
                        <div className="mini-capacity">
                          <span>
                            {Number(event.registered).toLocaleString('en-US')} /{' '}
                            {Number(event.capacity).toLocaleString('en-US')}
                          </span>
                          <div className="bar-track sm">
                            <span style={{ width: `${fillPercent(event)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>{formatPrice(event.price)}</td>
                      <td className="right">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setForm({ event })}
                            aria-label={`Edit ${event.title}`}
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => setConfirmTarget(event)}
                            aria-label={`Delete ${event.title}`}
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'registrations' && (
          <section className="panel">
            <div className="panel-head wrap">
              <div>
                <h3>Attendee registrations</h3>
                <span className="muted small">
                  Showing {visibleRegs.length} of {regTotal}
                </span>
              </div>
              <div className="panel-tools">
                <div className="search-box sm">
                  <IconSearch size={16} />
                  <input
                    type="search"
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    placeholder="Search name, email or code"
                    aria-label="Search registrations"
                  />
                </div>
                <div className="select-wrap">
                  <label htmlFor="reg-event" className="sr-only">
                    Filter by event
                  </label>
                  <select id="reg-event" value={regEvent} onChange={(e) => setRegEvent(e.target.value)}>
                    <option value="">All events</option>
                    {events.map((event) => (
                      <option value={event.id} key={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={exportCsv}
                  disabled={!visibleRegs.length}
                >
                  <IconDownload size={15} /> Export CSV
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Event</th>
                    <th>Ticket</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRegs.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="attendee">
                          <span className="avatar sm">{initials(row.name)}</span>
                          <div>
                            <strong>{row.name}</strong>
                            <small>{row.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span>{row.event_title}</span>
                        <small className="cell-sub">{formatDate(row.event_date)}</small>
                      </td>
                      <td>
                        <code className="ticket-pill">{row.ticket_code}</code>
                      </td>
                      <td>{formatDateTime(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleRegs.length && (
                <p className="table-empty">
                  <IconCheck size={16} /> No registrations match these filters yet.
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {form && (
        <AdminEventForm
          initial={form.event}
          categories={categories}
          token={token}
          onClose={() => setForm(null)}
          onSaved={() => setVersion((value) => value + 1)}
        />
      )}

      {confirmTarget && (
        <Modal className="modal-confirm" onClose={() => setConfirmTarget(null)} labelledBy="confirm-title">
          <span className="confirm-icon" aria-hidden="true">
            <IconTrash size={20} />
          </span>
          <h3 id="confirm-title">Delete “{confirmTarget.title}”?</h3>
          <p className="muted">
            This permanently removes the event and its{' '}
            {Number(confirmTarget.registered).toLocaleString('en-US')} registration
            {confirmTarget.registered === 1 ? '' : 's'}. This cannot be undone.
          </p>
          <div className="confirm-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={() => handleDelete(confirmTarget)}>
              Delete event
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
