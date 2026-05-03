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

/* ── Date helpers ─────────────────────────────────────── */
function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
}

function getWeekDates(monday) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

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
  const t = new Date(); t.setHours(0,0,0,0);
  return toDateStr(date) === toDateStr(t);
}

function isPast(date) {
  const today = new Date(); today.setHours(0,0,0,0);
  return date <= today;
}

function isTooFar(date) {
  const max = new Date(); max.setDate(max.getDate() + 56);
  return date > max;
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
  const [step,        setStep]       = useState(1);
  const [service,     setService]    = useState('');
  const [weekStart,   setWeekStart]  = useState(() => getMonday(new Date()));
  const [selDate,     setSelDate]    = useState(null);
  const [selSlot,     setSelSlot]    = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [form,        setForm]       = useState({ name: '', phone: '', vehicle: '', notes: '' });
  const [submitting,  setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done,        setDone]       = useState(false);

  /* Load booked slots once on mount */
  useEffect(() => {
    async function load() {
      const today = toDateStr(new Date());
      const maxD  = new Date(); maxD.setDate(maxD.getDate() + 56);
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, time_slot, status')
        .gte('booking_date', today)
        .lte('booking_date', toDateStr(maxD));
      if (data) setBookedSlots(data);
    }
    load();
  }, []);

  function isSlotTaken(dateStr, slotId) {
    return bookedSlots.some(
      b => b.booking_date === dateStr && b.time_slot === slotId && b.status !== 'cancelled'
    );
  }

  /* Week navigation */
  const weekDates   = getWeekDates(weekStart);
  const todayMon    = getMonday(new Date());
  const canGoPrev   = weekStart > todayMon;
  const maxWeekMon  = getMonday(new Date());
  maxWeekMon.setDate(maxWeekMon.getDate() + 49);
  const canGoNext   = weekStart < maxWeekMon;

  function prevWeek() {
    const w = new Date(weekStart); w.setDate(w.getDate() - 7);
    setWeekStart(w); setSelDate(null); setSelSlot('');
  }
  function nextWeek() {
    const w = new Date(weekStart); w.setDate(w.getDate() + 7);
    setWeekStart(w); setSelDate(null); setSelSlot('');
  }

  /* Submit */
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

    // Notify owner via email (fire-and-forget)
    const svcLabel  = SERVICES.find(s => s.id === service)?.label ?? service;
    const slotLabel = TIME_SLOTS.find(s => s.id === selSlot)?.label ?? selSlot;
    fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    form.name,
        phone:   form.phone,
        vehicle: form.vehicle || 'nicht angegeben',
        details: `NEUE TERMINBUCHUNG\n\nDatum:   ${formatDateLong(selDate)}\nUhrzeit: ${slotLabel}\nService: ${svcLabel}${form.notes ? '\n\nNotiz: ' + form.notes : ''}`,
      }),
    }).catch(() => {});

    setDone(true);
    setSubmitting(false);
  }

  /* ── Render ─────────────────────────────────────────── */
  const selService = SERVICES.find(s => s.id === service);
  const selSlotObj = TIME_SLOTS.find(s => s.id === selSlot);

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

            {/* ── Step 1: Service ── */}
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

            {/* ── Step 2: Date + Time ── */}
            {step === 2 && (
              <div className="booking-card">
                <h2 className="booking-card-title">Datum und Uhrzeit wählen</h2>

                {/* Week navigation */}
                <div className="cal-nav">
                  <button className="cal-nav-btn" onClick={prevWeek} disabled={!canGoPrev}>
                    ←
                  </button>
                  <span className="cal-nav-label">
                    {weekDates[0].getDate()}. {MONTH_SHORT[weekDates[0].getMonth()]}
                    {' – '}
                    {weekDates[5].getDate()}. {MONTH_SHORT[weekDates[5].getMonth()]} {weekDates[5].getFullYear()}
                  </span>
                  <button className="cal-nav-btn" onClick={nextWeek} disabled={!canGoNext}>
                    →
                  </button>
                </div>

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
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Zurück</button>
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

            {/* ── Step 3: Contact ── */}
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
                    <label htmlFor="b-notes">Notizen</label>
                    <textarea
                      id="b-notes"
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={3}
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
