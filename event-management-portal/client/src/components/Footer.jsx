import { Link } from 'react-router-dom'

const CATEGORY_LINKS = ['Music', 'Technology', 'Sports', 'Art', 'Business', 'Food']

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <span className="brand-orb" aria-hidden="true" />
            <span className="brand-text">
              <strong>orbit</strong>
              <small>event portal</small>
            </span>
          </Link>
          <p>
            A luminous 3D portal for discovering events, reserving seats and running the whole
            show from one dashboard.
          </p>
          <span className="footer-badge">React · Three.js · Express · SQLite</span>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/events">All events</Link>
          <Link to="/admin">Admin console</Link>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          {CATEGORY_LINKS.map((name) => (
            <Link key={name} to={`/events?category=${encodeURIComponent(name)}`}>
              {name}
            </Link>
          ))}
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Orbit Events. Demo project.</span>
        <span>Made for discovering &amp; managing events.</span>
      </div>
    </footer>
  )
}
