import { ClipboardCheck, Search, FileText, ShieldCheck, Car, Clock, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './PrePurchaseInspection.css';

const CHECKS = [
  { icon: <Car />,           title: 'Engine & Transmission',   desc: 'Compression check, fluid condition, leaks, mounts, timing components, transmission shift behaviour.' },
  { icon: <ShieldCheck />,   title: 'Brakes & Suspension',     desc: 'Pad/rotor thickness, brake line condition, shock & strut wear, bushings, ball joints, tie rods.' },
  { icon: <Search />,        title: 'OBD-II Diagnostic Scan',  desc: 'Live data read, fault-code history, readiness monitors, manufacturer-specific module scan.' },
  { icon: <FileText />,      title: 'Body, Frame & Paint',     desc: 'Panel-gap consistency, paint thickness measurement, evidence of prior collision repair, rust assessment.' },
  { icon: <ClipboardCheck />, title: 'Electrical & Electronics', desc: 'Battery load test, alternator output, all lights, infotainment, sensors, power accessories.' },
  { icon: <Car />,           title: 'Tires & Wheels',           desc: 'Tread depth, age, even wear pattern, sidewall damage, wheel runout, alignment indicators.' },
];

export default function PrePurchaseInspection() {
  return (
    <div className="app">
      <Navbar />

      <section className="ppi-hero">
        <div className="container ppi-hero-inner">
          <span className="subtitle accent-line">Before You Buy</span>
          <h1 className="title">
            Pre-Purchase <span className="title-accent">Inspection.</span>
          </h1>
          <p className="ppi-hero-sub">
            Don&apos;t spend $10,000 on a car without knowing what&apos;s really wrong with it.
            We come to the seller&apos;s location, run a full mechanical &amp; electronic
            inspection, and give you an honest verdict before you sign anything.
          </p>

          <div className="ppi-hero-actions">
            <a href="/booking" className="btn btn-primary btn-arrow">
              Book Inspection
              <span className="btn-arrow-icon">→</span>
            </a>
            <a href="tel:519-617-7214" className="btn btn-ghost">
              <Phone /> 519-617-7214
            </a>
          </div>

          <div className="ppi-hero-stats">
            <div><Clock /><span>60–90 min on-site</span></div>
            <div><MapPin /><span>Dealer, private seller or auction</span></div>
            <div><FileText /><span>Written report included</span></div>
          </div>
        </div>
      </section>

      {/* What's checked */}
      <section className="section ppi-checks">
        <div className="container">
          <header className="ppi-section-header">
            <span className="subtitle accent-line">What We Check</span>
            <h2 className="title">A 60-Point <span className="title-accent">Inspection.</span></h2>
            <p className="ppi-section-lede">
              Every inspection follows the same checklist so nothing gets missed —
              from compression and brake-line condition to paint thickness and OBD-II
              fault history.
            </p>
          </header>

          <div className="ppi-grid">
            {CHECKS.map((c, i) => (
              <article key={i} className="ppi-card">
                <span className="ppi-card-icon">{c.icon}</span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="section ppi-why">
        <div className="container ppi-why-inner">
          <div className="ppi-why-text">
            <span className="subtitle accent-line">Why Bother</span>
            <h2 className="title">A $200 Inspection Can Save <span className="title-accent">$5,000.</span></h2>
            <p>
              Used-car listings rarely tell the whole story. A car can look immaculate
              and still have a slipping transmission, a head-gasket leak forming,
              hidden frame damage from a collision, or a chronic electronic fault that
              will cost thousands to chase down later.
            </p>
            <p>
              A neutral mechanical inspection — done by someone who isn&apos;t the seller —
              is the single highest-value thing you can do before handing over money.
              We&apos;ve walked customers away from cars that would have ruined them,
              and we&apos;ve also given green lights on cars that turned out to be
              everything the seller said.
            </p>

            <ul className="ppi-bullet-list">
              <li><CheckCircle2 /> Independent — we don&apos;t care if you buy the car or not.</li>
              <li><CheckCircle2 /> Negotiation leverage — written findings are a powerful price tool.</li>
              <li><CheckCircle2 /> We come to the seller — no need to convince them to drive to a shop.</li>
              <li><CheckCircle2 /> Honest verdict — pass / pass-with-caveats / walk away.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section ppi-cta">
        <div className="container ppi-cta-inner">
          <h2 className="title">
            Found a Car You <span className="title-accent">Like?</span>
          </h2>
          <p>Tell us the address, year, make, model — we&apos;ll be there.</p>
          <div className="ppi-cta-actions">
            <a href="/booking" className="btn btn-primary btn-arrow">
              Book Inspection
              <span className="btn-arrow-icon">→</span>
            </a>
            <a href="tel:519-617-7214" className="btn btn-ghost">
              Call 519-617-7214
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
