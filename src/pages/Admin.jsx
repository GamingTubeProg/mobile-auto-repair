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
const ADM_DAY_NAMES  = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const ADM_MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const ADM_TIME_SLOTS = [
  { id: '09:00-11:00', label: '09–11 Uhr' },
  { id: '11:00-13:00', label: '11–13 Uhr' },
  { id: '13:00-15:00', label: '13–15 Uhr' },
  { id: '15:00-17:00', label: '15–17 Uhr' },
];

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
  const [deployStatus, setDeployStatus] = useState(null); // null|'checking'|'deploying'|'success'|'no-change'|{error}
  const [serverOnline, setServerOnline] = useState(null); // null=unknown, true, false

  // ── Bookings state ───────────────────────────────────────
  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsFilter,  setBookingsFilter]  = useState('upcoming'); // 'upcoming' | 'all'
  const [statusUpdating,  setStatusUpdating]  = useState(null); // booking id being updated

  // ── Availability state ───────────────────────────────────
  const [availWeekStart, setAvailWeekStart] = useState(admThisMonday);
  const [availData,      setAvailData]      = useState([]);
  const [availLoading,   setAvailLoading]   = useState(true);
  const [slotToggling,   setSlotToggling]   = useState(null); // 'YYYY-MM-DD|slotId'

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

      query = query.neq('status', 'blocked');
      const { data, error } = await query;
      if (!error) setBookings(data ?? []);
      setBookingsLoading(false);
    }
    loadBookings();
  }, [bookingsFilter]);

  const updateBookingStatus = async (id, status) => {
    setStatusUpdating(id);
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
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
        .select('id, booking_date, time_slot, status, name')
        .gte('booking_date', startStr)
        .lte('booking_date', endStr)
        .neq('status', 'cancelled');
      setAvailData(data ?? []);
      setAvailLoading(false);
    }
    loadAvail();
  }, [availWeekStart]);

  const toggleSlot = async (dateStr, slotId) => {
    const key      = `${dateStr}|${slotId}`;
    setSlotToggling(key);
    const existing = availData.find(
      b => b.booking_date === dateStr && b.time_slot === slotId
    );
    if (existing?.status === 'blocked') {
      // Unblock: soft-delete by setting status to cancelled
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', existing.id);
      if (!error) setAvailData(prev => prev.filter(b => b.id !== existing.id));
    } else if (!existing) {
      // Block: insert a placeholder booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          name:         '_BLOCKED_',
          phone:        '',
          vehicle:      '',
          service_type: 'blocked',
          booking_date: dateStr,
          time_slot:    slotId,
          status:       'blocked',
        })
        .select('id, booking_date, time_slot, status, name')
        .single();
      if (!error && data) setAvailData(prev => [...prev, data]);
    }
    // If it's a real customer booking → do nothing (can't block over it)
    setSlotToggling(null);
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
        setDeployStatus({ error: data.message || 'Unbekannter Fehler.' });
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
    // App.jsx onAuthStateChange fires → AdminLogin renders automatically
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
        {/* BOOKINGS SECTION */}
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
                      <td>{b.name}</td>
                      <td>
                        <a href={`tel:${b.phone}`} className="abt-phone">{b.phone}</a>
                      </td>
                      <td className="abt-vehicle">{b.vehicle}</td>
                      <td>
                        <span className={`abt-badge abt-badge-${STATUS_LABELS[b.status]?.color ?? 'grey'}`}>
                          {STATUS_LABELS[b.status]?.label ?? b.status}
                        </span>
                      </td>
                      <td>
                        <div className="abt-actions">
                          {b.status === 'pending' && (
                            <>
                              <button
                                className="abt-action-btn confirm"
                                disabled={statusUpdating === b.id}
                                onClick={() => updateBookingStatus(b.id, 'confirmed')}
                              >
                                Confirm
                              </button>
                              <button
                                className="abt-action-btn cancel"
                                disabled={statusUpdating === b.id}
                                onClick={() => updateBookingStatus(b.id, 'cancelled')}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button
                                className="abt-action-btn complete"
                                disabled={statusUpdating === b.id}
                                onClick={() => updateBookingStatus(b.id, 'completed')}
                              >
                                Complete
                              </button>
                              <button
                                className="abt-action-btn cancel"
                                disabled={statusUpdating === b.id}
                                onClick={() => updateBookingStatus(b.id, 'cancelled')}
                              >
                                Cancel
                              </button>
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

        {/* AVAILABILITY SECTION */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Manage Availability</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                <span className="adm-legend-item free">Available</span> — click to block &nbsp;·&nbsp;
                <span className="adm-legend-item blocked">Blocked</span> — click to unblock &nbsp;·&nbsp;
                <span className="adm-legend-item booked">Booked</span> — customer booking, read-only
              </p>
            </div>
            <div className="admin-bookings-filter" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="adm-btn adm-btn-small adm-btn-ghost"
                onClick={prevAvailWeek}
                disabled={!canGoPrevAvailWeek}
              >
                ←
              </button>
              <span className="adm-avail-week-label">
                {(() => {
                  const dates = admWeekDates(availWeekStart);
                  return `${dates[0].getDate()}. ${ADM_MONTH_SHORT[dates[0].getMonth()]} – ${dates[5].getDate()}. ${ADM_MONTH_SHORT[dates[5].getMonth()]} ${dates[5].getFullYear()}`;
                })()}
              </span>
              <button
                className="adm-btn adm-btn-small adm-btn-ghost"
                onClick={nextAvailWeek}
              >
                →
              </button>
            </div>
          </div>

          {availLoading ? (
            <div className="admin-bookings-empty">Loading…</div>
          ) : (
            <div className="adm-avail-grid">
              {admWeekDates(availWeekStart).map((date, i) => {
                const dateStr  = admDateStr(date);
                const isPastDay = date < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <div key={dateStr} className={`adm-avail-col${isPastDay ? ' past' : ''}`}>
                    <div className="adm-avail-col-hdr">
                      <span className="adm-avail-col-day">{ADM_DAY_NAMES[i]}</span>
                      <span className="adm-avail-col-date">
                        {date.getDate()}. {ADM_MONTH_SHORT[date.getMonth()]}
                      </span>
                    </div>

                    {ADM_TIME_SLOTS.map(slot => {
                      const booking    = availData.find(
                        b => b.booking_date === dateStr && b.time_slot === slot.id
                      );
                      const isBlocked  = booking?.status === 'blocked';
                      const isBooked   = booking && !isBlocked;
                      const toggleKey  = `${dateStr}|${slot.id}`;
                      const isToggling = slotToggling === toggleKey;

                      if (isBooked) {
                        return (
                          <div
                            key={slot.id}
                            className={`adm-slot booked s-${booking.status}`}
                            title={`${booking.name} — ${booking.status}`}
                          >
                            <span className="adm-slot-time">{slot.label}</span>
                            <span className="adm-slot-name">{booking.name}</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot.id}
                          className={`adm-slot${isBlocked ? ' blocked' : ' free'}${isPastDay ? ' past' : ''}`}
                          onClick={() => !isPastDay && !isToggling && toggleSlot(dateStr, slot.id)}
                          disabled={isPastDay || isToggling}
                          title={isBlocked ? 'Click to unblock' : 'Click to block'}
                        >
                          <span className="adm-slot-time">{slot.label}</span>
                          <span className="adm-slot-sub">
                            {isToggling ? '…' : isBlocked ? 'Blocked ✕' : 'Available'}
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

        {/* STATUS BAR */}
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

        {/* FEATURE TOGGLES */}
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

        {/* DEPLOY SECTION */}
        <section className="admin-section">
          <h2 className="admin-section-title">Deploy to Production</h2>
          <p className="admin-section-sub">
            One click writes <code>features.js</code>, commits and pushes to GitHub.
            Vercel deploys automatically — all visitors see the change in ~60 seconds.
          </p>

          {/* Server status indicator */}
          <div className={`admin-server-status${serverOnline === false ? ' offline' : serverOnline ? ' online' : ''}`}>
            <span className="admin-server-dot" />
            {serverOnline === true  && 'Admin server running — ready to deploy.'}
            {serverOnline === false && 'Admin server offline. Start it via the desktop shortcut.'}
            {serverOnline === null  && 'Checking connection…'}
          </div>

          {/* One-click deploy button */}
          <div className="admin-deploy-cta">
            <button
              className={`adm-btn adm-btn-deploy${deployStatus === 'deploying' ? ' is-deploying' : ''}`}
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying' || serverOnline === false}
            >
              {deployStatus === 'deploying' ? '⏳  Deploying…' : '🚀  Deploy Now'}
            </button>

            {/* Status feedback */}
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
              <div className="admin-deploy-status is-error">
                ✗ {deployStatus.error}
              </div>
            )}
          </div>

          {/* Manual fallback (collapsed) */}
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

        {/* QUICK PREVIEW */}
        <section className="admin-section admin-section-last">
          <h2 className="admin-section-title">Preview</h2>
          <p className="admin-section-sub">
            Visit the site to see your browser overrides live.
          </p>
          <a href="/" className="adm-btn adm-btn-primary" target="_blank" rel="noreferrer">
            Open site in new tab →
          </a>
        </section>
      </main>
    </div>
  );
};

export default Admin;
