import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Booking.css';

/* ── Constants ────────────────────────────────────────── */
const SERVICES = [
  { id: 'diagnose',  label: 'Diagnostics & Troubleshooting', desc: 'OBD scan, fault analysis, no-start issues' },
  { id: 'reparatur', label: 'Repair',                        desc: 'Engine, electrical, suspension, brakes & more' },
  { id: 'tuning',    label: 'ECU Tuning',                    desc: 'Stage 1/2, EGR/DPF/AdBlue, bench mode' },
  { id: 'wartung',   label: 'Maintenance & Inspection',      desc: 'Oil change, inspection, filter service' },
  { id: 'sonstiges', label: 'Other',                         desc: 'Consultation or other services' },
];

const TIME_SLOTS = [
  { id: '09:00-11:00', label: '09:00 – 11:00', sub: 'Morning' },
  { id: '11:00-13:00', label: '11:00 – 13:00', sub: 'Midday' },
  { id: '13:00-15:00', label: '13:00 – 15:00', sub: 'Afternoon' },
  { id: '15:00-17:00', label: '15:00 – 17:00', sub: 'Late Afternoon' },
];

const DAY_NAMES   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* Map Estimator category IDs → booking service IDs */
const CATEGORY_TO_SERVICE = {
  diagnostics:  'diagnose',
  nostart:      'diagnose',
  battery:      'diagnose',
  electrical:   'diagnose',
  engine:       'reparatur',
  brakes:       'reparatur',
  cooling:      'reparatur',
  transmission: 'reparatur',
  suspension:   'reparatur',
  tires:        'reparatur',
  fuel:         'reparatur',
  oil:          'wartung',
  other:        'sonstiges',
};

/* ── Date helpers ─────────────────────────────────────── */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLong(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getMonday(d) {
  const date = new Date(d); date.setHours(0, 0, 0, 0);
  const day  = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
}

function getWeekDates(monday) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
}

function isToday(date) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return toDateStr(date) === toDateStr(t);
}

function isPast(date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return date <= today;
}

function isTooFar(date) {
  const max = new Date(); max.setDate(max.getDate() + 56);
  return date > max;
}

/* Build prefilled notes from estimator payload */
function buildNotesFromEstimate(data) {
  const lines = [];
  if (data.categoryName)      lines.push(`Problem: ${data.categoryName}`);
  if (data.symptoms?.length)  lines.push(`Symptoms: ${data.symptoms.join(', ')}`);
  if (data.otherSymptoms)     lines.push(`Notes: ${data.otherSymptoms}`);
  if (data.severityLabel)     lines.push(`Severity: ${data.severity}/5 – ${data.severityLabel}`);
  if (data.onsetLabel)        lines.push(`Duration: ${data.onsetLabel}`);
  if (data.diyAttempted && data.diyDetails)  lines.push(`DIY attempted: ${data.diyDetails}`);
  if (data.shopVisited  && data.shopDetails) lines.push(`Previous shop: ${data.shopDetails}`);
  return lines.join('\n');
}

/* ── Step indicator ───────────────────────────────────── */
function StepBar({ step }) {
  const labels = ['Service', 'Date & Time', 'Contact'];
  return (
    <div className="booking-steps">
      {labels.map((label, i) => (
        <div key={i} className={`bstep${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
          <span className="bstep-num">{step > i + 1 ? '✓' : i + 1}</span>
          <span className="bstep-label">{label}</span>
          {i < labels.length - 1 && <span className="bstep-line" />}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function Booking() {
  const [step,         setStep]        = useState(1);
  const [service,      setService]     = useState('');
  const [fromEstimate, setFromEstimate] = useState(null);
  const [weekStart,    setWeekStart]   = useState(() => getMonday(new Date()));
  const [selDate,      setSelDate]     = useState(null);
  const [selSlot,      setSelSlot]     = useState('');
  const [bookedSlots,  setBookedSlots] = useState([]);
  const [form,         setForm]        = useState({ name: '', phone: '', vehicle: '', notes: '' });
  const [submitting,   setSubmitting]  = useState(false);
  const [submitError,  setSubmitError] = useState('');
  const [done,         setDone]        = useState(false);

  /* Load taken slots for the next 56 days */
  useEffect(() => {
    async function load() {
      const todayStr = toDateStr(new Date());
      const maxD = new Date(); maxD.setDate(maxD.getDate() + 56);
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, time_slot, status')
        .gte('booking_date', todayStr)
        .lte('booking_date', toDateStr(maxD));
      if (data) setBookedSlots(data);
    }
    load();
  }, []);

  /* Read estimator pre-fill from sessionStorage */
  useEffect(() => {
    const raw = sessionStorage.getItem('mar_estimate');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const mappedService = CATEGORY_TO_SERVICE[data.categoryId] ?? 'sonstiges';
      setService(mappedService);
      setForm(f => ({
        ...f,
        vehicle: data.vehicle || '',
        notes:   buildNotesFromEstimate(data),
      }));
      setFromEstimate(data);
      setStep(2); // skip service step — already known
    } catch { /* ignore */ }
    sessionStorage.removeItem('mar_estimate');
  }, []);

  function isSlotTaken(dateStr, slotId) {
    return bookedSlots.some(
      b => b.booking_date === dateStr && b.time_slot === slotId && b.status !== 'cancelled'
    );
  }

  /* Week navigation ─────────────────────────────────── */
  const weekDates  = getWeekDates(weekStart);
  const todayMon   = getMonday(new Date());
  const canGoPrev  = weekStart > todayMon;
  const maxWeekMon = getMonday(new Date()); maxWeekMon.setDate(maxWeekMon.getDate() + 49);
  const canGoNext  = weekStart < maxWeekMon;

  function prevWeek() {
    const w = new Date(weekStart); w.setDate(w.getDate() - 7);
    setWeekStart(w); setSelDate(null); setSelSlot('');
  }
  function nextWeek() {
    const w = new Date(weekStart); w.setDate(w.getDate() + 7);
    setWeekStart(w); setSelDate(null); setSelSlot('');
  }

  /* Available slot count for the displayed week */
  const availableCount = weekDates.reduce((acc, d) => {
    if (isPast(d) || isTooFar(d)) return acc;
    return acc + TIME_SLOTS.filter(s => !isSlotTaken(toDateStr(d), s.id)).length;
  }, 0);

  /* Submit ────────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');

    const dateStr = toDateStr(selDate);
    if (isSlotTaken(dateStr, selSlot)) {
      setSubmitError('This slot was just taken — please choose another.');
      setSubmitting(false);
      return;
    }

    // Generate a one-time confirm token stored alongside the booking.
    // The email will contain a direct "Confirm Booking" link using this token.
    const confirmToken = crypto.randomUUID();

    const { data: inserted, error } = await supabase.from('bookings').insert({
      name:          form.name.trim(),
      phone:         form.phone.trim(),
      vehicle:       form.vehicle.trim(),
      service_type:  service,
      booking_date:  dateStr,
      time_slot:     selSlot,
      notes:         form.notes.trim(),
      confirm_token: confirmToken,
    }).select('id').single();

    if (error) {
      setSubmitError('Booking failed — please try again.');
      setSubmitting(false);
      return;
    }

    // Notify owner (fire-and-forget)
    const svcLabel  = SERVICES.find(s => s.id === service)?.label ?? service;
    const slotLabel = TIME_SLOTS.find(s => s.id === selSlot)?.label ?? selSlot;
    fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:         'booking',
        subject:      `🗓️ New Appointment Request – ${formatDateLong(selDate)} ${slotLabel}${form.name ? ' – ' + form.name : ''}`,
        name:         form.name,
        phone:        form.phone,
        vehicle:      form.vehicle,
        bookingId:    inserted?.id,
        confirmToken: confirmToken,
        details: [
          `Date:    ${formatDateLong(selDate)}`,
          `Time:    ${slotLabel}`,
          `Service: ${svcLabel}`,
          form.notes ? `\nNotes:\n${form.notes}` : '',
        ].filter(Boolean).join('\n'),
      }),
    }).catch(() => {});

    setDone(true);
    setSubmitting(false);
  }

  /* ── Derived ─────────────────────────────────────────── */
  const selService = SERVICES.find(s => s.id === service);
  const selSlotObj = TIME_SLOTS.find(s => s.id === selSlot);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="app">
      <Navbar bookingPage />

      {/* Hero */}
      <section className="booking-hero">
        <div className="container booking-hero-inner">
          <span className="subtitle">Mobile Auto Repair — London, ON</span>
          <h1 className="title">Book an <span className="title-accent">Appointment</span></h1>
          <p className="booking-hero-sub">
            Choose your preferred time — we come directly to you.
          </p>
        </div>
      </section>

      <div className="container booking-container">
        {!done ? (
          <>
            <StepBar step={step} />

            {/* ── Step 1: Service ── */}
            {step === 1 && (
              <div className="booking-card">
                <h2 className="booking-card-title">What service do you need?</h2>
                <div className="service-grid">
                  {SERVICES.map(s => (
                    <button
                      key={s.id}
                      className={`service-card${service === s.id ? ' selected' : ''}`}
                      onClick={() => setService(s.id)}
                    >
                      <strong className="sc-label">{s.label}</strong>
                      <span className="sc-desc">{s.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="booking-nav">
                  <span />
                  <button className="btn btn-primary" disabled={!service} onClick={() => setStep(2)}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Date + Time ── */}
            {step === 2 && (
              <div className="booking-card">
                <h2 className="booking-card-title">Select Date &amp; Time</h2>

                {/* Estimator pre-fill notice */}
                {fromEstimate && (
                  <div className="from-estimate-banner">
                    <span className="feb-icon">✓</span>
                    <span>
                      Service <strong>{selService?.label}</strong> pre-selected from your estimate.
                      {' '}<button className="feb-change-btn" onClick={() => setStep(1)}>Change</button>
                    </span>
                  </div>
                )}

                {/* Week navigation */}
                <div className="cal-nav">
                  <button className="cal-nav-btn" onClick={prevWeek} disabled={!canGoPrev}>←</button>
                  <span className="cal-nav-label">
                    {weekDates[0].getDate()} {MONTH_SHORT[weekDates[0].getMonth()]}
                    {' – '}
                    {weekDates[5].getDate()} {MONTH_SHORT[weekDates[5].getMonth()]} {weekDates[5].getFullYear()}
                  </span>
                  <button className="cal-nav-btn" onClick={nextWeek} disabled={!canGoNext}>→</button>
                </div>

                {/* Available slots indicator */}
                {availableCount > 0 ? (
                  <p className="cal-available-text">
                    ● {availableCount} available slot{availableCount !== 1 ? 's' : ''} this week
                  </p>
                ) : (
                  <p className="cal-available-text none">No available slots this week</p>
                )}

                {/* Day grid */}
                <div className="cal-grid">
                  {weekDates.map((d, i) => {
                    const disabled   = isPast(d) || isTooFar(d);
                    const isSelected = selDate && toDateStr(d) === toDateStr(selDate);
                    const isNow      = isToday(d);
                    return (
                      <button
                        key={i}
                        className={`cal-day${disabled ? ' disabled' : ''}${isSelected ? ' selected' : ''}${isNow ? ' today' : ''}`}
                        onClick={() => { if (!disabled) { setSelDate(d); setSelSlot(''); } }}
                        disabled={disabled}
                      >
                        <span className="cal-day-name">{DAY_NAMES[i]}</span>
                        <span className="cal-day-num">{d.getDate()}</span>
                        <span className="cal-day-month">{MONTH_SHORT[d.getMonth()]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                {selDate && (
                  <div className="slot-section">
                    <p className="slot-heading">
                      <strong>{formatDateLong(selDate)}</strong> — Choose a time:
                    </p>
                    <div className="slot-grid">
                      {TIME_SLOTS.map(slot => {
                        const taken    = isSlotTaken(toDateStr(selDate), slot.id);
                        const selected = selSlot === slot.id;
                        return (
                          <button
                            key={slot.id}
                            className={`slot-btn${taken ? ' taken' : ''}${selected ? ' selected' : ''}`}
                            onClick={() => !taken && setSelSlot(slot.id)}
                            disabled={taken}
                          >
                            <span className="slot-time">{slot.label}</span>
                            <span className="slot-sub">{taken ? 'Taken' : slot.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="booking-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={!selDate || !selSlot}
                    onClick={() => setStep(3)}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Contact ── */}
            {step === 3 && (
              <div className="booking-card">
                <h2 className="booking-card-title">Your Contact Details</h2>

                {/* Booking summary */}
                <div className="booking-summary">
                  <div className="bsum-row">
                    <span>Service</span><strong>{selService?.label}</strong>
                  </div>
                  <div className="bsum-row">
                    <span>Date</span><strong>{selDate && formatDateLong(selDate)}</strong>
                  </div>
                  <div className="bsum-row">
                    <span>Time</span><strong>{selSlotObj?.label}</strong>
                  </div>
                </div>

                {/* Estimator pre-fill notice */}
                {fromEstimate && (
                  <div className="from-estimate-banner">
                    <span className="feb-icon">✓</span>
                    <span>
                      Vehicle and problem description pre-filled from your estimate — review and adjust if needed.
                    </span>
                  </div>
                )}

                <div className="booking-form">
                  <div className="form-group">
                    <label htmlFor="b-name">Full Name *</label>
                    <input
                      id="b-name"
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="b-phone">Phone *</label>
                    <input
                      id="b-phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="519-617-7214"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="b-vehicle">Vehicle</label>
                    <input
                      id="b-vehicle"
                      type="text"
                      value={form.vehicle}
                      onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
                      placeholder="e.g. BMW 320d 2014"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="b-notes">
                      Problem Description
                      {fromEstimate && <span className="label-badge">from estimate</span>}
                    </label>
                    <textarea
                      id="b-notes"
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={fromEstimate ? 6 : 3}
                      placeholder="Describe your issue, questions…"
                    />
                  </div>
                </div>

                {submitError && <p className="booking-error">{submitError}</p>}

                <div className="booking-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={!form.name.trim() || !form.phone.trim() || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Booking…' : 'Book Appointment →'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Success ── */
          <div className="booking-success">
            <div className="success-check">✓</div>
            <h2 className="success-title">Appointment Booked!</h2>
            <p className="success-sub">
              Your appointment has been saved. We will call you shortly to confirm.
            </p>
            <div className="booking-summary success-summary">
              <div className="bsum-row">
                <span>Service</span><strong>{selService?.label}</strong>
              </div>
              <div className="bsum-row">
                <span>Date</span><strong>{selDate && formatDateLong(selDate)}</strong>
              </div>
              <div className="bsum-row">
                <span>Time</span><strong>{selSlotObj?.label}</strong>
              </div>
              <div className="bsum-row">
                <span>Name</span><strong>{form.name}</strong>
              </div>
              <div className="bsum-row">
                <span>Phone</span><strong>{form.phone}</strong>
              </div>
            </div>
            <a href="/" className="btn btn-primary">Back to Homepage →</a>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
