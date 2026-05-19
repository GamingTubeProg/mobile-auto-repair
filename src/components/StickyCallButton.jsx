import { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import FEATURES from '../config/features';
import './StickyCallButton.css';

/**
 * StickyCallButton — floating "Call Now" button shown only on mobile
 * (CSS-gated to ≤768px). Tap = open the dialer.
 *
 * Position behaviour: starts at bottom (initial page load). As soon as
 * the user scrolls UPWARD (toward the page top), the button moves to
 * the TOP of the viewport. This avoids the bottom thumb-scroll zone
 * where misclicks happen. When the user scrolls down again it returns
 * to the bottom.
 */
const PHONE = '519-617-7214';

export default function StickyCallButton({ alwaysVisible = false }) {
  // Pin to top vs bottom — defaults to bottom (false).
  const [pinTop, setPinTop] = useState(false);
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    const onScroll = () => {
      const y     = window.scrollY;
      const delta = y - lastY.current;
      // Ignore tiny scroll noise
      if (Math.abs(delta) < 6) return;
      if (delta < 0) {
        // Scrolling up → move button to top
        setPinTop(true);
      } else if (delta > 0 && y > 200) {
        // Scrolling down past a small threshold → move back to bottom
        setPinTop(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // alwaysVisible overrides the feature toggle — used inside /admin
  // where the call button must never be hidden.
  if (!alwaysVisible && !FEATURES.STICKY_CALL_BUTTON) return null;

  return (
    <a
      href={`tel:${PHONE}`}
      className={`sticky-call${pinTop ? ' pin-top' : ''}${alwaysVisible ? ' always-visible' : ''}`}
      aria-label={`Call Mobile Auto Repair at ${PHONE}`}
    >
      <Phone className="sticky-call-icon" />
      <span className="sticky-call-label">Call Now</span>
    </a>
  );
}
