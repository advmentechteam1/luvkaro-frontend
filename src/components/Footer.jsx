import Logo from './Logo'

export default function Footer() {
  return <footer className="site-footer">
    <div className="wrap footer-grid">
      <div className="footer-brand">
        <a className="brand-link" href="#home" aria-label="Luvkaro Home">
          <Logo light />
        </a>
        <p>A warmer place to meet real people and grow meaningful connections.</p>
        <div className="social" aria-label="Social links">
          <a href="#home" aria-label="Instagram">◎</a><a href="#home" aria-label="Facebook">f</a><a href="#home" aria-label="Twitter">𝕏</a><a href="#home" aria-label="LinkedIn">in</a>
        </div>
      </div>
      <div className="footer-links-row">
        <div className="footer-links"><h4>Explore</h4><a href="#home">Home</a><a href="#discover">Discover</a><a href="#matches">Matches</a><a href="#messages">Messages</a><a href="#about">About us</a></div>
        <div className="footer-links"><h4>Support</h4><a href="#home">Help center</a><a href="#home">Safety center</a><a href="#home">Terms of use</a><a href="#home">Privacy policy</a></div>
      </div>
      <div className="newsletter"><p className="footer-label">STAY IN THE LOOP</p><h4>Little notes about love.</h4><p>Thoughtful dating tips and updates, delivered occasionally.</p><form onSubmit={event => event.preventDefault()}><input type="email" placeholder="Your email address" aria-label="Your email address"/><button aria-label="Subscribe">→</button></form></div>
    </div>
    <div className="wrap footer-bottom"><span>© 2026 Luvkaro. All rights reserved.</span><span>Made for meaningful connections <b>♥</b></span></div>
  </footer>
}
