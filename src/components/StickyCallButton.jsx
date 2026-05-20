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
  // Defaults to bottom; the button moves to the TOP as soon as the
  // page has been scrolled away from the very top. Reason: the
  // bottom-right thumb-zone causes accidental taps and covers
  // page content while scrolling. Only at the very top of the
  // page — where there's nothing to scroll *up* to anyway — does
  // it sit at the bottom so it doesn't overlap the hero.
  const [pinTop, setPinTop] = useState(
    typeof window !== 'undefined' && window.scrollY > 50
  );
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    const onScroll = () => {
      setPinTop(window.scrollY > 50);
      lastY.current = window.scrollY;
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
