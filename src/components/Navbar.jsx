import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <nav className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container nav-content">
        <div className="logo">
          <a href="#home" onClick={close}>
            <span className="logo-text">MOBILE <span className="highlight">AUTO REPAIR</span></span>
          </a>
        </div>
        <ul className={`nav-links${menuOpen ? ' is-open' : ''}`}>
          <li><a href="#services" onClick={close}>Services</a></li>
          <li><a href="#estimator" onClick={close}>Estimate</a></li>
          <li><a href="#about" onClick={close}>About</a></li>
          <li><a href="#contact" className="btn btn-primary btn-small" onClick={close}>Book Now</a></li>
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
