import { Phone } from 'lucide-react';
import FEATURES from '../config/features';
import './StickyCallButton.css';

/**
 * StickyCallButton — floating "Call Now" button shown only on mobile
 * (CSS-gated to ≤768px). Tap = open the dialer. Hidden on desktop
 * because click-to-call is less useful there.
 *
 * Hidden when STICKY_CALL_BUTTON feature flag is off.
 * Also hidden on /admin so it doesn't cover form fields while moderating.
 */
const PHONE = '519-617-7214';

export default function StickyCallButton() {
  if (!FEATURES.STICKY_CALL_BUTTON) return null;
  if (typeof window !== 'undefined' && window.location.pathname === '/admin') return null;

  return (
    <a
      href={`tel:${PHONE}`}
      className="sticky-call"
      aria-label={`Call Mobile Auto Repair at ${PHONE}`}
    >
      <Phone className="sticky-call-icon" />
      <span className="sticky-call-label">Call Now</span>
    </a>
  );
}
