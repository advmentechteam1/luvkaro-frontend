import { useEffect, useState } from 'react'
import Logo from './Logo'

export default function Header({ activePage = 'home' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="site-header">
      {open && (
        <div
          className="nav-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav className="nav wrap">
        <a className="brand-link" href="#home" onClick={() => setOpen(false)} aria-label="Luvkaro Home">
          <Logo />
        </a>
        <button
          className={`menu-button ${open ? 'is-active' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          <div className="mobile-nav-top">
            <Logo />
            <button
              className="mobile-nav-close"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>
          <div className="nav-items-group">
            {['Home', 'Discover', 'Matches', 'Messages', 'About'].map((item) => {
              const page = item.toLowerCase()
              return (
                <a
                  className={activePage === page ? 'active' : ''}
                  key={item}
                  href={`#${page}`}
                  onClick={() => setOpen(false)}
                >
                  {item}
                </a>
              )
            })}
          </div>
          <div className="mobile-nav-footer">
            <button className="login" onClick={() => setOpen(false)}>Log In</button>
            <a className="signup" href="#matches" onClick={() => setOpen(false)}>
              Sign Up Free
            </a>
          </div>
        </div>
        <div className="nav-actions">
          <button className="search" aria-label="Search">⌕</button>
          <button className="login">Log In</button>
          <a className="signup" href="#matches">Sign Up</a>
        </div>
      </nav>
    </header>
  )
}
