/**
 * BrandMarquee — infinite drag-scrollable logo strip.
 * Drag left  → content moves left.
 * Drag right → content moves right.
 * Auto-scrolls slowly when idle.
 */
import { useRef, useEffect } from 'react';
import './BrandMarquee.css';

const PX_PER_SECOND = 45; // idle scroll speed — feel free to tune

/* ─────────────────────────────────────────────────────────────
   Brand logos — locally hosted transparent PNGs (public/Logos/)
───────────────────────────────────────────────────────────────*/
const BRANDS = [
  { name: 'Toyota',      src: '/Logos/Toyota.png' },
  { name: 'Honda',       src: '/Logos/Honda.png' },
  { name: 'Ford',        src: '/Logos/Ford.png' },
  { name: 'Chevrolet',   src: '/Logos/Chevrolet.png' },
  { name: 'Dodge',       src: '/Logos/Dodge.png' },
  { name: 'RAM',         src: '/Logos/RAM.png' },
  { name: 'Jeep',        src: '/Logos/Jeep.png' },
  { name: 'Chrysler',    src: '/Logos/Chrysler.png' },
  { name: 'Nissan',      src: '/Logos/Nissan.png' },
  { name: 'Hyundai',     src: '/Logos/Hyundai.png' },
  { name: 'Mazda',       src: '/Logos/Mazda.png' },
  { name: 'Subaru',      src: '/Logos/Subaru.png' },
  { name: 'Volkswagen',  src: '/Logos/Volkswagen.png' },
  { name: 'BMW',         src: '/Logos/BMW.png' },
  { name: 'Mercedes',    src: '/Logos/Mercedes.png' },
  { name: 'Audi',        src: '/Logos/Audi.png' },
  { name: 'Acura',       src: '/Logos/Acura.png' },
  { name: 'Lexus',       src: '/Logos/Lexus.png' },
  { name: 'Infiniti',    src: '/Logos/Infiniti.png' },
  { name: 'Cadillac',    src: '/Logos/Cadillac.png' },
  { name: 'Buick',       src: '/Logos/Buick.png' },
  { name: 'Jaguar',      src: '/Logos/Jaguar.png' },
  { name: 'Land Rover',  src: '/Logos/LandRover.png' },
  { name: 'Mini',        src: '/Logos/Mini.png' },
  { name: 'Fiat',        src: '/Logos/Fiat.png' },
  { name: 'Kia',         src: '/Logos/Kia.png' },
  { name: 'Mitsubishi',  src: '/Logos/Mitsubishi.png' },
  { name: 'GMC',         src: '/Logos/GMC.png' },
  { name: 'Genesis',     src: '/Logos/Genesis.png' },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────*/
export default function BrandMarquee() {
  const trackRef  = useRef(null);
  const viewRef   = useRef(null);
  const stateRef  = useRef({
    x:               0,      // current scroll position in px
    dragging:        false,
    dragStartClient: 0,
    dragStartX:      0,
    lastTs:          null,
  });

  /* ── RAF loop ── */
  useEffect(() => {
    let raf;

    function getHalfWidth() {
      return trackRef.current ? trackRef.current.scrollWidth / 2 : 4000;
    }

    function wrap(val, hw) {
      return ((val % hw) + hw) % hw;
    }

    function tick(ts) {
      const s = stateRef.current;

      if (!s.dragging) {
        const dt = s.lastTs != null ? (ts - s.lastTs) / 1000 : 0;
        s.x = wrap(s.x + PX_PER_SECOND * dt, getHalfWidth());
      }
      s.lastTs = ts;

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-s.x}px)`;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── drag handlers ── */
  function startDrag(clientX) {
    const s = stateRef.current;
    s.dragging        = true;
    s.dragStartClient = clientX;
    s.dragStartX      = s.x;
    s.lastTs          = null;
  }

  function moveDrag(clientX) {
    const s = stateRef.current;
    if (!s.dragging) return;
    // drag left (clientX decreases) → delta positive → x increases → content moves left ✓
    const delta = s.dragStartClient - clientX;
    const hw    = trackRef.current ? trackRef.current.scrollWidth / 2 : 4000;
    s.x = ((s.dragStartX + delta) % hw + hw) % hw;
  }

  function endDrag() {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    s.lastTs   = null; // reset timestamp so there's no position jump on resume
  }

  const doubled = [...BRANDS, ...BRANDS];

  return (
    <section className="brand-marquee">
      <p className="brand-marquee__eyebrow">All Major Brands Serviced</p>

      <div
        ref={viewRef}
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
              key={i}
              className="brand-marquee__item"
              aria-hidden={i >= BRANDS.length ? 'true' : undefined}
            >
              <div className="brand-marquee__logo-wrap">
                <img
                  src={b.src}
                  alt={b.name}
                  className="brand-marquee__img"
                  loading="lazy"
                  draggable="false"
                  onError={e => {
                    // fallback: show brand name as text if image fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                {/* hidden fallback text (shown only if img fails) */}
                <span className="brand-marquee__fallback" style={{ display: 'none' }}>
                  {b.name}
                </span>
              </div>
              <span className="brand-marquee__name">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
