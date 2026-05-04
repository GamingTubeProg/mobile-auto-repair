import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Reviews.css';

const SERVICE_OPTIONS = [
  { id: 'diagnose',  label: 'Diagnostics & Troubleshooting' },
  { id: 'reparatur', label: 'Repair' },
  { id: 'tuning',    label: 'ECU Tuning' },
  { id: 'wartung',   label: 'Maintenance & Inspection' },
  { id: 'sonstiges', label: 'Other' },
];

export default function Reviews() {
  const [form, setForm] = useState({
    customer_name: '',
    rating:        5,
    comment:       '',
    vehicle:       '',
    service_type:  '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (form.comment.trim().length < 20) {
      setError('Please write at least 20 characters so other customers find it useful.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      customer_name: form.customer_name.trim(),
      rating:        form.rating,
      comment:       form.comment.trim(),
      vehicle:       form.vehicle.trim() || null,
      service_type:  form.service_type || null,
    });

    if (error) {
      setError('Failed to submit your review. Please try again.');
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  return (
    <div className="app">
      <Navbar reviewsPage />

      <section className="reviews-hero">
        <div className="container reviews-hero-inner">
          <span className="subtitle">Mobile Auto Repair — London, ON</span>
          <h1 className="title">Leave a <span className="title-accent">Review</span></h1>
          <p className="reviews-hero-sub">
            Help other customers by sharing your experience. Your feedback keeps us sharp.
          </p>
        </div>
      </section>

      <div className="container reviews-container">
        {done ? (
          <div className="review-success">
            <div className="success-check">✓</div>
            <h2 className="success-title">Thank You!</h2>
            <p className="success-sub">
              Your review has been submitted and will appear on our website
              once it&apos;s been reviewed.
            </p>
            <a href="/" className="btn btn-primary">Back to Homepage →</a>
          </div>
        ) : (
          <form className="review-card" onSubmit={handleSubmit}>
            <h2 className="review-card-title">Share Your Experience</h2>

            <div className="form-group">
              <label htmlFor="r-name">Your Name *</label>
              <input
                id="r-name"
                type="text"
                value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                placeholder="John D."
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label>Rating *</label>
              <div
                className="rating-stars"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn${(hoverRating || form.rating) >= n ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, rating: n }))}
                    onMouseEnter={() => setHoverRating(n)}
                    aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-readout">
                  {hoverRating || form.rating}/5
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="r-service">Service (optional)</label>
              <select
                id="r-service"
                value={form.service_type}
                onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
              >
                <option value="">Select service…</option>
                {SERVICE_OPTIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="r-vehicle">Vehicle (optional)</label>
              <input
                id="r-vehicle"
                type="text"
                value={form.vehicle}
                onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
                placeholder="e.g. BMW 320d 2014"
              />
            </div>

            <div className="form-group">
              <label htmlFor="r-comment">Your Review *</label>
              <textarea
                id="r-comment"
                rows={5}
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Tell us about the service, the technician, the result…"
                required
              />
              <span className="form-hint">{form.comment.trim().length}/20 minimum characters</span>
            </div>

            {error && <p className="review-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!form.customer_name.trim() || !form.comment.trim() || submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Review →'}
            </button>

            <p className="review-disclaimer">
              Your review will be visible on our website after a quick moderation check.
              We never publish reviews containing personal contact details or profanity.
            </p>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
