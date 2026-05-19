import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Reviews.css';

const MAX_PHOTOS    = 3;
const MAX_LONG_EDGE = 1600;   // resize cap (px)
const JPEG_QUALITY  = 0.82;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB, matches storage bucket limit

/**
 * Compress an image client-side: resize so the longer edge is ≤ MAX_LONG_EDGE
 * and re-encode as JPEG. Avoids sending 10 MB phone photos over the wire and
 * keeps Supabase Storage usage small.
 */
async function compressImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload  = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const { width: w, height: h } = img;
  const longEdge = Math.max(w, h);
  const scale    = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const targetW  = Math.round(w * scale);
  const targetH  = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  return blob;
}

export default function Reviews() {
  const [form, setForm] = useState({
    customer_name: '',
    rating:        5,
    comment:       '',
    vehicle:       '',
  });
  const [photos,      setPhotos]      = useState([]); // File[]
  const [photoError,  setPhotoError]  = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  function handlePhotoSelect(e) {
    setPhotoError('');
    const incoming = Array.from(e.target.files || []);
    const slots    = MAX_PHOTOS - photos.length;
    if (incoming.length > slots) {
      setPhotoError(`You can add up to ${MAX_PHOTOS} photos total.`);
    }
    const toAdd = incoming.slice(0, slots);
    // Reject anything > 5 MB *before* compression so the user sees an error
    // immediately rather than a silent failure later.
    const oversized = toAdd.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setPhotoError(`"${oversized.name}" is larger than 5 MB.`);
      return;
    }
    setPhotos(prev => [...prev, ...toAdd]);
    e.target.value = ''; // allow re-selecting the same file
  }

  function removePhoto(idx) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoError('');
  }

  async function uploadPhotos() {
    const urls = [];
    for (const file of photos) {
      const blob = await compressImage(file);
      // Random key inside a "pending/" folder makes admin moderation easier later.
      const ext  = 'jpg';
      const name = `pending/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('review-photos')
        .upload(name, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage
        .from('review-photos')
        .getPublicUrl(name);
      urls.push(pub.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (form.comment.trim().length < 20) {
      setError('Please write at least 20 characters so other customers find it useful.');
      setSubmitting(false);
      return;
    }

    let photoUrls = [];
    if (photos.length > 0) {
      try {
        photoUrls = await uploadPhotos();
      } catch (err) {
        console.error('[Reviews] Photo upload failed:', err);
        setError('Could not upload your photos. Please try again or remove them.');
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from('reviews').insert({
      customer_name: form.customer_name.trim(),
      rating:        form.rating,
      comment:       form.comment.trim(),
      vehicle:       form.vehicle.trim() || null,
      photo_urls:    photoUrls,
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

            <div className="form-group">
              <label htmlFor="r-photos">
                Photos <span className="form-optional">(optional, up to {MAX_PHOTOS})</span>
              </label>

              {photos.length > 0 && (
                <div className="review-photo-grid">
                  {photos.map((file, idx) => (
                    <div key={idx} className="review-photo-thumb">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="review-photo-remove"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < MAX_PHOTOS && (
                <label className="review-photo-upload">
                  <input
                    id="r-photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                  />
                  <span className="review-photo-upload-icon">📷</span>
                  <span>
                    {photos.length === 0
                      ? `Add photos of your vehicle or the repair`
                      : `Add ${MAX_PHOTOS - photos.length} more`}
                  </span>
                </label>
              )}

              {photoError && <span className="form-hint review-photo-error">{photoError}</span>}
              <span className="form-hint">Photos help other customers — they&apos;ll be reviewed before going live.</span>
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
