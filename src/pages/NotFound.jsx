import { Home, Phone, Wrench } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="nf-root">
      <div className="nf-content">
        <span className="nf-icon"><Wrench /></span>
        <h1 className="nf-code">404</h1>
        <h2 className="nf-title">Wrong Turn.</h2>
        <p className="nf-text">
          The page you&apos;re looking for isn&apos;t here. It may have moved,
          or the link you followed has a typo.
        </p>

        <div className="nf-actions">
          <a href="/" className="btn btn-primary btn-arrow">
            <Home /> Back to Homepage
            <span className="btn-arrow-icon">→</span>
          </a>
          <a href="tel:519-617-7214" className="btn btn-ghost">
            <Phone /> Call 519-617-7214
          </a>
        </div>

        <div className="nf-links">
          <p>Quick links:</p>
          <ul>
            <li><a href="/#services">Services</a></li>
            <li><a href="/booking">Book Appointment</a></li>
            <li><a href="/pre-purchase-inspection">Pre-Purchase Inspection</a></li>
            <li><a href="/tuning">ECU Tuning</a></li>
            <li><a href="/#testimonials">Reviews</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
