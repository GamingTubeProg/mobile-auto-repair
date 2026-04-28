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
   Official brand logos via Wikimedia Commons CDN.
   All transparent-background PNGs, served by Fastly.
───────────────────────────────────────────────────────────────*/
const BRANDS = [
  {
    name: 'Toyota',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/200px-Toyota_carlogo.svg.png',
  },
  {
    name: 'Honda',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/200px-Honda_Logo.svg.png',
  },
  {
    name: 'Ford',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Ford_Motor_Company_Logo.svg/200px-Ford_Motor_Company_Logo.svg.png',
  },
  {
    name: 'Hyundai',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Hyundai_Motor_Company_logo.svg/200px-Hyundai_Motor_Company_logo.svg.png',
  },
  {
    name: 'Kia',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Kia-logo.svg/200px-Kia-logo.svg.png',
  },
  {
    name: 'Chevrolet',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet_logo.svg/200px-Chevrolet_logo.svg.png',
  },
  {
    name: 'GMC',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/GMC_logo.svg/200px-GMC_logo.svg.png',
  },
  {
    name: 'RAM',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Ram_logo.svg/200px-Ram_logo.svg.png',
  },
  {
    name: 'Dodge',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Dodge_Logo.svg/200px-Dodge_Logo.svg.png',
  },
  {
    name: 'Jeep',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Jeep_logo.svg/200px-Jeep_logo.svg.png',
  },
  {
    name: 'Nissan',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Nissan_2020_logo.svg/200px-Nissan_2020_logo.svg.png',
  },
  {
    name: 'Mazda',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mazda_logo_with_text.svg/200px-Mazda_logo_with_text.svg.png',
  },
  {
    name: 'Subaru',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Subaru_logo.svg/200px-Subaru_logo.svg.png',
  },
  {
    name: 'Volkswagen',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/200px-Volkswagen_logo_2019.svg.png',
  },
  {
    name: 'BMW',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/200px-BMW.svg.png',
  },
  {
    name: 'Mercedes',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/200px-Mercedes-Logo.svg.png',
  },
  {
    name: 'Audi',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/200px-Audi-Logo_2016.svg.png',
  },
  {
    name: 'Mitsubishi',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mitsubishi_logo.svg/200px-Mitsubishi_logo.svg.png',
  },
  {
    name: 'Acura',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Acura_-_logo.svg/200px-Acura_-_logo.svg.png',
  },
  {
    name: 'Lexus',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lexus_-_Logo.svg/200px-Lexus_-_Logo.svg.png',
  },
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
