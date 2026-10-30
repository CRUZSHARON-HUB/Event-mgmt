import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import EventModal from '../components/EventModal.jsx'
import { api } from '../api.js'
import { IconAlert, IconClose, IconCompass, IconSearch } from '../components/Icons.jsx'

const SORTS = [
  { value: 'date', label: 'Soonest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
]

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [sort, setSort] = useState('date')
  const [categories, setCategories] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const requestRef = useRef(0)

  const paramCategory = searchParams.get('category') || 'All'

  useEffect(() => {
    setCategory(paramCategory)
  }, [paramCategory])

  useEffect(() => {
    let active = true
    api
      .categories()
      .then((data) => {
        if (active) setCategories(data.categories)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const requestId = ++requestRef.current
    setLoading(true)
    const timer = setTimeout(
      () => {
        api
          .events({
            search: search.trim(),
            category,
            sort: sort === 'date' ? undefined : sort,
          })
          .then((data) => {
            if (requestId !== requestRef.current) return
            setEvents(data.events)
            setError('')
          })
          .catch((err) => {
            if (requestId !== requestRef.current) return
            setError(err.message)
          })
          .finally(() => {
            if (requestId === requestRef.current) setLoading(false)
          })
      },
      search ? 280 : 0,
    )

    return () => clearTimeout(timer)
  }, [search, category, sort, refreshKey])

  const totalCount = useMemo(
    () => categories.reduce((sum, item) => sum + Number(item.event_count || 0), 0),
    [categories],
  )

  function pickCategory(name) {
    setCategory(name)
    if (name === 'All') setSearchParams({}, { replace: true })
    else setSearchParams({ category: name }, { replace: true })
  }

  function resetFilters() {
    setSearch('')
    setSort('date')
    pickCategory('All')
  }

  return (
    <>
      <header className="page-head container">
        <span className="eyebrow">
          <IconCompass size={14} /> The event universe
        </span>
        <h1>
          Browse <span className="grad-text">the orbit.</span>
        </h1>
        <p className="lede">
          Filter by category, city or keyword. Every card opens with full details and instant
          reservation.
        </p>
      </header>

      <section className="container events-page">
        <div className="filter-bar">
          <div className="search-box">
            <IconSearch size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, cities, venues…"
              aria-label="Search events"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                <IconClose size={15} />
              </button>
            )}
          </div>

          <div className="select-wrap">
            <label htmlFor="event-sort" className="sr-only">
              Sort events
            </label>
            <select id="event-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chip-row">
          <button
            type="button"
            className={`chip${category === 'All' ? ' active' : ''}`}
            onClick={() => pickCategory('All')}
          >
            All events
            <span className="chip-count">{totalCount || '·'}</span>
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`chip${category === item.name ? ' active' : ''}`}
              style={{ '--accent': item.accent }}
              onClick={() => pickCategory(item.name)}
            >
              <span className="dot" style={{ background: item.accent }} />
              {item.name}
              <span className="chip-count">{item.event_count}</span>
            </button>
          ))}
        </div>

        <div className="results-line">
          <span>
            {loading ? 'Scanning the orbit…' : `${events.length} event${events.length === 1 ? '' : 's'} found`}
            {category !== 'All' && !loading ? ` in ${category}` : ''}
            {search.trim() && !loading ? ` for “${search.trim()}”` : ''}
          </span>
          {(search || category !== 'All' || sort !== 'date') && (
            <button type="button" className="text-link subtle" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>

        {error ? (
          <div className="empty-state">
            <span className="empty-emoji" aria-hidden="true">
              📡
            </span>
            <h3>Signal lost</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-soft" onClick={() => setRefreshKey((value) => value + 1)}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="event-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="skeleton-card" key={index} aria-hidden="true">
                <div className="sk-banner" />
                <div className="sk-body">
                  <span className="sk-line w70" />
                  <span className="sk-line w45" />
                  <span className="sk-line w85" />
                  <span className="sk-line w60" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji" aria-hidden="true">
              🔭
            </span>
            <h3>No events in this orbit</h3>
            <p>Try another category or clear your search to see everything that's happening.</p>
            <button type="button" className="btn btn-soft" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((event, index) => (
              <div className="reveal" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }} key={event.id}>
                <EventCard event={event} onOpen={setSelected} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="inline-hint">
            <IconAlert size={15} /> Is the API running on port 4300?
          </p>
        )}
      </section>

      {selected && (
        <EventModal
          key={selected.id}
          event={selected}
          onClose={() => setSelected(null)}
          onRegistered={() => setRefreshKey((value) => value + 1)}
        />
      )}
    </>
  )
}
