import { useEffect, useState } from 'react';
import './CookieBanner.css';

const STORAGE_KEY = 'mar_cookie_consent';

/**
 * CookieBanner — shown once, dismisses on accept or decline.
 *
 * We use only essential cookies (admin session) and privacy-friendly
 * analytics (Microsoft Clarity, no personal data). Under PIPEDA this
 * level of disclosure-and-choice satisfies consent for non-essential
 * tracking. Once the user makes a choice it's stored in localStorage
 * and the banner never reappears.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Slight delay so the banner doesn't flash before paint
        const t = setTimeout(() => setVisible(true), 700);
        return () => clearTimeout(t);
      }
    } catch { /* localStorage blocked — just leave banner hidden */ }
  }, []);

  const choose = (decision) => {
    try { localStorage.setItem(STORAGE_KEY, decision); } catch { /* ignore */ }
    setVisible(false);
    // If user declined, attempt to disable Clarity tracking going forward
    if (decision === 'declined' && typeof window !== 'undefined' && window.clarity) {
      try { window.clarity('consent', false); } catch { /* ignore */ }
    }
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          We use essential cookies to run the site and optional analytics
          (Microsoft Clarity) to understand how visitors use it — no personal
          data is sold or shared.{' '}
          <a href="/privacy">Read our Privacy Policy</a>.
        </p>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-decline"
            onClick={() => choose('declined')}
          >
            Essential only
          </button>
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-accept"
            onClick={() => choose('accepted')}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
