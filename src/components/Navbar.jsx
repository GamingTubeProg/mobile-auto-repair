import React, { useState, useEffect } from 'react';
import './Navbar.css';
import FEATURES from '../config/features';

const Navbar = ({ tuningPage = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  // On the tuning page, anchor links need the home-page prefix
  const pfx = tuningPage ? '/' : '';

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
          {FEATURES.ESTIMATOR_ENABLED && <li><a href={pfx + '#estimator'} onClick={close}>Estimate</a></li>}
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
          <li><a href={pfx + '#contact'} className="btn btn-primary btn-small" onClick={close}>Book Now</a></li>
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
