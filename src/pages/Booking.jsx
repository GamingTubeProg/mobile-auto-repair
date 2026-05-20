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

/* Working hours: 8 AM – 6 PM, split into 5 even 2-hour windows.
   IDs stay in 24-hour format for clean DB storage; labels are AM/PM. */
const TIME_SLOTS = [
  { id: '08:00-10:00', label: '8 – 10 AM',     sub: 'Morning'        },
  { id: '10:00-12:00', label: '10 AM – 12 PM', sub: 'Late Morning'   },
  { id: '12:00-14:00', label: '12 – 2 PM',     sub: 'Midday'         },
  { id: '14:00-16:00', label: '2 – 4 PM',      sub: 'Afternoon'      },
  { id: '16:00-18:00', label: '4 – 6 PM',      sub: 'Late Afternoon' },
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
  // Today itself counts as bookable — admin confirms by phone so they
  // can quickly decline if the requested time has already passed.
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return date < today;
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

  /* When the booking is successful, scroll to the top so the user sees
     the "Appointment Booked!" confirmation card and doesn't stay
     parked on the form submit button mid-page (mobile UX issue). */
  useEffect(() => {
    if (done) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [done]);

  /* Load taken slots for the next 56 days */
  useEffect(() => {
    async function load() {
      const todayStr = toDateStr(new Date());
      const maxD = new Date(); maxD.setDate(maxD.getDate() + 56);
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, time_slot, start_time, end_time, status')
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

  /* Slot status: 'free' | 'limited' | 'taken' | 'blocked'.
     - blocked: admin explicitly blocked the whole 2.5h window
     - free:    no admin appointments overlap this window
     - limited: some overlap, but ≤ 75% of the window — customer can
                still request; we will confirm by phone
     - taken:   > 75% of the window already occupied */
  function getSlotStatus(dateStr, slotId) {
    const [sStart, sEnd] = slotId.split('-');
    const slotMin = toMinutes(sEnd) - toMinutes(sStart);

    const overlapping = bookedSlots.filter(b =>
      b.booking_date === dateStr &&
      b.status !== 'cancelled' &&
      b.start_time && b.end_time &&
      b.start_time < sEnd && b.end_time > sStart
    );
    if (overlapping.length === 0) return 'free';

    // Any explicit "blocked" row wins
    if (overlapping.some(b => b.status === 'blocked')) return 'blocked';

    // Sum the overlap minutes of all real appointments
    const totalOverlap = overlapping.reduce((sum, b) => {
      const a = b.start_time > sStart ? b.start_time : sStart;
      const e = b.end_time   < sEnd   ? b.end_time   : sEnd;
      return sum + Math.max(0, toMinutes(e) - toMinutes(a));
    }, 0);

    return totalOverlap / slotMin > 0.75 ? 'taken' : 'limited';
  }
  function toMinutes(t) {
    const [h, m] = t.split(':').map(n => parseInt(n, 10));
    return h * 60 + m;
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

  /* Available slot count = sum of "free" + "limited" across the week */
  const availableCount = weekDates.reduce((acc, d) => {
    if (isPast(d) || isTooFar(d)) return acc;
    return acc + TIME_SLOTS.filter(s => {
      const st = getSlotStatus(toDateStr(d), s.id);
      return st === 'free' || st === 'limited';
    }).length;
  }, 0);

  /* Submit ────────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');

    const dateStr = toDateStr(selDate);
    const slotStatus = getSlotStatus(dateStr, selSlot);
    if (slotStatus === 'taken' || slotStatus === 'blocked') {
      setSubmitError('This slot was just taken — please choose another.');
      setSubmitting(false);
      return;
    }

    // Generate a one-time confirm token stored alongside the booking.
    // The email will contain a direct "Confirm Booking" link using this token.
    const confirmToken = crypto.randomUUID();

    // Derive precise start_time + end_time from the chosen slot ID
    // (e.g. "08:00-10:30" → start "08:00", end "10:30").
    const [slotStart, slotEnd] = selSlot.split('-');

    const { data: inserted, error } = await supabase.from('bookings').insert({
      name:          form.name.trim(),
      phone:         form.phone.trim(),
      vehicle:       form.vehicle.trim(),
      service_type:  service,
      booking_date:  dateStr,
      time_slot:     selSlot,
      start_time:    slotStart,
      end_time:      slotEnd,
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
                        const status   = getSlotStatus(toDateStr(selDate), slot.id);
                        const selected = selSlot === slot.id;
                        const disabled = status === 'taken' || status === 'blocked';
                        const subLabel =
                          status === 'free'    ? slot.sub :
                          status === 'limited' ? 'Limited' :
                          status === 'taken'   ? 'Booked'  :
                          /* blocked */          'Unavailable';
                        return (
                          <button
                            key={slot.id}
                            className={`slot-btn slot-${status}${selected ? ' selected' : ''}`}
                            onClick={() => !disabled && setSelSlot(slot.id)}
                            disabled={disabled}
                            title={status === 'limited'
                              ? 'Some appointments already in this window — your request will be confirmed by phone.'
                              : undefined}
                          >
                            <span className="slot-time">{slot.label}</span>
                            <span className="slot-sub">{subLabel}</span>
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
