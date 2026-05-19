import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './Admin.css';

const STORAGE_KEY = 'mar_features';

const FEATURE_DEFS = [
  {
    key: 'ESTIMATOR_SHOW_PRICE',
    label: 'Show Price Estimate',
    description:
      'Displays the preliminary CAD price range (e.g. $220 – $480) on the result step of the Estimator. ' +
      'A note explains the final price may adjust slightly after on-site inspection.',
    defaultVal: true,
    tag: 'Estimator',
  },
  {
    key: 'ESTIMATOR_ENABLED',
    label: 'Estimator Wizard',
    description:
      'Shows or hides the entire 4-step Estimator section and the "Estimate" navbar link. ' +
      'Turn off to run the site in contact-form-only mode.',
    defaultVal: true,
    tag: 'Layout',
  },
  {
    key: 'SHOW_REVIEW_PHOTOS',
    label: 'Show Review Photos',
    description:
      'When ON, photos uploaded by customers with their review appear as small thumbnails ' +
      'in the Testimonials section on the homepage. When OFF, photos are still uploaded and ' +
      'stored — only the public display is hidden.',
    defaultVal: true,
    tag: 'Reviews',
  },
];

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function getEffective(stored) {
  return Object.fromEntries(
    FEATURE_DEFS.map(f => [f.key, f.key in stored ? Boolean(stored[f.key]) : f.defaultVal])
  );
}

/* ── Availability calendar helpers ─────────────────────── */
const ADM_DAY_NAMES   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ADM_MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ADM_TIME_SLOTS  = [
  { id: '09:00-11:00', label: '09–11' },
  { id: '11:00-13:00', label: '11–13' },
  { id: '13:00-15:00', label: '13–15' },
  { id: '15:00-17:00', label: '15–17' },
];

/* Slot ranges for the Add Entry / Block Time modal */
const RANGE_TO_SLOTS = {
  'slot-0':    ['09:00-11:00'],
  'slot-1':    ['11:00-13:00'],
  'slot-2':    ['13:00-15:00'],
  'slot-3':    ['15:00-17:00'],
  'morning':   ['09:00-11:00', '11:00-13:00'],
  'afternoon': ['13:00-15:00', '15:00-17:00'],
  'full':      ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00'],
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_ENTRY = {
  date:              todayStr(),
  range:             'full',
  reason:            '',
  name:              '',
  phone:             '',
  vehicle:           '',
  service_type:      'reparatur',
  time_slot:         '09:00-11:00',
  appointmentStatus: 'confirmed',
  notes:             '',
};

function admDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function admWeekDates(monday) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
}

function admThisMonday() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

const STATUS_LABELS = {
  pending:   { label: 'Pending',   color: 'orange' },
  confirmed: { label: 'Confirmed', color: 'green'  },
  completed: { label: 'Completed', color: 'blue'   },
  cancelled: { label: 'Cancelled', color: 'red'    },
};

const SERVICE_LABELS = {
  diagnose:  'Diagnostics',
  reparatur: 'Repair',
  tuning:    'ECU Tuning',
  wartung:   'Maintenance',
  sonstiges: 'Other',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

const Admin = () => {
  const [stored,       setStored]       = useState(loadStored);
  const [saved,        setSaved]        = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [deployStatus, setDeployStatus] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);

  // ── Bookings state ───────────────────────────────────────
  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsFilter,  setBookingsFilter]  = useState('upcoming');
  const [statusUpdating,  setStatusUpdating]  = useState(null);

  // ── Availability state ───────────────────────────────────
  const [availWeekStart, setAvailWeekStart] = useState(admThisMonday);
  const [availData,      setAvailData]      = useState([]);
  const [availLoading,   setAvailLoading]   = useState(true);
  const [slotToggling,   setSlotToggling]   = useState(null);
  const [dayBlocking,    setDayBlocking]    = useState(null);

  // ── Reviews state ────────────────────────────────────────
  const [reviews,        setReviews]        = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsFilter,  setReviewsFilter]  = useState('pending');
  const [reviewUpdating, setReviewUpdating] = useState(null);

  // ── Add Entry modal state ────────────────────────────────
  const [entryModal,  setEntryModal]  = useState(false);
  const [entryMode,   setEntryMode]   = useState('block');
  const [entryForm,   setEntryForm]   = useState(EMPTY_ENTRY);
  const [entrySaving, setEntrySaving] = useState(false);
  const [entryError,  setEntryError]  = useState('');

  const effective = getEffective(stored);

  // Check if local admin server is reachable
  React.useEffect(() => {
    fetch('http://localhost:3001/api/status')
      .then(r => r.ok && setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  // Load bookings from Supabase
  useEffect(() => {
    async function loadBookings() {
      setBookingsLoading(true);
      let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('time_slot',    { ascending: true });
      if (bookingsFilter === 'upcoming') {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte('booking_date', today);
      }
      query = query.neq('status', 'blocked').neq('service_type', 'blocked');
      const { data, error } = await query;
      if (!error) setBookings(data ?? []);
      setBookingsLoading(false);
    }
    loadBookings();
  }, [bookingsFilter]);

  const updateBookingStatus = async (id, status) => {
    setStatusUpdating(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setStatusUpdating(null);
  };

  // Load availability data for the displayed week
  useEffect(() => {
    async function loadAvail() {
      setAvailLoading(true);
      const startStr = admDateStr(availWeekStart);
      const endDate  = new Date(availWeekStart); endDate.setDate(endDate.getDate() + 5);
      const endStr   = admDateStr(endDate);
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, time_slot, status, name, vehicle, service_type')
        .gte('booking_date', startStr)
        .lte('booking_date', endStr)
        .neq('status', 'cancelled');
      setAvailData(data ?? []);
      setAvailLoading(false);
    }
    loadAvail();
  }, [availWeekStart]);

  // Click slot in calendar:
  //   • free slot       → open Entry modal pre-filled with that date+slot
  //   • blocked slot    → unblock immediately (one click)
  //   • booked slot     → no-op (handled by caller)
  const toggleSlot = async (dateStr, slotId) => {
    const existing = availData.find(b => b.booking_date === dateStr && b.time_slot === slotId);
    if (existing?.status === 'blocked') {
      const key = `${dateStr}|${slotId}`;
      setSlotToggling(key);
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', existing.id);
      if (!error) setAvailData(prev => prev.filter(b => b.id !== existing.id));
      setSlotToggling(null);
    } else if (!existing) {
      // Free slot → open the Entry modal pre-filled with this slot
      openEntryModal('block', dateStr, slotId);
    }
  };

  // Block all free slots on a given day at once
  const blockDay = async (dateStr) => {
    setDayBlocking(dateStr);
    const slotsToBlock = ADM_TIME_SLOTS.filter(
      slot => !availData.find(b => b.booking_date === dateStr && b.time_slot === slot.id)
    );
    if (slotsToBlock.length > 0) {
      const inserts = slotsToBlock.map(slot => ({
        name: '_BLOCKED_', phone: '', vehicle: '',
        service_type: 'blocked', booking_date: dateStr,
        time_slot: slot.id, status: 'blocked',
      }));
      const { data, error } = await supabase
        .from('bookings').insert(inserts)
        .select('id, booking_date, time_slot, status, name, vehicle, service_type');
      if (!error && data) setAvailData(prev => [...prev, ...data]);
    }
    setDayBlocking(null);
  };

  // ── Add Entry modal handlers ──────────────────────────────
  // mode      : 'block' | 'appointment'
  // dateStr   : pre-fill date (YYYY-MM-DD), defaults to today
  // slotId    : pre-select a single slot — sets range to slot-N and time_slot
  const openEntryModal = (mode = 'block', dateStr = null, slotId = null) => {
    let initialRange = 'full';
    if (slotId) {
      const idx = ADM_TIME_SLOTS.findIndex(s => s.id === slotId);
      if (idx >= 0) initialRange = `slot-${idx}`;
    }
    setEntryMode(mode);
    setEntryForm({
      ...EMPTY_ENTRY,
      date:      dateStr || todayStr(),
      range:     initialRange,
      time_slot: slotId || ADM_TIME_SLOTS[0].id,
    });
    setEntryError('');
    setEntryModal(true);
  };

  const closeEntryModal = () => {
    if (entrySaving) return;
    setEntryModal(false);
    setEntryError('');
  };

  const handleEntrySave = async () => {
    setEntryError('');
    if (!entryForm.date) { setEntryError('Please select a date.'); return; }
    setEntrySaving(true);

    if (entryMode === 'block') {
      // Determine which slot IDs to block
      const slotIds    = RANGE_TO_SLOTS[entryForm.range] ?? [];
      const freeSlotIds = slotIds.filter(
        sid => !availData.find(b => b.booking_date === entryForm.date && b.time_slot === sid)
      );
      if (freeSlotIds.length === 0) {
        setEntryError('All selected slots are already booked or blocked.');
        setEntrySaving(false);
        return;
      }
      const reason  = entryForm.reason.trim();
      const inserts = freeSlotIds.map(sid => ({
        name:         reason ? `_BLOCKED_: ${reason}` : '_BLOCKED_',
        phone:        '',
        vehicle:      '',
        service_type: 'blocked',
        booking_date: entryForm.date,
        time_slot:    sid,
        status:       'blocked',
      }));
      const { data, error } = await supabase
        .from('bookings').insert(inserts)
        .select('id, booking_date, time_slot, status, name');
      if (error) { setEntryError('Could not save. Please try again.'); setEntrySaving(false); return; }
      // Refresh availability grid if the date falls in the displayed week
      if (data) {
        const ws = admDateStr(availWeekStart);
        const we = admDateStr(new Date(availWeekStart.getTime() + 5 * 86400000));
        const inWeek = data.filter(d => d.booking_date >= ws && d.booking_date <= we);
        if (inWeek.length) setAvailData(prev => [...prev, ...inWeek]);
      }

    } else {
      // Real Appointment — all fields optional
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          name:         entryForm.name.trim(),
          phone:        entryForm.phone.trim(),
          vehicle:      entryForm.vehicle.trim(),
          service_type: entryForm.service_type,
          booking_date: entryForm.date,
          time_slot:    entryForm.time_slot,
          status:       entryForm.appointmentStatus,
          notes:        entryForm.notes.trim(),
        })
        .select('*')
        .single();
      if (error) { setEntryError('Could not save. Please try again.'); setEntrySaving(false); return; }
      if (data) {
        // Add to appointments table if it matches the current filter
        if (bookingsFilter === 'all' || data.booking_date >= todayStr()) {
          setBookings(prev =>
            [...prev, data].sort((a, b) => {
              const d = a.booking_date.localeCompare(b.booking_date);
              return d !== 0 ? d : a.time_slot.localeCompare(b.time_slot);
            })
          );
        }
        // Refresh availability grid if in displayed week
        const ws = admDateStr(availWeekStart);
        const we = admDateStr(new Date(availWeekStart.getTime() + 5 * 86400000));
        if (data.booking_date >= ws && data.booking_date <= we) {
          setAvailData(prev => [
            ...prev,
            { id: data.id, booking_date: data.booking_date, time_slot: data.time_slot,
              status: data.status, name: data.name,
              vehicle: data.vehicle, service_type: data.service_type },
          ]);
        }
      }
    }

    setEntrySaving(false);
    setEntryModal(false);
  };

  // Load reviews
  useEffect(() => {
    async function loadReviews() {
      setReviewsLoading(true);
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (reviewsFilter !== 'all') query = query.eq('status', reviewsFilter);
      const { data } = await query;
      setReviews(data ?? []);
      setReviewsLoading(false);
    }
    loadReviews();
  }, [reviewsFilter]);

  const updateReviewStatus = async (id, status) => {
    setReviewUpdating(id);
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    if (!error) {
      if (reviewsFilter !== 'all' && reviewsFilter !== status) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
    }
    setReviewUpdating(null);
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently? This cannot be undone.')) return;
    setReviewUpdating(id);
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) setReviews(prev => prev.filter(r => r.id !== id));
    setReviewUpdating(null);
  };

  // Week navigation for availability
  const canGoPrevAvailWeek = availWeekStart > admThisMonday();
  const prevAvailWeek = () => {
    const w = new Date(availWeekStart); w.setDate(w.getDate() - 7); setAvailWeekStart(w);
  };
  const nextAvailWeek = () => {
    const w = new Date(availWeekStart); w.setDate(w.getDate() + 7); setAvailWeekStart(w);
  };

  const handleDeploy = async () => {
    setDeployStatus('deploying');
    try {
      const res  = await fetch('http://localhost:3001/api/deploy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ features: effective }),
      });
      const data = await res.json();
      if (data.success) {
        setDeployStatus(data.noChange ? 'no-change' : 'success');
      } else {
        setDeployStatus({ error: data.message || 'Unknown error.' });
      }
    } catch {
      setDeployStatus({ error: 'Admin server unreachable. Please start it via the desktop shortcut.' });
    }
    setTimeout(() => setDeployStatus(null), 10000);
  };

  const toggle = (key) => {
    setStored(prev => ({ ...prev, [key]: !effective[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStored({});
    setSaved(false);
  };

  const codeSnippet = `const DEFAULTS = {\n${FEATURE_DEFS.map(
    f => `  ${f.key}: ${effective[f.key]},`
  ).join('\n')}\n};`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(codeSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const hasOverrides = Object.keys(stored).length > 0;

  // ── Main panel ───────────────────────────────────────────
  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div>
            <a href="/" className="admin-back">← Back to site</a>
            <h1 className="admin-title">
              MOBILE <span>AUTO REPAIR</span>
              <span className="admin-title-badge">Admin</span>
            </h1>
          </div>
          <button className="adm-btn adm-btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="admin-main">

        {/* ── APPOINTMENTS SECTION ──────────────────────── */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Appointments</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                Manage and confirm incoming appointment requests.
              </p>
            </div>
            <div className="admin-bookings-filter">
              <button
                className={`adm-btn adm-btn-small${bookingsFilter === 'upcoming' ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                onClick={() => setBookingsFilter('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`adm-btn adm-btn-small${bookingsFilter === 'all' ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                onClick={() => setBookingsFilter('all')}
              >
                All
              </button>
              <button
                className="adm-btn adm-btn-small adm-btn-add-entry"
                onClick={() => openEntryModal('appointment')}
              >
                + Add Entry
              </button>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="admin-bookings-empty">Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div className="admin-bookings-empty">
              {bookingsFilter === 'upcoming' ? 'No upcoming appointments.' : 'No bookings found.'}
            </div>
          ) : (
            <div className="admin-bookings-table-wrap">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Service</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className={`admin-booking-row status-${b.status}`}>
                      <td className="abt-date">{formatDate(b.booking_date)}</td>
                      <td className="abt-time">{b.time_slot}</td>
                      <td>{SERVICE_LABELS[b.service_type] ?? b.service_type}</td>
                      <td>{b.name || <span className="abt-empty">—</span>}</td>
                      <td>
                        {b.phone
                          ? <a href={`tel:${b.phone}`} className="abt-phone">{b.phone}</a>
                          : <span className="abt-empty">—</span>}
                      </td>
                      <td className="abt-vehicle">{b.vehicle || <span className="abt-empty">—</span>}</td>
                      <td>
                        <span className={`abt-badge abt-badge-${STATUS_LABELS[b.status]?.color ?? 'grey'}`}>
                          {STATUS_LABELS[b.status]?.label ?? b.status}
                        </span>
                      </td>
                      <td>
                        <div className="abt-actions">
                          {b.status === 'pending' && (
                            <>
                              <button className="abt-action-btn confirm" disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'confirmed')}>Confirm</button>
                              <button className="abt-action-btn cancel"  disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'cancelled')}>Cancel</button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button className="abt-action-btn complete" disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'completed')}>Complete</button>
                              <button className="abt-action-btn cancel"   disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'cancelled')}>Cancel</button>
                            </>
                          )}
                          {(b.status === 'completed' || b.status === 'cancelled') && (
                            <span className="abt-no-action">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── MANAGE AVAILABILITY SECTION ───────────────── */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Manage Availability</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                <span className="adm-legend-item free">Free</span> — click to block or create appointment &nbsp;·&nbsp;
                <span className="adm-legend-item blocked">Blocked</span> — click to unblock &nbsp;·&nbsp;
                <span className="adm-legend-item booked">Booked</span> — read-only
              </p>
            </div>
            <div className="admin-bookings-filter" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="adm-btn adm-btn-small adm-btn-ghost"
                onClick={prevAvailWeek}
                disabled={!canGoPrevAvailWeek}
              >←</button>
              <span className="adm-avail-week-label">
                {(() => {
                  const dates = admWeekDates(availWeekStart);
                  return `${dates[0].getDate()} ${ADM_MONTH_SHORT[dates[0].getMonth()]} – ${dates[5].getDate()} ${ADM_MONTH_SHORT[dates[5].getMonth()]} ${dates[5].getFullYear()}`;
                })()}
              </span>
              <button className="adm-btn adm-btn-small adm-btn-ghost" onClick={nextAvailWeek}>→</button>
              <button className="adm-btn adm-btn-small adm-btn-add-entry" onClick={() => openEntryModal('block')}>
                + Block Time
              </button>
            </div>
          </div>

          {availLoading ? (
            <div className="admin-bookings-empty">Loading…</div>
          ) : (
            <div className="adm-avail-grid">
              {admWeekDates(availWeekStart).map((date, i) => {
                const dateStr    = admDateStr(date);
                const isPastDay  = date < new Date(new Date().setHours(0, 0, 0, 0));
                const isBlocking = dayBlocking === dateStr;

                return (
                  <div key={dateStr} className={`adm-avail-col${isPastDay ? ' past' : ''}`}>
                    <div className="adm-avail-col-hdr">
                      <span className="adm-avail-col-day">{ADM_DAY_NAMES[i]}</span>
                      <span className="adm-avail-col-date">
                        {date.getDate()} {ADM_MONTH_SHORT[date.getMonth()]}
                      </span>
                      {!isPastDay && (
                        <button
                          className="adm-block-day-btn"
                          onClick={() => blockDay(dateStr)}
                          disabled={isBlocking}
                          title="Block all free slots on this day"
                        >
                          {isBlocking ? '…' : 'Block Day'}
                        </button>
                      )}
                    </div>

                    {ADM_TIME_SLOTS.map(slot => {
                      const booking    = availData.find(
                        b => b.booking_date === dateStr && b.time_slot === slot.id
                      );
                      const isBlocked  = booking?.status === 'blocked';
                      const isBooked   = booking && !isBlocked;
                      const toggleKey  = `${dateStr}|${slot.id}`;
                      const isToggling = slotToggling === toggleKey;

                      // Extract optional reason from blocked slot name
                      const blockReason = isBlocked && booking?.name?.startsWith('_BLOCKED_: ')
                        ? booking.name.slice('_BLOCKED_: '.length)
                        : null;

                      if (isBooked) {
                        return (
                          <div
                            key={slot.id}
                            className={`adm-slot booked s-${booking.status}`}
                          >
                            <span className="adm-slot-time">{slot.label}</span>
                            <span className="adm-slot-name">{booking.name || '—'}</span>
                            {booking.vehicle && (
                              <span className="adm-slot-vehicle">{booking.vehicle}</span>
                            )}
                            {/* Hover tooltip */}
                            <div className="adm-slot-tooltip">
                              {booking.name && (
                                <div className="adm-slot-tooltip-row">
                                  <span className="adm-slot-tooltip-lbl">Name</span>
                                  <span>{booking.name}</span>
                                </div>
                              )}
                              {booking.vehicle && (
                                <div className="adm-slot-tooltip-row">
                                  <span className="adm-slot-tooltip-lbl">Vehicle</span>
                                  <span className="adm-slot-tooltip-vehicle">{booking.vehicle}</span>
                                </div>
                              )}
                              {booking.service_type && (
                                <div className="adm-slot-tooltip-row">
                                  <span className="adm-slot-tooltip-lbl">Service</span>
                                  <span>{SERVICE_LABELS[booking.service_type] ?? booking.service_type}</span>
                                </div>
                              )}
                              <div className="adm-slot-tooltip-row">
                                <span className="adm-slot-tooltip-lbl">Status</span>
                                <span className={`adm-tooltip-status s-${booking.status}`}>
                                  {STATUS_LABELS[booking.status]?.label ?? booking.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot.id}
                          className={`adm-slot${isBlocked ? ' blocked' : ' free'}${isPastDay ? ' past' : ''}`}
                          onClick={() => !isPastDay && !isToggling && toggleSlot(dateStr, slot.id)}
                          disabled={isPastDay || isToggling}
                          title={isBlocked
                            ? (blockReason ? `Blocked: ${blockReason} — click to unblock` : 'Blocked — click to unblock')
                            : 'Click to block this slot or create an appointment'}
                        >
                          <span className="adm-slot-time">{slot.label}</span>
                          <span className="adm-slot-sub">
                            {isToggling ? '…' : isBlocked
                              ? (blockReason ? `✕ ${blockReason}` : 'Blocked ✕')
                              : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CUSTOMER REVIEWS SECTION ──────────────────── */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Customer Reviews</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                Moderate customer reviews. Only <strong>approved</strong> reviews appear on the homepage.
              </p>
            </div>
            <div className="admin-bookings-filter">
              {[
                { id: 'pending',  label: 'Pending'  },
                { id: 'approved', label: 'Approved' },
                { id: 'all',      label: 'All'      },
              ].map(f => (
                <button
                  key={f.id}
                  className={`adm-btn adm-btn-small${reviewsFilter === f.id ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                  onClick={() => setReviewsFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {reviewsLoading ? (
            <div className="admin-bookings-empty">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="admin-bookings-empty">
              {reviewsFilter === 'pending'  && 'No pending reviews.'}
              {reviewsFilter === 'approved' && 'No approved reviews yet.'}
              {reviewsFilter === 'all'      && 'No reviews submitted yet.'}
            </div>
          ) : (
            <div className="admin-reviews-list">
              {reviews.map(r => (
                <article key={r.id} className={`adm-review-card status-${r.status}`}>
                  <header className="adm-review-head">
                    <div className="adm-review-rating" aria-label={`${r.rating} out of 5`}>
                      {'★'.repeat(r.rating)}<span className="dim">{'★'.repeat(5 - r.rating)}</span>
                    </div>
                    <span className={`abt-badge abt-badge-${
                      r.status === 'approved' ? 'green' :
                      r.status === 'pending'  ? 'orange' : 'grey'
                    }`}>
                      {r.status}
                    </span>
                  </header>
                  <p className="adm-review-comment">{r.comment}</p>

                  {r.photo_urls?.length > 0 && (
                    <div className="adm-review-photos">
                      {r.photo_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-review-photo"
                          title="Open full size in new tab"
                        >
                          <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="adm-review-meta">
                    <strong>{r.customer_name}</strong>
                    {r.source === 'google' && <span className="adm-source-badge"> · from Google</span>}
                    {r.vehicle && <span> · {r.vehicle}</span>}
                    {r.service_type && SERVICE_LABELS[r.service_type] && (
                      <span> · {SERVICE_LABELS[r.service_type]}</span>
                    )}
                    <span className="adm-review-date">
                      {new Date(r.created_at).toLocaleDateString('en-CA')}
                    </span>
                  </div>
                  <div className="adm-review-actions">
                    {r.status !== 'approved' && (
                      <button className="abt-action-btn confirm" disabled={reviewUpdating === r.id} onClick={() => updateReviewStatus(r.id, 'approved')}>Approve</button>
                    )}
                    {r.status !== 'hidden' && (
                      <button className="abt-action-btn cancel" disabled={reviewUpdating === r.id} onClick={() => updateReviewStatus(r.id, 'hidden')}>Hide</button>
                    )}
                    {r.status === 'hidden' && (
                      <button className="abt-action-btn complete" disabled={reviewUpdating === r.id} onClick={() => updateReviewStatus(r.id, 'pending')}>Mark Pending</button>
                    )}
                    <button className="abt-action-btn cancel adm-review-delete" disabled={reviewUpdating === r.id} onClick={() => deleteReview(r.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── STATUS BAR ────────────────────────────────── */}
        <div className={`admin-status-bar${hasOverrides ? ' has-overrides' : ''}`}>
          {hasOverrides ? (
            <>
              <span className="admin-status-dot active" />
              Browser overrides active — these settings only affect <strong>your browser</strong>.
              To apply globally for all visitors, use the Deploy section below.
            </>
          ) : (
            <>
              <span className="admin-status-dot" />
              Using compiled defaults (features.js). No browser overrides active.
            </>
          )}
        </div>

        {/* ── FEATURE TOGGLES ───────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Feature Toggles</h2>
          <p className="admin-section-sub">
            Changes are instant in your browser. Click <strong>Save to browser</strong> to persist across page reloads.
          </p>
          <div className="admin-toggle-list">
            {FEATURE_DEFS.map(f => (
              <div className="admin-toggle-row" key={f.key}>
                <div className="admin-toggle-info">
                  <span className="admin-toggle-tag">{f.tag}</span>
                  <h3 className="admin-toggle-label">{f.label}</h3>
                  <p className="admin-toggle-desc">{f.description}</p>
                  <code className="admin-toggle-key">{f.key}</code>
                </div>
                <div className="admin-toggle-control">
                  <button
                    className={`adm-toggle${effective[f.key] ? ' on' : ' off'}`}
                    onClick={() => toggle(f.key)}
                    aria-label={`Toggle ${f.label}`}
                  >
                    <span className="adm-toggle-thumb" />
                  </button>
                  <span className={`adm-toggle-state${effective[f.key] ? ' on' : ' off'}`}>
                    {effective[f.key] ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-toggle-actions">
            <button className="adm-btn adm-btn-primary" onClick={handleSave}>
              {saved ? '✓ Saved to browser' : 'Save to browser'}
            </button>
            {hasOverrides && (
              <button className="adm-btn adm-btn-ghost" onClick={handleReset}>
                Reset to defaults
              </button>
            )}
          </div>
        </section>

        {/* ── DEPLOY SECTION ────────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Deploy to Production</h2>
          <p className="admin-section-sub">
            One click writes <code>features.js</code>, commits and pushes to GitHub.
            Vercel deploys automatically — all visitors see the change in ~60 seconds.
          </p>
          <div className={`admin-server-status${serverOnline === false ? ' offline' : serverOnline ? ' online' : ''}`}>
            <span className="admin-server-dot" />
            {serverOnline === true  && 'Admin server running — ready to deploy.'}
            {serverOnline === false && 'Admin server offline. Start it via the desktop shortcut.'}
            {serverOnline === null  && 'Checking connection…'}
          </div>
          <div className="admin-deploy-cta">
            <button
              className={`adm-btn adm-btn-deploy${deployStatus === 'deploying' ? ' is-deploying' : ''}`}
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying' || serverOnline === false}
            >
              {deployStatus === 'deploying' ? '⏳  Deploying…' : '🚀  Deploy Now'}
            </button>
            {deployStatus === 'success' && (
              <div className="admin-deploy-status is-success">
                ✓ Deployed! Vercel is rebuilding — live for all visitors in ~60 seconds.
              </div>
            )}
            {deployStatus === 'no-change' && (
              <div className="admin-deploy-status is-no-change">
                ✓ Already up to date — no changes to deploy.
              </div>
            )}
            {deployStatus && typeof deployStatus === 'object' && deployStatus.error && (
              <div className="admin-deploy-status is-error">✗ {deployStatus.error}</div>
            )}
          </div>
          <details className="admin-manual-fallback">
            <summary>Deploy Manually (Fallback)</summary>
            <div className="admin-manual-fallback-body">
              <p>If the automatic deploy doesn&apos;t work: copy the code, paste it into <code>src/config/features.js</code> and push.</p>
              <div className="admin-code-block">
                <div className="admin-code-header">
                  <span>src/config/features.js — DEFAULTS block</span>
                  <button className="adm-btn adm-btn-small" onClick={handleCopy}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="admin-code"><code>{codeSnippet}</code></pre>
              </div>
            </div>
          </details>
        </section>

        {/* ── QUICK PREVIEW ─────────────────────────────── */}
        <section className="admin-section admin-section-last">
          <h2 className="admin-section-title">Preview</h2>
          <p className="admin-section-sub">Visit the site to see your browser overrides live.</p>
          <a href="/" className="adm-btn adm-btn-primary" target="_blank" rel="noreferrer">
            Open site in new tab →
          </a>
        </section>

      </main>

      {/* ══════════════════════════════════════════════
          ADD ENTRY MODAL
          ══════════════════════════════════════════════ */}
      {entryModal && (
        <div className="adm-modal-overlay" onClick={closeEntryModal}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Add Entry</h3>
              <button className="adm-modal-close" onClick={closeEntryModal} aria-label="Close">✕</button>
            </div>

            {/* Mode tabs */}
            <div className="adm-modal-tabs">
              <button
                className={`adm-modal-tab${entryMode === 'block' ? ' active' : ''}`}
                onClick={() => { setEntryMode('block'); setEntryError(''); }}
              >
                Block Time
              </button>
              <button
                className={`adm-modal-tab${entryMode === 'appointment' ? ' active' : ''}`}
                onClick={() => { setEntryMode('appointment'); setEntryError(''); }}
              >
                Customer Appointment
              </button>
            </div>

            {/* Body */}
            <div className="adm-modal-body">
              {entryMode === 'block' ? (

                /* ── Block Time form ── */
                <div className="adm-modal-form">
                  <p className="adm-modal-mode-desc">
                    Block one or more time slots so customers can&apos;t book them.
                    Useful for holidays, personal time, or fleet jobs.
                  </p>

                  <div className="adm-form-row">
                    <label className="adm-form-label">Date</label>
                    <input
                      type="date"
                      className="adm-form-input"
                      value={entryForm.date}
                      min={todayStr()}
                      autoFocus
                      onClick={e => e.target.showPicker?.()}
                      onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">Time Range</label>
                    <select
                      className="adm-form-input"
                      value={entryForm.range}
                      onChange={e => setEntryForm(f => ({ ...f, range: e.target.value }))}
                    >
                      <option value="slot-0">09:00 – 11:00 (Slot 1 only)</option>
                      <option value="slot-1">11:00 – 13:00 (Slot 2 only)</option>
                      <option value="slot-2">13:00 – 15:00 (Slot 3 only)</option>
                      <option value="slot-3">15:00 – 17:00 (Slot 4 only)</option>
                      <option value="morning">Morning — 09:00 – 13:00 (slots 1 + 2)</option>
                      <option value="afternoon">Afternoon — 13:00 – 17:00 (slots 3 + 4)</option>
                      <option value="full">Full Day — all 4 slots</option>
                    </select>
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Reason <span className="adm-form-optional">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. Holiday, Fleet job, Personal"
                      value={entryForm.reason}
                      onChange={e => setEntryForm(f => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                </div>

              ) : (

                /* ── Real Appointment form ── */
                <div className="adm-modal-form">
                  <p className="adm-modal-mode-desc">
                    Manually create an appointment — e.g. for a phone booking or a job you scheduled yourself.
                  </p>

                  <div className="adm-form-row-2col">
                    <div className="adm-form-row">
                      <label className="adm-form-label">Name <span className="adm-form-optional">(optional)</span></label>
                      <input
                        type="text"
                        className="adm-form-input"
                        placeholder="Customer name"
                        autoFocus
                        value={entryForm.name}
                        onChange={e => setEntryForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="adm-form-row">
                      <label className="adm-form-label">Phone <span className="adm-form-optional">(optional)</span></label>
                      <input
                        type="tel"
                        className="adm-form-input"
                        placeholder="+1 …"
                        value={entryForm.phone}
                        onChange={e => setEntryForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="adm-form-row-2col">
                    <div className="adm-form-row">
                      <label className="adm-form-label">Date</label>
                      <input
                        type="date"
                        className="adm-form-input"
                        value={entryForm.date}
                        min={todayStr()}
                        onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="adm-form-row">
                      <label className="adm-form-label">Time Slot</label>
                      <select
                        className="adm-form-input"
                        value={entryForm.time_slot}
                        onChange={e => setEntryForm(f => ({ ...f, time_slot: e.target.value }))}
                      >
                        {ADM_TIME_SLOTS.map(s => (
                          <option key={s.id} value={s.id}>{s.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="adm-form-row-2col">
                    <div className="adm-form-row">
                      <label className="adm-form-label">Service</label>
                      <select
                        className="adm-form-input"
                        value={entryForm.service_type}
                        onChange={e => setEntryForm(f => ({ ...f, service_type: e.target.value }))}
                      >
                        {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-form-row">
                      <label className="adm-form-label">Status</label>
                      <select
                        className="adm-form-input"
                        value={entryForm.appointmentStatus}
                        onChange={e => setEntryForm(f => ({ ...f, appointmentStatus: e.target.value }))}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Vehicle <span className="adm-form-optional">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. 2019 Toyota Camry"
                      value={entryForm.vehicle}
                      onChange={e => setEntryForm(f => ({ ...f, vehicle: e.target.value }))}
                    />
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Notes <span className="adm-form-optional">(optional)</span>
                    </label>
                    <textarea
                      className="adm-form-input adm-form-textarea"
                      rows={3}
                      placeholder="Any additional notes…"
                      value={entryForm.notes}
                      onChange={e => setEntryForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {entryError && <div className="adm-modal-error">{entryError}</div>}
            </div>

            {/* Footer */}
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={closeEntryModal} disabled={entrySaving}>
                Cancel
              </button>
              <button className="adm-btn adm-btn-primary" onClick={handleEntrySave} disabled={entrySaving}>
                {entrySaving
                  ? 'Saving…'
                  : entryMode === 'block'
                    ? 'Block Slot(s)'
                    : 'Save Appointment'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
