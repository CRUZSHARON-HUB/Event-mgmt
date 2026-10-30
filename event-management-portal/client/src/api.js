const BASE = '/api'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Make sure the API is running.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status}).`)
    error.status = response.status
    error.fields = data.fields || null
    throw error
  }

  return data
}

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : ''
}

export const api = {
  events(params) {
    return request(`/events${toQuery(params)}`)
  },
  event(id) {
    return request(`/events/${id}`)
  },
  categories() {
    return request('/categories')
  },
  register(id, payload) {
    return request(`/events/${id}/register`, { method: 'POST', body: payload })
  },
  login(username, password) {
    return request('/admin/login', { method: 'POST', body: { username, password } })
  },
  logout(token) {
    return request('/admin/logout', { method: 'POST', token })
  },
  stats(token) {
    return request('/admin/stats', { token })
  },
  registrations(token, eventId) {
    return request(`/admin/registrations${toQuery({ eventId })}`, { token })
  },
  createEvent(token, payload) {
    return request('/events', { method: 'POST', body: payload, token })
  },
  updateEvent(token, id, payload) {
    return request(`/events/${id}`, { method: 'PUT', body: payload, token })
  },
  deleteEvent(token, id) {
    return request(`/events/${id}`, { method: 'DELETE', token })
  },
}

export const TOKEN_KEY = 'orbit.admin.token'
export const NAME_KEY = 'orbit.admin.name'
