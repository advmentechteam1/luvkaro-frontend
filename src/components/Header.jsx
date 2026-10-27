import { useState } from 'react'

export default function Header({ activePage = 'home' }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header"><nav className="nav wrap">
    <a className="brand" href="#home"><span>♡</span> Luvkaro</a>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
    <div className={`nav-links ${open ? 'open' : ''}`}>{['Home', 'Discover', 'Matches', 'Messages', 'About'].map((item) => { const page = item.toLowerCase(); return <a className={activePage === page ? 'active' : ''} key={item} href={`#${page}`} onClick={() => setOpen(false)}>{item}</a> })}</div>
    <div className="nav-actions"><button className="search" aria-label="Search">⌕</button><button className="login">Log In</button><a className="signup" href="#matches">Sign Up</a></div>
  </nav></header>
}
