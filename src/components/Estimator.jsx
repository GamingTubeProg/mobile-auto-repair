import React, { useEffect, useMemo, useState } from 'react';
import {
  Car, Wrench, FileText, ClipboardCheck,
  ChevronLeft, ChevronRight, Check, Loader2,
  Laptop, Zap, BatteryCharging, Settings, ShieldAlert,
  ThermometerSnowflake, Activity, Droplet, Fuel, Cpu,
  Shield, Clock, MapPin,
} from 'lucide-react';
import { getMakes, getModels, getYearRange } from '../utils/nhtsa';
import {
  problemCategories,
  onsetOptions,
  severityLabels,
  contactTimeOptions,
  buildEstimateRange,
} from '../data/estimatorData';
import './Estimator.css';

const STEPS = [
  { id: 'vehicle', label: 'Vehicle',  icon: <Car /> },
  { id: 'problem', label: 'Problem',  icon: <Wrench /> },
  { id: 'details', label: 'Details',  icon: <FileText /> },
  { id: 'review',  label: 'Review',   icon: <ClipboardCheck /> },
];

// Lookup table so categories can reference icons by string name (keeps the
// data file free of React/JSX imports and serialisable).
const iconMap = {
  Laptop: <Laptop />,
  Zap: <Zap />,
  BatteryCharging: <BatteryCharging />,
  Settings: <Settings />,
  ShieldAlert: <ShieldAlert />,
  ThermometerSnowflake: <ThermometerSnowflake />,
  Activity: <Activity />,
  Wrench: <Wrench />,
  Car: <Car />,
  Fuel: <Fuel />,
  Droplet: <Droplet />,
  Cpu: <Cpu />,
};

const INITIAL_FORM = {
  year: '',
  make: '',
  model: '',
  mileage: '',
  categoryId: '',
  symptoms: [],
  otherSymptoms: '',
  severity: 3,
  onset: '',
  diyAttempted: false,
  diyDetails: '',
  shopVisited: false,
  shopDetails: '',
  name: '',
  email: '',
  phone: '',
  contactTime: 'Anytime',
  location: '',
};

const Estimator = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  // NHTSA data
  const years = useMemo(() => getYearRange(), []);
  const [makes, setMakes] = useState([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load makes once
  useEffect(() => {
    let cancelled = false;
    setMakesLoading(true);
    getMakes().then(list => {
      if (!cancelled) {
        setMakes(list);
        setMakesLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Load models when year + make selected
  useEffect(() => {
    if (!form.make || !form.year) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setModelsLoading(true);
    getModels(form.make, form.year).then(list => {
      if (!cancelled) {
        setModels(list);
        setModelsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [form.make, form.year]);

  // Reset model if year/make changes
  useEffect(() => { setForm(f => ({ ...f, model: '' })); }, [form.make, form.year]);

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const toggleSymptom = (s) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter(x => x !== s)
        : [...f.symptoms, s],
    }));
  };

  const activeCategory = problemCategories.find(c => c.id === form.categoryId);

  const estimate = useMemo(() => {
    if (!form.categoryId) return null;
    return buildEstimateRange(form.categoryId, {
      severity: form.severity,
      symptomCount: form.symptoms.length || 1,
      shopVisited: form.shopVisited,
    });
  }, [form.categoryId, form.severity, form.symptoms.length, form.shopVisited]);

  const canProceed = () => {
    if (step === 0) return form.year && form.make && form.model;
    if (step === 1) return !!form.categoryId;
    if (step === 2) return form.symptoms.length > 0 || form.otherSymptoms.trim().length > 0;
    if (step === 3) return form.name && form.email;
    return false;
  };

  const next = () => { if (canProceed() && step < STEPS.length - 1) setStep(s => s + 1); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(0);
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const lines = [
      '=== ESTIMATE REQUEST ===',
      '',
      '-- CUSTOMER --',
      `Name:      ${form.name}`,
      `Email:     ${form.email}`,
      `Phone:     ${form.phone || '—'}`,
      `Location:  ${form.location || '—'}`,
      `Contact:   ${form.contactTime}`,
      '',
      '-- VEHICLE --',
      `Year:      ${form.year}`,
      `Make:      ${form.make}`,
      `Model:     ${form.model}`,
      `Mileage:   ${form.mileage || '—'} km`,
      '',
      '-- PROBLEM --',
      `Category:  ${activeCategory ? activeCategory.name : form.categoryId}`,
      `Severity:  ${form.severity}/5 — ${severityLabels[form.severity - 1]}`,
      `Onset:     ${onsetOptions.find(o => o.value === form.onset)?.label || '—'}`,
      '',
      '-- SYMPTOMS --',
      ...form.symptoms.map(s => `• ${s}`),
      form.otherSymptoms ? `\nAdditional:\n${form.otherSymptoms}` : '',
      '',
      '-- HISTORY --',
      `DIY attempted: ${form.diyAttempted ? 'Yes' : 'No'}`,
      form.diyAttempted && form.diyDetails ? `DIY notes: ${form.diyDetails}` : '',
      `Shop visited:  ${form.shopVisited ? 'Yes' : 'No'}`,
      form.shopVisited && form.shopDetails ? `Shop notes: ${form.shopDetails}` : '',
      '',
      '-- PRELIMINARY ESTIMATE --',
      estimate ? `$${estimate.low} – $${estimate.high} CAD (on-site labour + common parts)` : '',
      '',
      'Please confirm availability and send a final quote. Thank you!',
    ].filter(Boolean).join('\n');

    const subject = encodeURIComponent(
      `Estimate Request — ${form.year} ${form.make} ${form.model} — ${activeCategory?.name || 'Service'}`
    );
    const body = encodeURIComponent(lines);
    window.location.href = `mailto:Mobile.Automotive@hotmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="estimator solid-box">
      {/* HEADER BAR */}
      <div className="est-head">
        <div className="est-head-text">
          <span className="subtitle accent-line">Instant Pricing</span>
          <h3>Build Your <span className="title-accent">Estimate.</span></h3>
          <p>Four quick steps. Powered by the NHTSA vehicle database &amp; real Ontario repair pricing.</p>
        </div>
        <div className="est-head-trust">
          <div><Shield /><span>No obligation</span></div>
          <div><Clock /><span>90-second form</span></div>
          <div><MapPin /><span>On-site quote</span></div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="est-progress">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              className={`est-step-indicator${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
              onClick={() => { if (i < step) setStep(i); }}
            >
              <span className="est-step-dot">
                {i < step ? <Check /> : s.icon}
              </span>
              <span className="est-step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`est-step-bar${i < step ? ' done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {submitted ? (
        <div className="est-success">
          <div className="est-success-icon"><Check /></div>
          <h4>Request sent.</h4>
          <p>
            Your email client just opened with a pre-filled message. Hit <b>Send</b>
            and we&apos;ll confirm your on-site slot within a few business hours.
          </p>
          <div className="est-success-actions">
            <a href="tel:519-617-7214" className="btn btn-primary">Or call 519-617-7214</a>
            <button className="btn btn-ghost" onClick={reset}>Start another estimate</button>
          </div>
        </div>
      ) : (
        <form className="est-body" onSubmit={handleSubmit}>
          {/* STEP 1: VEHICLE */}
          {step === 0 && (
            <div className="est-panel">
              <h4 className="est-panel-title">Tell us about your vehicle.</h4>
              <p className="est-panel-hint">
                Model list is pulled live from the NHTSA vPIC database — 10&#8239;000+ makes, every model year.
              </p>

              <div className="est-grid">
                <div className="est-field">
                  <label>Model Year</label>
                  <select value={form.year} onChange={e => update({ year: e.target.value, make: '', model: '' })}>
                    <option value="" disabled hidden>Select year...</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="est-field">
                  <label>Make {makesLoading && <Loader2 className="spin-icon" />}</label>
                  <select
                    value={form.make}
                    onChange={e => update({ make: e.target.value, model: '' })}
                    disabled={!form.year || makesLoading}
                  >
                    <option value="" disabled hidden>Select make...</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="est-field">
                  <label>Model {modelsLoading && <Loader2 className="spin-icon" />}</label>
                  {models.length > 0 ? (
                    <select
                      value={form.model}
                      onChange={e => update({ model: e.target.value })}
                      disabled={!form.make || modelsLoading}
                    >
                      <option value="" disabled hidden>Select model...</option>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={form.make ? 'Type your model (e.g. 3 Series)' : 'Pick a make first'}
                      value={form.model}
                      onChange={e => update({ model: e.target.value })}
                      disabled={!form.make || modelsLoading}
                    />
                  )}
                </div>

                <div className="est-field">
                  <label>Mileage (km) — optional</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 142000"
                    value={form.mileage}
                    onChange={e => update({ mileage: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROBLEM */}
          {step === 1 && (
            <div className="est-panel">
              <h4 className="est-panel-title">What&apos;s the issue?</h4>
              <p className="est-panel-hint">Pick the closest match — you&apos;ll add specifics next.</p>

              <div className="est-categories">
                {problemCategories.map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    className={`est-category-card${form.categoryId === cat.id ? ' selected' : ''}`}
                    onClick={() => update({ categoryId: cat.id, symptoms: [] })}
                  >
                    <span className="est-category-icon">{iconMap[cat.icon] || <Wrench />}</span>
                    <span className="est-category-name">{cat.name}</span>
                    <span className="est-category-range">${cat.estimate.low} – ${cat.estimate.high}</span>
                    <span className="est-category-desc">{cat.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {step === 2 && activeCategory && (
            <div className="est-panel">
              <h4 className="est-panel-title">Details for: <span className="title-accent">{activeCategory.name}</span></h4>
              <p className="est-panel-hint">Check every symptom you&apos;re seeing. More detail = tighter quote.</p>

              <div className="est-symptoms">
                {activeCategory.symptoms.map(s => (
                  <label
                    key={s}
                    className={`est-symptom${form.symptoms.includes(s) ? ' checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.symptoms.includes(s)}
                      onChange={() => toggleSymptom(s)}
                    />
                    <span className="est-symptom-check"><Check /></span>
                    <span>{s}</span>
                  </label>
                ))}
              </div>

              <div className="est-field">
                <label>Anything else? (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Describe the noise, smell, or behaviour in your own words..."
                  value={form.otherSymptoms}
                  onChange={e => update({ otherSymptoms: e.target.value })}
                />
              </div>

              <div className="est-grid">
                <div className="est-field">
                  <label>How long has this been happening?</label>
                  <select value={form.onset} onChange={e => update({ onset: e.target.value })}>
                    <option value="" disabled hidden>Select...</option>
                    {onsetOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="est-field">
                  <label>How severe does it feel?</label>
                  <div className="est-severity">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={form.severity}
                      onChange={e => update({ severity: parseInt(e.target.value, 10) })}
                    />
                    <div className="est-severity-readout">
                      <span className="est-severity-num">{form.severity}/5</span>
                      <span className="est-severity-text">{severityLabels[form.severity - 1]}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="est-checks">
                <label className={`est-check-row${form.diyAttempted ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.diyAttempted}
                    onChange={e => update({ diyAttempted: e.target.checked })}
                  />
                  <span className="est-symptom-check"><Check /></span>
                  <span>I&apos;ve already attempted a DIY repair</span>
                </label>
                {form.diyAttempted && (
                  <textarea
                    rows="2"
                    placeholder="What did you try? (parts swapped, tests done, etc.)"
                    value={form.diyDetails}
                    onChange={e => update({ diyDetails: e.target.value })}
                  />
                )}

                <label className={`est-check-row${form.shopVisited ? ' checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.shopVisited}
                    onChange={e => update({ shopVisited: e.target.checked })}
                  />
                  <span className="est-symptom-check"><Check /></span>
                  <span>Another shop has already looked at it</span>
                </label>
                {form.shopVisited && (
                  <textarea
                    rows="2"
                    placeholder="What did they say or do?"
                    value={form.shopDetails}
                    onChange={e => update({ shopDetails: e.target.value })}
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 3 && (
            <div className="est-panel">
              <h4 className="est-panel-title">Your preliminary estimate.</h4>

              {estimate && (
                <div className="est-quote">
                  <span className="est-quote-label">On-site labour + common parts (CAD)</span>
                  <span className="est-quote-price">
                    ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
                  </span>
                  <span className="est-quote-hint">
                    Category typical range: ${estimate.catLow} – ${estimate.catHigh}.
                    Final pricing confirmed after on-site diagnostic — no surprises.
                  </span>
                </div>
              )}

              <div className="est-summary">
                <div className="est-summary-row">
                  <span>Vehicle</span>
                  <span>{form.year} {form.make} {form.model}{form.mileage ? ` · ${form.mileage} km` : ''}</span>
                </div>
                <div className="est-summary-row">
                  <span>Issue</span>
                  <span>{activeCategory?.name}</span>
                </div>
                <div className="est-summary-row">
                  <span>Severity</span>
                  <span>{form.severity}/5 — {severityLabels[form.severity - 1]}</span>
                </div>
                <div className="est-summary-row">
                  <span>Symptoms</span>
                  <span>{form.symptoms.length} checked{form.otherSymptoms ? ' + notes' : ''}</span>
                </div>
              </div>

              <h5 className="est-subhead">Where do we send the final quote?</h5>
              <div className="est-grid">
                <div className="est-field">
                  <label>Full Name *</label>
                  <input type="text" required value={form.name} onChange={e => update({ name: e.target.value })} placeholder="John Smith" />
                </div>
                <div className="est-field">
                  <label>Email *</label>
                  <input type="email" required value={form.email} onChange={e => update({ email: e.target.value })} placeholder="you@example.com" />
                </div>
                <div className="est-field">
                  <label>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => update({ phone: e.target.value })} placeholder="519-555-0100" />
                </div>
                <div className="est-field">
                  <label>Best Time to Reach You</label>
                  <select value={form.contactTime} onChange={e => update({ contactTime: e.target.value })}>
                    {contactTimeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="est-field est-field-full">
                  <label>Service Location (street / city)</label>
                  <input type="text" value={form.location} onChange={e => update({ location: e.target.value })} placeholder="e.g. 123 Wellington St, London ON" />
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="est-nav">
            <button type="button" className="btn btn-ghost" onClick={prev} disabled={step === 0}>
              <ChevronLeft /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary btn-arrow" onClick={next} disabled={!canProceed()}>
                Next: {STEPS[step + 1].label}
                <span className="btn-arrow-icon">→</span>
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-arrow" disabled={!canProceed()}>
                Send Estimate Request
                <span className="btn-arrow-icon">→</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Estimator;
