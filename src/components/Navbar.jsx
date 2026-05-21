import React, { useState, useEffect } from 'react';
import './Navbar.css';
import FEATURES from '../config/features';

const Navbar = ({ tuningPage = false, bookingPage = false, reviewsPage = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  // Anchor links to homepage sections (#services, #about, #testimonials,
  // #estimator, #home) only work when we're actually on the homepage —
  // on every other route we have to prefix with "/" so the browser
  // navigates home first, then scrolls to the section. The legacy
  // tuningPage/bookingPage/reviewsPage props are still used elsewhere
  // for the "nav-active" highlight, but the prefix logic is now based
  // on the actual current URL so newer pages (faq, privacy, terms,
  // pre-purchase-inspection) work automatically without needing a prop.
  const isHome = typeof window === 'undefined'
    || window.location.pathname === '/'
    || window.location.pathname === '';
  const pfx = isHome ? '' : '/';

  return (
    <nav className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container nav-content">
        <div className="logo">
          <a href={pfx + '#home'} onClick={close}>
            <span className="logo-text">MOBILE <span className="highlight">AUTO REPAIR</span></span>
          </a>
        </div>
        <ul className={`nav-links${menuOpen ? ' is-open' : ''}`}>
          <li><a href={pfx + '#services'} onClick={close}>Services</a></li>
          <li>
            <a
              href="/booking"
              onClick={close}
              className={bookingPage ? 'nav-active' : ''}
            >
              Book Appointment
            </a>
          </li>
          <li>
            <a
              href="/tuning"
              onClick={close}
              className={tuningPage ? 'nav-active' : ''}
            >
              Tuning
            </a>
          </li>
          <li><a href={pfx + '#about'} onClick={close}>About</a></li>
          <li><a href={pfx + '#testimonials'} onClick={close}>Reviews</a></li>
          <li><a href="/faq" onClick={close}>FAQ</a></li>
          <li>
            {FEATURES.ESTIMATOR_ENABLED ? (
              <a
                href={pfx + '#estimator'}
                onClick={close}
                className="btn btn-primary btn-small"
              >
                Get Estimate
              </a>
            ) : (
              <a
                href="/booking"
                onClick={close}
                className={`btn btn-primary btn-small${bookingPage ? ' nav-active' : ''}`}
              >
                Book Appointment
              </a>
            )}
          </li>
        </ul>
        <button
          className={`hamburger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
