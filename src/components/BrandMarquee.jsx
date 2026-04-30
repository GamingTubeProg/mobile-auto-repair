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
   Brand logos — londonlube.com colored PNGs, shown on white cards
───────────────────────────────────────────────────────────────*/
const LL = (file) =>
  `https://www.londonlube.com/wp-content/uploads/${file}`;

const BRANDS = [
  { name: 'Toyota',     src: LL('2016/05/Toyota-logo-1989-2560x1440.png') },
  { name: 'Honda',      src: LL('2017/04/Honda.png') },
  { name: 'Ford',       src: LL('2017/04/Ford.png') },
  { name: 'Chevrolet',  src: LL('2017/04/Chevrolet.png') },
  { name: 'Dodge',      src: LL('2017/04/Dodge.png') },
  { name: 'RAM',        src: LL('2017/04/RAM.png') },
  { name: 'Jeep',       src: LL('2017/04/Jeep.png') },
  { name: 'Chrysler',   src: LL('2017/04/Chrysler.png') },
  { name: 'Nissan',     src: LL('2017/04/Nissan.png') },
  { name: 'Hyundai',    src: LL('2017/04/Hyundai.png') },
  { name: 'Mazda',      src: LL('2017/04/Mazda.png') },
  { name: 'Subaru',     src: LL('2016/05/Subaru-logo-2003-2560x1440.png') },
  { name: 'Volkswagen', src: LL('2016/05/Volkswagen-logo-2015-1920x1080.png') },
  { name: 'BMW',        src: LL('2017/04/BMW.png') },
  { name: 'Mercedes',   src: LL('2017/04/Mercedes-Benz.png') },
  { name: 'Audi',       src: LL('2017/04/Audi.png') },
  { name: 'Acura',      src: LL('2017/04/Acura.png') },
  { name: 'Lexus',      src: LL('2017/04/Lexus.png') },
  { name: 'Infiniti',   src: LL('2017/04/Infiniti.png') },
  { name: 'Cadillac',   src: LL('2017/04/Cadillac.png') },
  { name: 'Buick',      src: LL('2017/04/Buick.png') },
  { name: 'Jaguar',     src: LL('2017/04/Jaguar.png') },
  { name: 'Land Rover', src: LL('2017/04/Land-Rover.png') },
  { name: 'Mini',       src: LL('2017/04/Mini.png') },
  { name: 'Fiat',       src: LL('2017/04/Fiat.png') },
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
