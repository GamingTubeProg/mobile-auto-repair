import React, { useEffect, useMemo, useState } from 'react';
import {
  Car, Wrench, FileText, Sparkles,
  ChevronLeft, Check, Loader2,
  Laptop, Zap, BatteryCharging, Settings, ShieldAlert,
  ThermometerSnowflake, Activity, Droplet, Fuel, Cpu,
  Shield, Clock, MapPin, Mail, ClipboardCheck,
} from 'lucide-react';
import { getMakes, getModels, getYearRange } from '../utils/nhtsa';
import {
  problemCategories,
  onsetOptions,
  severityLabels,
  buildEstimateRange,
} from '../data/estimatorData';
import './Estimator.css';

const STEPS = [
  { id: 'vehicle', label: 'Vehicle',  icon: <Car /> },
  { id: 'problem', label: 'Problem',  icon: <Wrench /> },
  { id: 'details', label: 'Details',  icon: <FileText /> },
  { id: 'result',  label: 'Result',   icon: <Sparkles /> },
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
};

/**
 * Estimator wizard.
 *
 * Props:
 *   onRequestPreciseQuote(payload)
 *     Called when the user picks Option B on the result page.
 *     The parent should prefill its main contact form and scroll to it.
 *     Payload contains everything the customer entered + the calculated estimate.
 */
const Estimator = ({ onRequestPreciseQuote }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [optionAStatus, setOptionAStatus] = useState(null); // null | 'sent'

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
    return true;
  };

  const next = () => { if (canProceed() && step < STEPS.length - 1) setStep(s => s + 1); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(0);
    setOptionAStatus(null);
  };

  /**
   * Build a serialisable summary of the customer's inputs, used both for
   * Option A (mailto subject/body) and Option B (parent prefill payload).
   */
  const buildPayload = () => ({
    year: form.year,
    make: form.make,
    model: form.model,
    vehicle: `${form.year} ${form.make} ${form.model}`.trim(),
    mileage: form.mileage,
    categoryId: form.categoryId,
    categoryName: activeCategory?.name || '',
    symptoms: form.symptoms,
    otherSymptoms: form.otherSymptoms,
    severity: form.severity,
    severityLabel: severityLabels[form.severity - 1],
    onset: form.onset,
    onsetLabel: onsetOptions.find(o => o.value === form.onset)?.label || '',
    diyAttempted: form.diyAttempted,
    diyDetails: form.diyDetails,
    shopVisited: form.shopVisited,
    shopDetails: form.shopDetails,
    estimate,
  });

  /**
   * Format the estimate as plain-text the customer can paste anywhere.
   * Used by Option A (email-me-this-estimate).
   */
  const formatEstimateText = () => {
    const p = buildPayload();
    return [
      '=== YOUR INSTANT ESTIMATE ===',
      '',
      `Vehicle:   ${p.vehicle}${p.mileage ? ` · ${p.mileage} km` : ''}`,
      `Issue:     ${p.categoryName}`,
      `Severity:  ${p.severity}/5 — ${p.severityLabel}`,
      p.onsetLabel ? `Onset:     ${p.onsetLabel}` : '',
      '',
      '-- SYMPTOMS --',
      ...p.symptoms.map(s => `• ${s}`),
      p.otherSymptoms ? `\nAdditional notes:\n${p.otherSymptoms}` : '',
      '',
      '-- PRELIMINARY ESTIMATE --',
      p.estimate ? `$${p.estimate.low.toLocaleString()} – $${p.estimate.high.toLocaleString()} CAD` : '',
      'Final pricing is confirmed after on-site diagnostic.',
      '',
      '---',
      'Mobile Auto Repair · London, ON',
      '519-617-7214 · Mobile.Automotive@hotmail.com',
    ].filter(Boolean).join('\n');
  };

  /** Option A: email this estimate to the user (mailto with no recipient). */
  const handleOptionA = () => {
    const subject = encodeURIComponent(
      `My Auto Repair Estimate — ${form.year} ${form.make} ${form.model}`
    );
    const body = encodeURIComponent(formatEstimateText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOptionAStatus('sent');
  };

  /** Option B: ask parent to prefill the main contact form & scroll there. */
  const handleOptionB = () => {
    if (typeof onRequestPreciseQuote === 'function') {
      onRequestPreciseQuote(buildPayload());
    }
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

      <div className="est-body">
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
                  inputMode="numeric"
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

        {/* STEP 4: RESULT — Option A / Option B */}
        {step === 3 && (
          <div className="est-panel">
            <h4 className="est-panel-title">
              Your <span className="title-accent">Instant Estimate.</span>
            </h4>
            <p className="est-panel-hint">
              Calculated from your vehicle, severity and symptoms. Pick your next step below.
            </p>

            {estimate && (
              <div className="est-quote">
                <span className="est-quote-label">On-site labour + common parts (CAD)</span>
                <span className="est-quote-price">
                  ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
                </span>
                <span className="est-quote-hint">
                  Category typical range: ${estimate.catLow} – ${estimate.catHigh}.
                  Final pricing is confirmed only after an on-site diagnostic — no surprises.
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

            {/* OPTION A / OPTION B CHOICE CARDS */}
            <h5 className="est-subhead">Choose how to proceed</h5>
            <div className="est-choice-grid">
              {/* OPTION A */}
              <div className={`est-choice-card${optionAStatus === 'sent' ? ' is-sent' : ''}`}>
                <span className="est-choice-tag">Option A</span>
                <span className="est-choice-icon"><Mail /></span>
                <h5>Save This Estimate</h5>
                <p>
                  Email yourself a copy of this preliminary estimate so you can review it later.
                  No commitment, no contact request.
                </p>
                {optionAStatus === 'sent' ? (
                  <span className="est-choice-confirm">
                    <Check /> Email opened in your client.
                  </span>
                ) : (
                  <button type="button" className="btn btn-ghost est-choice-cta" onClick={handleOptionA}>
                    <Mail /> Email this estimate to me
                  </button>
                )}
              </div>

              {/* OPTION B */}
              <div className="est-choice-card est-choice-card-primary">
                <span className="est-choice-tag">Option B · Recommended</span>
                <span className="est-choice-icon"><ClipboardCheck /></span>
                <h5>Get a Precise On-Site Quote</h5>
                <p>
                  Continue to a short contact form (your details below are already filled in)
                  and we&apos;ll send a binding quote and book a time.
                </p>
                <button type="button" className="btn btn-primary btn-arrow est-choice-cta" onClick={handleOptionB}>
                  Request precise quote
                  <span className="btn-arrow-icon">→</span>
                </button>
              </div>
            </div>

            <div className="est-result-extra">
              <button type="button" className="est-link-btn" onClick={reset}>
                ← Start a new estimate
              </button>
              <a href="tel:519-617-7214" className="est-link-btn">
                Or call directly: 519-617-7214
              </a>
            </div>
          </div>
        )}

        {/* NAVIGATION (steps 1–3 only) */}
        {step < 3 && (
          <div className="est-nav">
            <button type="button" className="btn btn-ghost" onClick={prev} disabled={step === 0}>
              <ChevronLeft /> Back
            </button>
            <button
              type="button"
              className="btn btn-primary btn-arrow"
              onClick={next}
              disabled={!canProceed()}
            >
              Next: {STEPS[step + 1].label}
              <span className="btn-arrow-icon">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estimator;
