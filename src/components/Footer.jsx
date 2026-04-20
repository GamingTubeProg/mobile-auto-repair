import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer section">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <h3 className="logo-text">MOBILE <span className="highlight">AUTO REPAIR</span></h3>
            <p className="footer-description">
              Affordable, high-quality automotive repair services directly at your location in London, Ontario. Made to Work — Robust, reliable, and makes your life a little bit easier.
            </p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#about">About Kal</a></li>
              <li><a href="#contact">Contact & Booking</a></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Contact Info</h4>
            <p><strong>Phone:</strong> <a href="tel:519-617-7214">519-617-7214</a></p>
            <p><strong>Email:</strong> <a href="mailto:Mobile.Automotive@hotmail.com">Mobile.Automotive@hotmail.com</a></p>
            <p><strong>Location:</strong> London, Ontario & Surrounding Areas</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Mobile Auto Repair. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
