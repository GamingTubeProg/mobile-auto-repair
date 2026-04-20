import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <div className="logo">
          <a href="#">
            <span className="logo-text">MOBILE <span className="highlight">AUTO REPAIR</span></span>
          </a>
        </div>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact" className="btn btn-primary btn-small">Book Now</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
