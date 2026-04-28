/**
 * BrandMarquee — infinite auto-scrolling logo strip.
 * Drag left to speed up, drag right to slow down.
 * Supports mouse and touch.
 */
import { useRef, useCallback } from 'react';
import './BrandMarquee.css';

const BASE_DURATION = 30; // seconds for one full loop

/* ─────────────────────────────────────────────────────────────
   Brand logo definitions — all monochrome, use currentColor.
   Top Canadian makes; no exotics.
───────────────────────────────────────────────────────────────*/
const BRANDS = [
  {
    name: 'Toyota',
    logo: (
      <svg viewBox="0 0 88 62" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
        {/* outer oval */}
        <ellipse cx="44" cy="31" rx="43" ry="30" />
        {/* vertical oval — trunk of T */}
        <ellipse cx="44" cy="36" rx="14" ry="24" />
        {/* horizontal oval — crossbar of T */}
        <ellipse cx="44" cy="22" rx="26" ry="12" />
      </svg>
    ),
  },
  {
    name: 'Honda',
    logo: (
      <svg viewBox="0 0 52 56" fill="currentColor" aria-hidden="true">
        <rect x="4"  y="2"  width="10" height="52" rx="1" />
        <rect x="38" y="2"  width="10" height="52" rx="1" />
        <rect x="14" y="22" width="24" height="10"  rx="1" />
      </svg>
    ),
  },
  {
    name: 'Ford',
    logo: (
      <svg viewBox="0 0 120 48" aria-hidden="true">
        <ellipse cx="60" cy="24" rx="58" ry="22" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <text
          x="60" y="31" textAnchor="middle" fill="currentColor"
          fontFamily="Georgia,'Times New Roman',serif"
          fontStyle="italic" fontWeight="bold" fontSize="24"
        >Ford</text>
      </svg>
    ),
  },
  {
    name: 'Hyundai',
    logo: (
      <svg viewBox="0 0 54 52" fill="currentColor" aria-hidden="true">
        {/* italic H — bars slant right from bottom to top */}
        <path d="M4,2 L14,2 L10,50 L0,50 Z" />
        <path d="M40,2 L50,2 L46,50 L36,50 Z" />
        <path d="M11,22 L39,22 L38,30 L10,30 Z" />
      </svg>
    ),
  },
  {
    name: 'Kia',
    logo: (
      <svg viewBox="0 0 82 40" aria-hidden="true">
        <text
          x="41" y="32" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="34" letterSpacing="5"
        >KIA</text>
      </svg>
    ),
  },
  {
    name: 'Chevrolet',
    logo: (
      <svg viewBox="0 0 100 34" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        {/* bowtie — two opposing hexagons meeting at center point */}
        <path d="M2,6 L38,6 L50,17 L38,28 L2,28 L14,17 Z" />
        <path d="M98,6 L62,6 L50,17 L62,28 L98,28 L86,17 Z" />
      </svg>
    ),
  },
  {
    name: 'GMC',
    logo: (
      <svg viewBox="0 0 86 40" aria-hidden="true">
        <text
          x="43" y="32" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="32" letterSpacing="4"
        >GMC</text>
      </svg>
    ),
  },
  {
    name: 'RAM',
    logo: (
      <svg viewBox="0 0 78 40" aria-hidden="true">
        <text
          x="39" y="32" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="32" letterSpacing="4"
        >RAM</text>
      </svg>
    ),
  },
  {
    name: 'Dodge',
    logo: (
      <svg viewBox="0 0 104 38" aria-hidden="true">
        <text
          x="52" y="30" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="26" letterSpacing="3"
        >DODGE</text>
      </svg>
    ),
  },
  {
    name: 'Jeep',
    logo: (
      <svg viewBox="0 0 78 38" aria-hidden="true">
        <text
          x="39" y="30" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="28" letterSpacing="4"
        >JEEP</text>
      </svg>
    ),
  },
  {
    name: 'Nissan',
    logo: (
      <svg viewBox="0 0 108 48" aria-hidden="true">
        <ellipse cx="54" cy="24" rx="52" ry="22" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <line x1="2" y1="24" x2="106" y2="24" stroke="currentColor" strokeWidth="2" />
        <text
          x="54" y="21" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="bold"
          fontSize="13" letterSpacing="2"
        >NISSAN</text>
      </svg>
    ),
  },
  {
    name: 'Mazda',
    logo: (
      <svg viewBox="0 0 94 40" aria-hidden="true">
        <text
          x="47" y="31" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="28" letterSpacing="2"
        >MAZDA</text>
      </svg>
    ),
  },
  {
    name: 'Subaru',
    logo: (
      <svg viewBox="0 0 80 44" fill="currentColor" aria-hidden="true">
        {/* Pleiades star cluster — 1 large + 5 small */}
        <circle cx="18" cy="22" r="7.5" />
        <circle cx="36" cy="11" r="5" />
        <circle cx="51" cy="20" r="5" />
        <circle cx="46" cy="34" r="5" />
        <circle cx="63" cy="13" r="5" />
        <circle cx="65" cy="30" r="5" />
      </svg>
    ),
  },
  {
    name: 'Volkswagen',
    logo: (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="28" cy="28" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text
          x="28" y="35" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="18"
        >VW</text>
      </svg>
    ),
  },
  {
    name: 'BMW',
    logo: (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="28" cy="28" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
        {/* Quadrant dividers */}
        <line x1="28" y1="10" x2="28" y2="46" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="28" x2="46" y2="28" stroke="currentColor" strokeWidth="2" />
        {/* Filled quadrants: top-left & bottom-right (classic BMW roundel pattern) */}
        <path d="M28,10 A18,18 0 0,0 10,28 L28,28 Z" fill="currentColor" opacity="0.55" />
        <path d="M28,46 A18,18 0 0,0 46,28 L28,28 Z" fill="currentColor" opacity="0.55" />
      </svg>
    ),
  },
  {
    name: 'Mercedes',
    logo: (
      <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2.5" />
        {/* Three-pointed star arms from center */}
        <line x1="28" y1="28" x2="28"  y2="4"  stroke="currentColor" strokeWidth="2.5" />
        <line x1="28" y1="28" x2="50"  y2="41" stroke="currentColor" strokeWidth="2.5" />
        <line x1="28" y1="28" x2="6"   y2="41" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="28" cy="28" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Audi',
    logo: (
      <svg viewBox="0 0 112 36" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        {/* Four interlocking rings */}
        <circle cx="18" cy="18" r="16" />
        <circle cx="42" cy="18" r="16" />
        <circle cx="66" cy="18" r="16" />
        <circle cx="90" cy="18" r="16" />
      </svg>
    ),
  },
  {
    name: 'Mitsubishi',
    logo: (
      <svg viewBox="0 0 66 48" fill="currentColor" aria-hidden="true">
        {/* Three diamonds in triangular arrangement */}
        <polygon points="33,0 44,11 33,22 22,11" />
        <polygon points="13,24 24,35 13,46 2,35" />
        <polygon points="53,24 64,35 53,46 42,35" />
      </svg>
    ),
  },
  {
    name: 'Acura',
    logo: (
      <svg viewBox="0 0 94 40" aria-hidden="true">
        <text
          x="47" y="31" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="900"
          fontSize="28" letterSpacing="2"
        >ACURA</text>
      </svg>
    ),
  },
  {
    name: 'Lexus',
    logo: (
      <svg viewBox="0 0 80 46" aria-hidden="true">
        <ellipse cx="40" cy="23" rx="38" ry="21" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <text
          x="40" y="31" textAnchor="middle" fill="currentColor"
          fontFamily="Arial,sans-serif" fontWeight="bold"
          fontSize="24" letterSpacing="5"
        >L</text>
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────*/
export default function BrandMarquee() {
  const trackRef = useRef(null);
  const dragRef  = useRef({ active: false, lastX: 0 });
  const durRef   = useRef(BASE_DURATION);
  const rafRef   = useRef(null);

  /** Write a new animation duration to both the ref and the DOM. */
  function applyDur(d) {
    durRef.current = d;
    if (trackRef.current)
      trackRef.current.style.animationDuration = d + 's';
  }

  /** Gradually ease back to BASE_DURATION after the user releases. */
  const decayToBase = useCallback(() => {
    if (dragRef.current.active) return;
    const d    = durRef.current;
    const next = d + (BASE_DURATION - d) * 0.07;
    if (Math.abs(next - BASE_DURATION) < 0.3) { applyDur(BASE_DURATION); return; }
    applyDur(next);
    rafRef.current = requestAnimationFrame(decayToBase);
  }, []);

  function startDrag(clientX) {
    cancelAnimationFrame(rafRef.current);
    dragRef.current = { active: true, lastX: clientX };
  }

  function moveDrag(clientX) {
    if (!dragRef.current.active) return;
    const dx = clientX - dragRef.current.lastX;
    dragRef.current.lastX = clientX;
    // Drag left (negative dx) → shorter duration → faster scroll
    const next = Math.max(5, Math.min(BASE_DURATION * 2, durRef.current + dx * 0.5));
    applyDur(next);
  }

  function endDrag() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    rafRef.current = requestAnimationFrame(decayToBase);
  }

  // Duplicate list for seamless loop
  const doubled = [...BRANDS, ...BRANDS];

  return (
    <section className="brand-marquee">
      <p className="brand-marquee__eyebrow">All Major Brands Serviced</p>

      <div
        className="brand-marquee__viewport"
        onMouseDown={e  => startDrag(e.clientX)}
        onMouseMove={e  => moveDrag(e.clientX)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => startDrag(e.touches[0].clientX)}
        onTouchMove={e  => { e.preventDefault(); moveDrag(e.touches[0].clientX); }}
        onTouchEnd={endDrag}
      >
        <div className="brand-marquee__track" ref={trackRef}>
          {doubled.map((b, i) => (
            <div
              className="brand-marquee__item"
              key={i}
              aria-hidden={i >= BRANDS.length ? 'true' : undefined}
            >
              <span className="brand-marquee__logo">{b.logo}</span>
              <span className="brand-marquee__name">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
