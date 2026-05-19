import { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import FEATURES from '../config/features';
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
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, customer_name, rating, comment, vehicle, service_type, created_at, photo_urls, source')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) {
        console.error('[Testimonials] Failed to load reviews:', error);
      }
      setReviews(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Re-attach scroll-reveal observer for elements rendered AFTER the page's
  // top-level observer ran. The Home page sets up its IntersectionObserver
  // synchronously on mount, but this section's elements are added later
  // (after the async fetch), so the original observer never sees them.
  // Without this they stay at opacity:0 forever — invisible empty space.
  useEffect(() => {
    if (loading || !sectionRef.current) return;
    const targets = sectionRef.current.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, [loading, reviews]);

  // While loading, render nothing (avoid flash of empty state)
  if (loading) return null;

  // Empty state — no reviews yet but we still want a visible "leave a review"
  // entry point on the homepage so customers can submit feedback.
  if (reviews.length === 0) {
    return (
      <section className="testimonials testimonials-empty section" id="testimonials" ref={sectionRef}>
        <div className="container">
          <header className="testimonials-header" data-reveal>
            <span className="subtitle accent-line">Customer Voices</span>
            <h2 className="title">Share Your <span className="title-accent">Experience.</span></h2>
            <p className="t-empty-sub">
              Recent customer? Help others find us by leaving a quick review.
              It only takes a minute.
            </p>
          </header>

          <div className="t-cta-row t-empty-cta" data-reveal>
            <a href="/review" className="btn btn-primary btn-arrow">
              Leave a Review
              <span className="btn-arrow-icon">→</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <section className="testimonials section" id="testimonials" ref={sectionRef}>
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

              {FEATURES.SHOW_REVIEW_PHOTOS && r.photo_urls?.length > 0 && (
                <div className="t-photos">
                  {r.photo_urls.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      className="t-photo-thumb"
                      onClick={() => setLightboxUrl(url)}
                      aria-label={`View photo ${i + 1}`}
                    >
                      <img src={url} alt={`Review photo ${i + 1}`} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              <div className="t-meta">
                <span className="t-name">
                  {r.customer_name}
                  {r.source === 'google' && (
                    <span className="t-source-badge" title="From Google Reviews">G</span>
                  )}
                </span>
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

      {/* Lightbox — fullscreen view of clicked review photo */}
      {lightboxUrl && (
        <div
          className="t-lightbox"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="Review photo"
        >
          <button
            type="button"
            className="t-lightbox-close"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <img src={lightboxUrl} alt="Review" />
        </div>
      )}
    </section>
  );
}
