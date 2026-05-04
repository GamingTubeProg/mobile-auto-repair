import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Testimonials.css';

const SERVICE_LABELS = {
  diagnose:  'Diagnostics',
  reparatur: 'Repair',
  tuning:    'ECU Tuning',
  wartung:   'Maintenance',
  sonstiges: 'Other',
};

function StarRating({ value, size = 16 }) {
  return (
    <span className="t-stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          fill={n <= value ? 'currentColor' : 'none'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (days === 0)   return 'Today';
  if (days === 1)   return 'Yesterday';
  if (days < 7)     return `${days} days ago`;
  if (days < 30)    return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365)   return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reviews')
        .select('id, customer_name, rating, comment, vehicle, service_type, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);
      setReviews(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Don't render the section if there are no approved reviews — keeps the
  // homepage clean while we're still collecting the first wave of feedback.
  if (loading || reviews.length === 0) return null;

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <section className="testimonials section" id="testimonials">
      <div className="container">
        <header className="testimonials-header" data-reveal>
          <span className="subtitle accent-line">Customer Voices</span>
          <h2 className="title">What Our <span className="title-accent">Clients Say.</span></h2>

          <div className="t-summary">
            <span className="t-avg">{avgRating}</span>
            <StarRating value={Math.round(avgRating)} size={18} />
            <span className="t-count">
              Based on <strong>{reviews.length}</strong> recent review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        <div className="t-grid">
          {reviews.map((r, i) => (
            <article
              key={r.id}
              className="t-card"
              data-reveal
              style={{ transitionDelay: `${(i % 3) * 80}ms` }}
            >
              <Quote className="t-quote-icon" />
              <StarRating value={r.rating} />
              <p className="t-comment">{r.comment}</p>
              <div className="t-meta">
                <span className="t-name">{r.customer_name}</span>
                <span className="t-info">
                  {r.vehicle && <>{r.vehicle} · </>}
                  {r.service_type && SERVICE_LABELS[r.service_type] && (
                    <>{SERVICE_LABELS[r.service_type]} · </>
                  )}
                  {formatRelative(r.created_at)}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="t-cta-row" data-reveal>
          <p className="t-cta-text">Was your experience worth sharing?</p>
          <a href="/review" className="btn btn-ghost">
            Leave a Review →
          </a>
        </div>
      </div>
    </section>
  );
}
