import React, { useEffect, useRef, useState } from 'react';
import './Home.css';
import {
  Laptop, Settings, ShieldAlert, BatteryCharging,
  Car, Droplet, ThermometerSnowflake, Wrench,
  Fuel, Activity, Truck, Zap, Cpu,
  CalendarCheck, MapPin, Search, CheckCircle2,
  Award, Clock, ShieldCheck, Star,
} from 'lucide-react';
import Estimator from '../components/Estimator';
import BrandMarquee from '../components/BrandMarquee';
import WhyChooseMe from '../components/WhyChooseMe';
import FEATURES from '../config/features';

const services = [
  {
    id: 1,
    title: 'Mobile Diagnostics',
    desc: 'Quick and accurate diagnostics for any vehicle issue.',
    symptoms: 'Dashboard warning lights, unknown noises, or sudden performance drops.',
    icon: <Laptop />,
    img: '/assets/Mobile%20Diagnostics.png',
    category: 'Diagnostic',
  },
  {
    id: 2,
    title: 'Engine Problems',
    desc: 'Diagnosing and addressing common engine problems.',
    symptoms: 'Engine not starting, running rough, poor idle quality, or heavy smoke.',
    icon: <Settings />,
    img: '/assets/engine_original.png',
    category: 'Mechanical',
  },
  {
    id: 3,
    title: 'Brake Issues',
    desc: 'Providing brake repairs to ensure safety and restore stopping power.',
    symptoms: 'Squealing or grinding noises, vibrating wheel while braking, long stopping distances.',
    icon: <ShieldAlert />,
    img: '/assets/brakes_original.jpg',
    category: 'Safety',
  },
  {
    id: 4,
    title: 'Battery Replacement',
    desc: 'Testing and replacement of vehicle batteries on the spot.',
    symptoms: 'Car won\'t start, slow engine turn-over, or flickering electronics.',
    icon: <BatteryCharging />,
    img: '/assets/Battery%20Replacement%20%26%20Testing.png',
    category: 'Electrical',
  },
  {
    id: 5,
    title: 'Flat Tire Repair',
    desc: 'Fixing or replacing your tire and ensuring proper inflation.',
    symptoms: 'Visible flat tire, low tire pressure warning, or tire tread damage.',
    icon: <Car />,
    img: '/assets/tires_original.png',
    category: 'Mechanical',
  },
  {
    id: 6,
    title: 'Oil Change',
    desc: 'Keep your engine running smoothly with a convenient on-site oil change.',
    symptoms: 'Overdue maintenance schedule, low oil level light, or dark/gritty oil on the dipstick.',
    icon: <Droplet />,
    img: '/assets/oil_change_no_person_1775255997295.png',
    category: 'Maintenance',
  },
  {
    id: 7,
    title: 'Cooling System Repairs',
    desc: 'Prevent overheating with cooling system or radiator fixes.',
    symptoms: 'Overheating engine, coolant leaks on the ground, or steam from under the hood.',
    icon: <ThermometerSnowflake />,
    img: '/assets/radiator_original.jpg',
    category: 'Mechanical',
  },
  {
    id: 8,
    title: 'Suspension & Steering',
    desc: 'Diagnose and repair suspension or steering problems to keep you in control.',
    symptoms: 'Vehicle feeling unstable, strange clunking noises over bumps, or pulling to one side.',
    icon: <Wrench />,
    img: '/assets/Suspension%20%26%20Steering%20Issues.webp',
    category: 'Safety',
  },
  {
    id: 9,
    title: 'Fuel System Repairs',
    desc: 'Address issues with fuel pumps, injectors, and more.',
    symptoms: 'Stalling, loss of power, poor fuel economy, or failing to start despite turning over.',
    icon: <Fuel />,
    img: '/assets/Repair-Fuel-injection-Service.png.webp',
    category: 'Mechanical',
  },
  {
    id: 10,
    title: 'Transmission Diagnostics',
    desc: 'Thorough diagnostics to determine shifting issues and guide repairs.',
    symptoms: 'Rough shifting, slipping gears, or hesitation during acceleration.',
    icon: <Activity />,
    img: '/assets/Slipping-Transmission.png',
    category: 'Diagnostic',
  },
  {
    id: 11,
    title: 'Towing / Workshop Support',
    desc: 'If on-site repair is not possible, we offer towing support with a trusted partner workshop.',
    symptoms: 'Ensures your vehicle is safely transported for complex repairs requiring specialized conditions.',
    icon: <Truck />,
    img: '/assets/hero_no_person_1775255923634.png',
    category: 'Support',
  },
  {
    id: 12,
    title: 'No Start / No Crank Repairs',
    desc: 'Diagnosing and repairing vehicles that fail to start or crank.',
    symptoms: 'Turning the key does nothing, dashboard lights dim, clicking sound, or complete silence.',
    icon: <Zap />,
    img: '/assets/No%20Crank_No%20Start.jpg',
    category: 'Electrical',
  },
  {
    id: 13,
    title: 'Starter & Alternator Repairs',
    desc: 'Repair and replacement of failing starter motors and alternators.',
    symptoms: 'Grinding noise when starting, slow cranking, battery warning light on, or frequent jump-starts.',
    icon: <Cpu />,
    img: '/assets/Starter%20Motor%20%26%20Alternator%20Repairs.png',
    category: 'Electrical',
  },
];

const stats = [
  { value: '15+', label: 'Years Experience', icon: <Award /> },
  { value: '500+', label: 'Vehicles Serviced', icon: <Car /> },
  { value: '100%', label: 'On-Site Service', icon: <MapPin /> },
  { value: '24/7', label: 'Emergency Calls', icon: <Clock /> },
];

const processSteps = [
  {
    num: '01',
    icon: <CalendarCheck />,
    title: 'Book Your Slot',
    desc: 'Call or submit the quote form. We confirm a time that works for you — same-day options available.',
  },
  {
    num: '02',
    icon: <MapPin />,
    title: 'We Come to You',
    desc: 'Fully equipped mobile workshop arrives at your driveway, workplace, or roadside — anywhere in Greater London, ON.',
  },
  {
    num: '03',
    icon: <Search />,
    title: 'Precision Diagnostic',
    desc: 'Advanced OEM-grade diagnostic tools pinpoint the real issue. You get a transparent, itemized quote before any work begins.',
  },
  {
    num: '04',
    icon: <CheckCircle2 />,
    title: 'Professional Repair',
    desc: 'Repairs completed on-site with manufacturer-spec parts. Full workmanship warranty on every job.',
  },
];

const trustBadges = [
  { icon: <ShieldCheck />, label: 'Fully Insured' },
  { icon: <Award />, label: 'Master Certified' },
  { icon: <Star />, label: 'Top-Rated London ON' },
  { icon: <Clock />, label: 'Same-Day Service' },
];

/**
 * Default text shown in the Quote Details textarea when no estimator
 * data has been collected yet. Kept identical to the original copy.
 */
const DEFAULT_DETAILS = `Hi! I would like to request a precise quote for mobile auto repair services. Here are my details:

- Vehicle Year/Make/Model:
- Observed Symptoms:
- Location for On-site Service:
- Preferred Date/Time:

Thank you!`;

const EMPTY_FORM = {
  name: '',
  phone: '',
  vehicle: '',
  details: DEFAULT_DETAILS,
};

/**
 * Build the multi-line "Quote Details" body from an estimator payload.
 * Lays out vehicle, problem, severity, symptoms, history and the
 * preliminary price range — ready to drop straight into an email.
 */
const buildDetailsFromPayload = (p) => {
  const lines = [
    'Hi! Following up on the instant estimate I just generated on your site.',
    '',
    '-- VEHICLE --',
    `Year / Make / Model: ${p.vehicle}`,
    p.mileage ? `Mileage: ${p.mileage} km` : '',
    '',
    '-- PROBLEM --',
    `Category: ${p.categoryName}`,
    `Severity: ${p.severity}/5 — ${p.severityLabel}`,
    p.onsetLabel ? `Onset: ${p.onsetLabel}` : '',
  ];

  if (p.symptoms && p.symptoms.length) {
    lines.push('', '-- SYMPTOMS --');
    p.symptoms.forEach(s => lines.push(`• ${s}`));
  }
  if (p.otherSymptoms) {
    lines.push('', `Additional notes: ${p.otherSymptoms}`);
  }

  lines.push('', '-- HISTORY --',
    `DIY attempted: ${p.diyAttempted ? 'Yes' : 'No'}`,
  );
  if (p.diyAttempted && p.diyDetails) lines.push(`DIY notes: ${p.diyDetails}`);
  lines.push(`Shop visited: ${p.shopVisited ? 'Yes' : 'No'}`);
  if (p.shopVisited && p.shopDetails) lines.push(`Shop notes: ${p.shopDetails}`);

  // Only include the price range if the feature flag allows it.
  // When ESTIMATOR_SHOW_PRICE is OFF the customer never sees the number —
  // not on screen and not in the pre-filled message.
  if (p.estimate && FEATURES.ESTIMATOR_SHOW_PRICE) {
    lines.push('',
      '-- PRELIMINARY ESTIMATE --',
      `$${p.estimate.low.toLocaleString()} – $${p.estimate.high.toLocaleString()} CAD`,
    );
  }

  lines.push('',
    'Please send a precise quote before work begins. I understand the final price may vary slightly on-site. Thank you!',
  );

  return lines.filter(l => l !== null && l !== undefined).join('\n');
};

/**
 * Attaches IntersectionObserver to every element with [data-reveal]
 * inside the given root. Elements get `.is-visible` when scrolled in.
 */
const useScrollReveal = (rootRef) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(t => t.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, [rootRef]);
};

const Home = () => {
  const rootRef = useRef(null);
  useScrollReveal(rootRef);

  // Controlled contact-form state.
  const [contactForm,  setContactForm]  = useState(EMPTY_FORM);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'success' | 'error'

  // Once the user navigates to the contact section via Option B, we keep
  // is-visible permanently in React's className so no subsequent re-render
  // (e.g. justPrefilled toggling) can wipe it out via DOM reconciliation.
  const [contactRevealed, setContactRevealed] = useState(false);

  // Show the prefill banner for 2.5s after auto-fill.
  const [justPrefilled, setJustPrefilled] = useState(false);

  const updateContact = (patch) => setContactForm(f => ({ ...f, ...patch }));

  /**
   * Called by the Estimator when the user picks Option B.
   * Sets React state so is-visible is part of the className prop (never wiped
   * by reconciliation), then scrolls directly to the form block.
   */
  const handleRequestPreciseQuote = (payload) => {
    setContactForm({
      name: '',
      vehicle: payload.vehicle + (payload.mileage ? ` · ${payload.mileage} km` : ''),
      details: buildDetailsFromPayload(payload),
    });
    setContactRevealed(true);
    setJustPrefilled(true);

    requestAnimationFrame(() => {
      const formBlock = document.querySelector('.contact-form-block');
      const fallback  = document.getElementById('contact');
      const target    = formBlock || fallback;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    setTimeout(() => setJustPrefilled(false), 2500);
  };

  /**
   * Submit the contact form — POST to /api/send-email (Vercel serverless).
   * No email client popup; the email is sent server-side via Resend.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch('/api/send-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:    contactForm.name,
          phone:   contactForm.phone,
          vehicle: contactForm.vehicle || 'Not specified',
          details: contactForm.details,
        }),
      });
      if (res.ok) {
        setSubmitStatus('success');
        setContactForm(EMPTY_FORM);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-matte" ref={rootRef}>
      {/* HERO */}
      <section className="hero-industrial" id="home">
        <div className="hero-img"></div>
        <div className="hero-grain"></div>
        <div className="hero-content container">
          <div className="hero-card solid-box" data-reveal>
            <span className="subtitle accent-line">London, ON · Mobile Workshop</span>
            <h1 className="title hero-title">
              <span className="hero-title-line">PRECISION</span>
              <span className="hero-title-line">MOBILE</span>
              <span className="hero-title-line hero-title-accent">SERVICE.</span>
            </h1>
            <p>
              World-class automotive diagnostics, repair, and engineering delivered directly
              to your location. Uncompromising technical expertise — without the showroom wait.
            </p>
            <div className="hero-actions">
              <a href="#contact" className="btn btn-primary btn-arrow">
                Book Consult
                <span className="btn-arrow-icon">→</span>
              </a>
              <a href="#services" className="btn btn-ghost">View Services</a>
            </div>
            <div className="hero-trust" data-reveal>
              {trustBadges.map((t, i) => (
                <div className="hero-trust-item" key={i}>
                  <span className="hero-trust-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span>SCROLL</span>
          <span className="hero-scroll-line" />
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="stats-strip" data-reveal>
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div className="stat-item" key={i}>
                <span className="stat-icon">{s.icon}</span>
                <div className="stat-body">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND MARQUEE */}
      <BrandMarquee />

      {/* SERVICE CATALOGUE */}
      <section className="showroom section" id="services">
        <div className="container">
          <header className="showroom-header" data-reveal>
            <span className="subtitle accent-line">Capabilities</span>
            <h2 className="title">Service <span className="title-accent">Catalogue</span></h2>
            <p className="showroom-lede">
              Thirteen specialized capabilities — from quick diagnostics to complex repairs —
              all delivered on-site with manufacturer-spec tools and parts.
            </p>
          </header>

          <div className="showroom-grid">
            {services.map((svc, idx) => (
              <div className="service-tile" key={svc.id} data-reveal style={{ transitionDelay: `${(idx % 3) * 60}ms` }}>
                <div className="tile-img" style={{ backgroundImage: `url(${svc.img})` }}></div>
                <div className="tile-overlay"></div>
                <span className="tile-number">{String(svc.id).padStart(2, '0')}</span>
                <span className="tile-category">{svc.category}</span>
                <div className="tile-content">
                  <div className="tile-header">
                    <span className="tile-icon">{svc.icon}</span>
                    <h3>{svc.title}</h3>
                  </div>
                  <p className="tile-desc">{svc.desc}</p>
                </div>

                {svc.symptoms && (
                  <div className="tile-visor solid-box">
                    <h4>Symptoms &amp; Triggers</h4>
                    <p>{svc.symptoms}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="process section" id="process">
        <div className="container">
          <header className="process-header" data-reveal>
            <span className="subtitle accent-line">The Method</span>
            <h2 className="title">How It <span className="title-accent">Works.</span></h2>
            <p className="showroom-lede">
              A streamlined four-step protocol built around your time — no towing, no waiting rooms, no surprises.
            </p>
          </header>

          <div className="process-grid">
            {processSteps.map((step, i) => (
              <div className="process-step" key={i} data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="process-step-head">
                  <span className="process-num">{step.num}</span>
                  <span className="process-icon">{step.icon}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < processSteps.length - 1 && <span className="process-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTIMATOR — hidden when FEATURES.ESTIMATOR_ENABLED = false */}
      {FEATURES.ESTIMATOR_ENABLED && (
        <section className="estimator-section section" id="estimator">
          <div className="container">
            <header className="process-header" data-reveal>
              <span className="subtitle accent-line">Get an Estimate</span>
              <h2 className="title">Instant <span className="title-accent">Quote Tool.</span></h2>
              <p className="showroom-lede">
                Pick your vehicle, describe the problem and symptoms — then request a precise quote
                via phone or in writing. No spam, no obligation.
              </p>
            </header>
            <div data-reveal>
              <Estimator onRequestPreciseQuote={handleRequestPreciseQuote} />
            </div>
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section className="about-split" id="about">
        <div className="about-image" data-reveal></div>
        <div className="about-text-block" data-reveal>
          <span className="subtitle accent-line">The Craftsman</span>
          <h2 className="title">German Technical <span className="title-accent">Excellence.</span></h2>
          <hr className="divider" />
          <p>
            I am a highly experienced automotive mechanic with a strong background in diagnosing
            and repairing complex vehicle issues. Having honed my craft in Germany, I specialize
            in the rigorous demands of European brands such as BMW, Mercedes-Benz, Audi, and Volkswagen.
          </p>
          <p>
            My specialization lies in advanced diagnostics, especially in identifying and resolving
            difficult and complex electronic problems. With modern vehicles becoming increasingly
            reliant on sophisticated systems, I use state-of-the-art diagnostic tools along with
            deep technical expertise to pinpoint issues efficiently and accurately. No guesswork. Just precision.
          </p>

          <div className="about-marques">
            <span>BMW</span>
            <span>Mercedes-Benz</span>
            <span>Audi</span>
            <span>Volkswagen</span>
            <span>Porsche</span>
          </div>

          <WhyChooseMe />
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-split" id="contact">
        {/* is-visible in React className so no re-render ever wipes it out */}
        <div
          className={`contact-info-block solid-box${contactRevealed ? ' is-visible' : ''}`}
          data-reveal
        >
          <span className="subtitle accent-line">Logistics</span>
          <h2 className="title">Schedule <span className="title-accent">Deployment.</span></h2>
          <p className="contact-lede">
            Skip the waiting room. Experience premium, on-site mechanical care tailored
            to your exact location and schedule.
          </p>

          <div className="contact-metrics">
            <div className="metric">
              <label>Phone</label>
              <a href="tel:519-617-7214">519-617-7214</a>
            </div>
            <div className="metric">
              <label>Email</label>
              <a href="mailto:Mobile.Automotive@hotmail.com">Mobile.Automotive@hotmail.com</a>
            </div>
            <div className="metric">
              <label>Base</label>
              <p>London, Ontario &amp; Surrounding</p>
            </div>
            <div className="metric">
              <label>Hours</label>
              <p>Mon – Sat · 8am – 8pm</p>
            </div>
          </div>
        </div>

        <div
          className={`contact-form-block${justPrefilled ? ' is-prefilled' : ''}${contactRevealed ? ' is-visible' : ''}`}
          data-reveal
        >
          {justPrefilled && (
            <div className="contact-prefill-banner">
              <CheckCircle2 />
              <span>Prefilled from your estimate — just add your name and submit.</span>
            </div>
          )}
          <form className="brutalist-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="f-name">Full Name</label>
              <input
                id="f-name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                value={contactForm.name}
                onChange={e => updateContact({ name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-phone">Phone Number</label>
              <input
                id="f-phone"
                name="phone"
                type="tel"
                placeholder="519-555-0100"
                required
                value={contactForm.phone}
                onChange={e => updateContact({ phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-vehicle">Vehicle Specs</label>
              <input
                id="f-vehicle"
                name="vehicle"
                type="text"
                placeholder="Year / Make / Model"
                required
                value={contactForm.vehicle}
                onChange={e => updateContact({ vehicle: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="f-details">Quote Details</label>
              <textarea
                id="f-details"
                name="details"
                rows="8"
                value={contactForm.details}
                onChange={e => updateContact({ details: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary submit-btn btn-arrow"
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Submit Request'}
              {!submitting && <span className="btn-arrow-icon">→</span>}
            </button>

            {submitStatus === 'success' && (
              <div className="form-status form-status-success">
                <CheckCircle2 size={18} />
                <span>Request sent! We'll be in touch shortly with your precise quote.</span>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="form-status form-status-error">
                <span>Something went wrong — please call us directly at <strong>519-617-7214</strong>.</span>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
