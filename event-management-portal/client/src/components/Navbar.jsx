import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { IconArrow } from './Icons.jsx'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/events', label: 'Events' },
  { to: '/admin', label: 'Admin' },
]

export function CubeLogo() {
  return (
    <span className="cube-wrap" aria-hidden="true">
      <span className="cube">
        <span className="cube-face face-front" />
        <span className="cube-face face-back" />
        <span className="cube-face face-right" />
        <span className="cube-face face-left" />
        <span className="cube-face face-top" />
        <span className="cube-face face-bottom" />
      </span>
    </span>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="nav-shell">
      <nav className="nav" aria-label="Main navigation">
        <Link to="/" className="brand" aria-label="Orbit Events home">
          <CubeLogo />
          <span className="brand-text">
            <strong>orbit</strong>
            <small>event portal</small>
          </span>
        </Link>

        <div className="nav-links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          <Link to="/events" className="btn btn-primary btn-sm nav-cta">
            Browse events <IconArrow size={15} />
          </Link>
          <button
            type="button"
            className={`burger${open ? ' open' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={`mobile-menu${open ? ' open' : ''}`}>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `mobile-link${isActive ? ' active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
        <Link to="/events" className="btn btn-primary btn-block">
          Browse events
        </Link>
      </div>
    </header>
  )
}
