import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Booking.css';

/* ── Constants ────────────────────────────────────────── */
const SERVICES = [
  { id: 'diagnose',  label: 'Diagnose & Fehlersuche',  desc: 'OBD-Diagnose, Fehleranalyse, no-start Probleme' },
  { id: 'reparatur', label: 'Reparatur',                desc: 'Motor, Elektrik, Fahrwerk, Bremsen & mehr' },
  { id: 'tuning',    label: 'ECU-Tuning',               desc: 'Stage 1/2, EGR/DPF/AdBlue, Bench-Mode' },
  { id: 'wartung',   label: 'Wartung & Inspektion',     desc: 'Ölwechsel, Inspektion, Filterservice' },
  { id: 'sonstiges', label: 'Sonstiges',                desc: 'Beratung oder andere Leistungen' },
];

const TIME_SLOTS = [
  { id: '09:00-11:00', label: '09:00 – 11:00', sub: 'Vormittag' },
  { id: '11:00-13:00', label: '11:00 – 13:00', sub: 'Mittag' },
  { id: '13:00-15:00', label: '13:00 – 15:00', sub: 'Nachmittag' },
  { id: '15:00-17:00', label: '15:00 – 17:00', sub: 'Spätnachmittag' },
];

const DAY_NAMES   = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember',
];
const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

/* Map Estimator category IDs to booking service IDs */
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
  return `${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
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
  const max = new Date(); max.setDate(max.getDate() + 90);
  return date > max;
}

/* Build the cell array for a month calendar (Mon–Sat only, no Sundays) */
function getMonthCells(year, month) {
  const cells     = [];
  const firstDay  = new Date(year, month, 1);
  const lastDate  = new Date(year, month + 1, 0).getDate();
  // Leading empty cells: Mon=0 offset, Tue=1, ..., Sat=5, Sun→skip (0 offset)
  const dow         = firstDay.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const leadingCount = dow === 0 ? 0 : dow - 1;
  for (let i = 0; i < leadingCount; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0) continue; // skip Sundays
    cells.push(date);
  }
  return cells;
}

/* Build a prefilled notes string from estimator payload */
function buildNotesFromEstimate(data) {
  const lines = [];
  if (data.categoryName)      lines.push(`Problem: ${data.categoryName}`);
  if (data.symptoms?.length)  lines.push(`Symptome: ${data.symptoms.join(', ')}`);
  if (data.otherSymptoms)     lines.push(`Notiz: ${data.otherSymptoms}`);
  if (data.severityLabel)     lines.push(`Schweregrad: ${data.severity}/5 – ${data.severityLabel}`);
  if (data.onsetLabel)        lines.push(`Seit: ${data.onsetLabel}`);
  if (data.diyAttempted && data.diyDetails)  lines.push(`DIY: ${data.diyDetails}`);
  if (data.shopVisited  && data.shopDetails) lines.push(`Vorherige Werkstatt: ${data.shopDetails}`);
  return lines.join('\n');
}

/* ── Step indicator ───────────────────────────────────── */
function StepBar({ step }) {
  const labels = ['Service', 'Datum & Zeit', 'Kontakt'];
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
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);

  const [step,         setStep]        = useState(1);
  const [service,      setService]     = useState('');
  const [fromEstimate, setFromEstimate] = useState(null); // estimator payload if arrived from estimator
  const [calYear,      setCalYear]     = useState(todayMidnight.getFullYear());
  const [calMonth,     setCalMonth]    = useState(todayMidnight.getMonth());
  const [selDate,      setSelDate]     = useState(null);
  const [selSlot,      setSelSlot]     = useState('');
  const [bookedSlots,  setBookedSlots] = useState([]);
  const [form,         setForm]        = useState({ name: '', phone: '', vehicle: '', notes: '' });
  const [submitting,   setSubmitting]  = useState(false);
  const [submitError,  setSubmitError] = useState('');
  const [done,         setDone]        = useState(false);

  /* Load all taken slots for the next 90 days once on mount */
  useEffect(() => {
    async function load() {
      const todayStr = toDateStr(new Date());
      const maxD = new Date(); maxD.setDate(maxD.getDate() + 90);
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, time_slot, status')
        .gte('booking_date', todayStr)
        .lte('booking_date', toDateStr(maxD));
      if (data) setBookedSlots(data);
    }
    load();
  }, []);

  /* Check sessionStorage for estimator pre-fill data */
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
      setStep(2); // skip service selection — already known from estimate
    } catch { /* ignore */ }
    sessionStorage.removeItem('mar_estimate');
  }, []);

  function isSlotTaken(dateStr, slotId) {
    return bookedSlots.some(
      b => b.booking_date === dateStr && b.time_slot === slotId && b.status !== 'cancelled'
    );
  }

  /* Month navigation ─────────────────────────────────── */
  const minYear  = todayMidnight.getFullYear();
  const minMonth = todayMidnight.getMonth();
  const maxBound = new Date(todayMidnight); maxBound.setDate(maxBound.getDate() + 90);
  const maxYear  = maxBound.getFullYear();
  const maxMonth = maxBound.getMonth();

  const canGoPrevMonth = !(calYear === minYear && calMonth === minMonth);
  const canGoNextMonth = !(calYear === maxYear && calMonth === maxMonth);

  function prevMonth() {
    if (!canGoPrevMonth) return;
    setSelDate(null); setSelSlot('');
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (!canGoNextMonth) return;
    setSelDate(null); setSelSlot('');
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  /* Submit ────────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');

    const dateStr = toDateStr(selDate);
    if (isSlotTaken(dateStr, selSlot)) {
      setSubmitError('Dieser Slot wurde soeben vergeben — bitte einen anderen wählen.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      name:         form.name.trim(),
      phone:        form.phone.trim(),
      vehicle:      form.vehicle.trim(),
      service_type: service,
      booking_date: dateStr,
      time_slot:    selSlot,
      notes:        form.notes.trim(),
    });

    if (error) {
      setSubmitError('Buchung fehlgeschlagen — bitte versuche es erneut.');
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
        name:    form.name,
        phone:   form.phone,
        vehicle: form.vehicle || 'nicht angegeben',
        details: `NEUE TERMINBUCHUNG\n\nDatum:   ${formatDateLong(selDate)}\nUhrzeit: ${slotLabel}\nService: ${svcLabel}${form.notes ? '\n\nNotiz:\n' + form.notes : ''}`,
      }),
    }).catch(() => {});

    setDone(true);
    setSubmitting(false);
  }

  /* ── Derived values ─────────────────────────────────── */
  const selService = SERVICES.find(s => s.id === service);
  const selSlotObj = TIME_SLOTS.find(s => s.id === selSlot);
  const monthCells = getMonthCells(calYear, calMonth);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="app">
      <Navbar bookingPage />

      {/* Hero */}
      <section className="booking-hero">
        <div className="container booking-hero-inner">
          <span className="subtitle">Mobile Auto Repair — London, ON</span>
          <h1 className="title">Termin <span className="title-accent">buchen</span></h1>
          <p className="booking-hero-sub">
            Wähle deinen Wunschtermin — wir kommen direkt zu dir.
          </p>
        </div>
      </section>

      <div className="container booking-container">
        {!done ? (
          <>
            <StepBar step={step} />

            {/* ── Step 1: Service ────────────────────────── */}
            {step === 1 && (
              <div className="booking-card">
                <h2 className="booking-card-title">Welchen Service benötigst du?</h2>

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
                    Weiter →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Date + Time (Month Calendar) ───── */}
            {step === 2 && (
              <div className="booking-card">
                <h2 className="booking-card-title">Datum und Uhrzeit wählen</h2>

                {/* Estimator pre-fill notice */}
                {fromEstimate && (
                  <div className="from-estimate-banner">
                    <span className="feb-icon">✓</span>
                    <span>
                      Service <strong>{selService?.label}</strong> aus deiner Schätzung übernommen.
                      {' '}<button className="feb-change-btn" onClick={() => setStep(1)}>Ändern</button>
                    </span>
                  </div>
                )}

                {/* Month navigation */}
                <div className="cal-nav">
                  <button className="cal-nav-btn" onClick={prevMonth} disabled={!canGoPrevMonth}>←</button>
                  <span className="cal-nav-label">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button className="cal-nav-btn" onClick={nextMonth} disabled={!canGoNextMonth}>→</button>
                </div>

                {/* Month grid */}
                <div className="cal-month-grid">
                  {/* Day name headers */}
                  {DAY_NAMES.map(d => (
                    <div key={d} className="cal-month-hdr">{d}</div>
                  ))}

                  {/* Day cells */}
                  {monthCells.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="cal-month-cell empty" />;

                    const ds          = toDateStr(date);
                    const disabled    = isPast(date) || isTooFar(date);
                    const isSelected  = selDate && toDateStr(selDate) === ds;
                    const isNow       = isToday(date);
                    const takenCount  = disabled ? 0 : TIME_SLOTS.filter(s => isSlotTaken(ds, s.id)).length;
                    const fullyBooked = !disabled && takenCount === TIME_SLOTS.length;

                    return (
                      <button
                        key={ds}
                        className={[
                          'cal-month-cell',
                          disabled    ? 'disabled'  : '',
                          isSelected  ? 'selected'  : '',
                          isNow       ? 'today'     : '',
                          fullyBooked ? 'full'      : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => {
                          if (!disabled && !fullyBooked) { setSelDate(date); setSelSlot(''); }
                        }}
                        disabled={disabled || fullyBooked}
                      >
                        <span className="cal-day-num">{date.getDate()}</span>
                        {!disabled && (
                          <span className="cal-day-dots">
                            {TIME_SLOTS.map(s => (
                              <span
                                key={s.id}
                                className={`cal-dot${isSlotTaken(ds, s.id) ? ' taken' : ''}`}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Dot legend */}
                <div className="cal-legend">
                  <span><span className="cal-dot" /> Frei</span>
                  <span><span className="cal-dot taken" /> Belegt</span>
                </div>

                {/* Time slots — shown once a day is selected */}
                {selDate && (
                  <div className="slot-section">
                    <p className="slot-heading">
                      <strong>{formatDateLong(selDate)}</strong> — Uhrzeit wählen:
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
                            <span className="slot-sub">{taken ? 'Belegt' : slot.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="booking-nav">
                  <button className="btn btn-ghost" onClick={() => { setStep(1); }}>← Zurück</button>
                  <button
                    className="btn btn-primary"
                    disabled={!selDate || !selSlot}
                    onClick={() => setStep(3)}
                  >
                    Weiter →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Contact ─────────────────────────── */}
            {step === 3 && (
              <div className="booking-card">
                <h2 className="booking-card-title">Deine Kontaktdaten</h2>

                {/* Booking summary */}
                <div className="booking-summary">
                  <div className="bsum-row">
                    <span>Service</span><strong>{selService?.label}</strong>
                  </div>
                  <div className="bsum-row">
                    <span>Datum</span><strong>{selDate && formatDateLong(selDate)}</strong>
                  </div>
                  <div className="bsum-row">
                    <span>Uhrzeit</span><strong>{selSlotObj?.label}</strong>
                  </div>
                </div>

                {/* Estimator pre-fill notice in step 3 */}
                {fromEstimate && (
                  <div className="from-estimate-banner">
                    <span className="feb-icon">✓</span>
                    <span>
                      Fahrzeugdaten und Problembeschreibung aus deiner Schätzung vorausgefüllt
                      — bitte prüfen und bei Bedarf anpassen.
                    </span>
                  </div>
                )}

                <div className="booking-form">
                  <div className="form-group">
                    <label htmlFor="b-name">Name *</label>
                    <input
                      id="b-name"
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Vor- und Nachname"
                      autoComplete="name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="b-phone">Telefon *</label>
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
                    <label htmlFor="b-vehicle">Fahrzeug</label>
                    <input
                      id="b-vehicle"
                      type="text"
                      value={form.vehicle}
                      onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
                      placeholder="z.B. BMW 320d 2014"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="b-notes">
                      Problembeschreibung
                      {fromEstimate && <span className="label-badge">aus Schätzung</span>}
                    </label>
                    <textarea
                      id="b-notes"
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={fromEstimate ? 6 : 3}
                      placeholder="Problembeschreibung, Fragen…"
                    />
                  </div>
                </div>

                {submitError && <p className="booking-error">{submitError}</p>}

                <div className="booking-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Zurück</button>
                  <button
                    className="btn btn-primary"
                    disabled={!form.name.trim() || !form.phone.trim() || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Wird gebucht…' : 'Termin buchen →'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Success ── */
          <div className="booking-success">
            <div className="success-check">✓</div>
            <h2 className="success-title">Termin bestätigt!</h2>
            <p className="success-sub">
              Dein Termin wurde erfolgreich gespeichert. Wir melden uns telefonisch zur Bestätigung.
            </p>
            <div className="booking-summary success-summary">
              <div className="bsum-row">
                <span>Service</span><strong>{selService?.label}</strong>
              </div>
              <div className="bsum-row">
                <span>Datum</span><strong>{selDate && formatDateLong(selDate)}</strong>
              </div>
              <div className="bsum-row">
                <span>Uhrzeit</span><strong>{selSlotObj?.label}</strong>
              </div>
              <div className="bsum-row">
                <span>Name</span><strong>{form.name}</strong>
              </div>
              <div className="bsum-row">
                <span>Telefon</span><strong>{form.phone}</strong>
              </div>
            </div>
            <a href="/" className="btn btn-primary">Zurück zur Startseite →</a>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
