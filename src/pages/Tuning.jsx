import { useState, useMemo } from 'react';
import { VEHICLES, SERVICE_INFO } from '../data/tuningData';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Tuning.css';

/* ── helpers ── */
function uniq(arr) { return [...new Set(arr)].sort(); }

function BarCompare({ label, stockVal, tunedVal, stage2Val, maxVal }) {
  const stockPct  = Math.round((stockVal  / maxVal) * 100);
  const tunedPct  = Math.round((tunedVal  / maxVal) * 100);
  const stage2Pct = stage2Val ? Math.round((stage2Val / maxVal) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-tracks">
        <div className="bar-line">
          <span className="bar-tag stock">Stock</span>
          <div className="bar-bg">
            <div className="bar-fill stock-fill" style={{ width: `${stockPct}%` }} />
          </div>
          <span className="bar-val">{stockVal}</span>
        </div>
        <div className="bar-line">
          <span className="bar-tag stage1">Stage 1</span>
          <div className="bar-bg">
            <div className="bar-fill stage1-fill" style={{ width: `${tunedPct}%` }} />
          </div>
          <span className="bar-val gain">+{tunedVal - stockVal}</span>
        </div>
        {stage2Val && (
          <div className="bar-line">
            <span className="bar-tag stage2">Stage 2</span>
            <div className="bar-bg">
              <div className="bar-fill stage2-fill" style={{ width: `${stage2Pct}%` }} />
            </div>
            <span className="bar-val gain">+{stage2Val - stockVal}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceBadge({ id }) {
  const s = SERVICE_INFO[id];
  if (!s) return null;
  return (
    <div className="svc-badge" style={{ '--svc-color': s.color }}>
      <span className="svc-tag">{s.tag}</span>
      <div className="svc-info">
        <strong>{s.label}</strong>
        <p>{s.benefit}</p>
      </div>
    </div>
  );
}

function TuningResult({ vehicle }) {
  const maxHp = Math.max(
    vehicle.stock.hp,
    vehicle.stage1.hp,
    vehicle.stage2?.hp ?? 0,
  ) * 1.15;
  const maxNm = Math.max(
    vehicle.stock.nm,
    vehicle.stage1.nm,
    vehicle.stage2?.nm ?? 0,
  ) * 1.15;

  return (
    <div className="tuning-result">
      <div className="result-header">
        <div>
          <p className="result-label">Selected Vehicle</p>
          <h2 className="result-title">{vehicle.make} {vehicle.model}</h2>
          <p className="result-sub">{vehicle.engine} · {vehicle.years}</p>
        </div>
        <div className="result-badges">
          <span className="meta-badge">ECU: {vehicle.ecu}</span>
          <span className="meta-badge">Mode: {vehicle.mode}</span>
          <span className={`meta-badge fuel-${vehicle.fuel}`}>{vehicle.fuel.toUpperCase()}</span>
        </div>
      </div>

      <div className="result-body">
        {/* Performance bars */}
        <div className="perf-panel">
          <h3 className="panel-title">Performance</h3>
          <BarCompare
            label="PS"
            stockVal={vehicle.stock.hp}
            tunedVal={vehicle.stage1.hp}
            stage2Val={vehicle.stage2?.hp}
            maxVal={maxHp}
          />
          <BarCompare
            label="Nm"
            stockVal={vehicle.stock.nm}
            tunedVal={vehicle.stage1.nm}
            stage2Val={vehicle.stage2?.nm}
            maxVal={maxNm}
          />

          <div className="perf-numbers">
            <div className="perf-col">
              <span className="perf-num">{vehicle.stock.hp} PS</span>
              <span className="perf-num-label">Stock power</span>
            </div>
            <div className="perf-arrow">→</div>
            <div className="perf-col accent">
              <span className="perf-num">{vehicle.stage1.hp} PS</span>
              <span className="perf-num-label">Stage 1</span>
            </div>
            {vehicle.stage2 && (
              <>
                <div className="perf-arrow">→</div>
                <div className="perf-col accent2">
                  <span className="perf-num">{vehicle.stage2.hp} PS</span>
                  <span className="perf-num-label">Stage 2</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Available services */}
        <div className="services-panel">
          <h3 className="panel-title">Available Services</h3>
          <div className="svc-list">
            {vehicle.services.map(id => (
              <ServiceBadge key={id} id={id} />
            ))}
          </div>
        </div>
      </div>

      <div className="result-cta">
        <p>Ready to unlock your vehicle's full potential?</p>
        <a href="/#contact" className="btn btn-primary">Get a Free Quote</a>
      </div>
    </div>
  );
}

/* ── All services overview ── */
function ServicesOverview() {
  const featured = ['stage1', 'stage2', 'egr', 'dpf', 'adblue', 'immo', 'dtc', 'swirl'];
  return (
    <section className="services-overview">
      <div className="container">
        <span className="subtitle">What We Offer</span>
        <h2 className="title">Tuning Services</h2>
        <div className="svc-grid">
          {featured.map(id => {
            const s = SERVICE_INFO[id];
            return (
              <div key={id} className="svc-card" style={{ '--svc-color': s.color }}>
                <div className="svc-card-tag" style={{ background: s.color }}>{s.tag}</div>
                <h3 className="svc-card-title">{s.label}</h3>
                <p className="svc-card-desc">{s.desc}</p>
                <p className="svc-card-benefit">✓ {s.benefit}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function Tuning() {
  const [make,   setMake]   = useState('');
  const [model,  setModel]  = useState('');
  const [engine, setEngine] = useState('');

  const makes  = useMemo(() => uniq(VEHICLES.map(v => v.make)), []);
  const models = useMemo(() =>
    make ? uniq(VEHICLES.filter(v => v.make === make).map(v => v.model)) : [],
  [make]);
  const engines = useMemo(() =>
    model ? VEHICLES.filter(v => v.make === make && v.model === model) : [],
  [make, model]);

  const result = useMemo(() =>
    engine ? VEHICLES.find(v => v.id === engine) : null,
  [engine]);

  function handleMake(val) {
    setMake(val);
    setModel('');
    setEngine('');
  }
  function handleModel(val) {
    setModel(val);
    setEngine('');
  }

  return (
    <div className="app">
      <Navbar tuningPage />

      {/* Hero */}
      <section className="tuning-hero">
        <div className="tuning-hero-bg" aria-hidden="true">
          <div className="hero-grid" />
        </div>
        <div className="container tuning-hero-content">
          <span className="subtitle">Mobile Auto Repair — London, ON</span>
          <h1 className="title tuning-hero-title">
            Performance<br />
            <span className="title-accent">Tuning &amp; Optimization</span>
          </h1>
          <p className="tuning-hero-text">
            Professional ECU remapping and engine optimization for over 50 vehicle platforms.
            Unlock hidden power, improve throttle response, and reduce running costs.
          </p>
          <div className="hero-stats">
            <div className="hero-stat"><span className="stat-num">50+</span><span>Platforms</span></div>
            <div className="hero-stat"><span className="stat-num">OBD</span><span>No teardown</span></div>
            <div className="hero-stat"><span className="stat-num">100%</span><span>Mobile service</span></div>
          </div>
        </div>
      </section>

      {/* Vehicle Lookup */}
      <section className="tuning-lookup">
        <div className="container">
          <span className="subtitle">Find Your Vehicle</span>
          <h2 className="title lookup-title">What Can We Do for Your Car?</h2>

          <div className="lookup-card">
            <div className="lookup-selects">
              <div className="select-wrap">
                <label>Make</label>
                <select value={make} onChange={e => handleMake(e.target.value)}>
                  <option value="">Select Make</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className={`select-wrap${!make ? ' disabled' : ''}`}>
                <label>Model</label>
                <select value={model} onChange={e => handleModel(e.target.value)} disabled={!make}>
                  <option value="">Select Model</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className={`select-wrap${!model ? ' disabled' : ''}`}>
                <label>Engine</label>
                <select value={engine} onChange={e => setEngine(e.target.value)} disabled={!model}>
                  <option value="">Select Engine</option>
                  {engines.map(v => (
                    <option key={v.id} value={v.id}>{v.engine} · {v.years}</option>
                  ))}
                </select>
              </div>
            </div>

            {!result && (
              <p className="lookup-hint">
                Select your vehicle above to see available tuning options and performance gains.
              </p>
            )}
          </div>

          {result && <TuningResult vehicle={result} />}
        </div>
      </section>

      <ServicesOverview />

      {/* Disclaimer */}
      <section className="tuning-disclaimer">
        <div className="container">
          <p>
            <strong>Notice:</strong> DPF removal, AdBlue deletion, and EGR delete are intended for
            off-road, motorsport, or racing use only and may not be legal for vehicles operated on
            public roads in Canada. It is the vehicle owner's responsibility to ensure compliance
            with local emissions regulations. Mobile Auto Repair assumes no liability for
            non-compliant use.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
