/**
 * BrandMarquee — infinite drag-scrollable logo strip.
 * Drag left  → content moves left.
 * Drag right → content moves right.
 * Auto-scrolls slowly when idle.
 */
import { useRef, useEffect } from 'react';
import './BrandMarquee.css';

const PX_PER_SECOND = 45;

/* ─────────────────────────────────────────────────────────────
   Brand logos — served locally from /public/Logos/ via Vercel CDN.
   Previously hotlinked from londonlube.com; they removed the
   images (404s), so we self-host now for reliability.
───────────────────────────────────────────────────────────────*/
const L = (file) => `/Logos/${file}`;

const BRANDS = [
  { name: 'Toyota',     src: L('Toyota.png') },
  { name: 'Honda',      src: L('Honda.png') },
  { name: 'Ford',       src: L('Ford.png') },
  { name: 'Chevrolet',  src: L('Chevrolet.png') },
  { name: 'Dodge',      src: L('Dodge.png') },
  { name: 'RAM',        src: L('RAM.png') },
  { name: 'Jeep',       src: L('Jeep.png') },
  { name: 'Chrysler',   src: L('Chrysler.png') },
  { name: 'Nissan',     src: L('Nissan.png') },
  { name: 'Hyundai',    src: L('Hyundai.png') },
  { name: 'Kia',        src: L('Kia.png') },
  { name: 'Mazda',      src: L('Mazda.png') },
  { name: 'Subaru',     src: L('Subaru.png') },
  { name: 'Mitsubishi', src: L('Mitsubishi.png') },
  { name: 'Volkswagen', src: L('Volkswagen.png') },
  { name: 'BMW',        src: L('BMW.png') },
  { name: 'Mercedes',   src: L('Mercedes.png') },
  { name: 'Audi',       src: L('Audi.png') },
  { name: 'Acura',      src: L('Acura.png') },
  { name: 'Lexus',      src: L('Lexus.png') },
  { name: 'Infiniti',   src: L('Infiniti.png') },
  { name: 'Genesis',    src: L('Genesis.png') },
  { name: 'Cadillac',   src: L('Cadillac.png') },
  { name: 'Buick',      src: L('Buick.png') },
  { name: 'GMC',        src: L('GMC.png') },
  { name: 'Jaguar',     src: L('Jaguar.png') },
  { name: 'Land Rover', src: L('LandRover.png') },
  { name: 'Mini',       src: L('Mini.png') },
  { name: 'Fiat',       src: L('Fiat.png') },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────*/
export default function BrandMarquee() {
  const trackRef  = useRef(null);
  const viewRef   = useRef(null);
  const stateRef  = useRef({
    x:               0,
    dragging:        false,
    dragStartClient: 0,
    dragStartX:      0,
    lastTs:          null,
    pauseUntil:      0,   // epoch ms — auto-scroll resumes after this
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

      if (!s.dragging && Date.now() >= s.pauseUntil) {
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
    const delta = s.dragStartClient - clientX;
    const hw    = trackRef.current ? trackRef.current.scrollWidth / 2 : 4000;
    s.x = ((s.dragStartX + delta) % hw + hw) % hw;
  }

  function endDrag() {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging   = false;
    s.lastTs     = null;
    s.pauseUntil = Date.now() + 3000; // pause auto-scroll for 3 s after drag
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
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                <span className="brand-marquee__fallback" style={{ display: 'none' }}>
                  {b.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
