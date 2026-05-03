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

const STATUS_LABELS = {
  pending:   { label: 'Ausstehend',  color: 'orange' },
  confirmed: { label: 'Bestätigt',   color: 'green'  },
  completed: { label: 'Abgeschlossen', color: 'blue' },
  cancelled: { label: 'Abgesagt',    color: 'red'    },
};

const SERVICE_LABELS = {
  diagnose:  'Diagnose',
  reparatur: 'Reparatur',
  tuning:    'ECU-Tuning',
  wartung:   'Wartung',
  sonstiges: 'Sonstiges',
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
      setDeployStatus({ error: 'Admin-Server nicht erreichbar. Bitte über den Desktop-Shortcut starten.' });
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
              <h2 className="admin-section-title">Terminbuchungen</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                Eingehende Terminanfragen verwalten und bestätigen.
              </p>
            </div>
            <div className="admin-bookings-filter">
              <button
                className={`adm-btn adm-btn-small${bookingsFilter === 'upcoming' ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                onClick={() => setBookingsFilter('upcoming')}
              >
                Bevorstehend
              </button>
              <button
                className={`adm-btn adm-btn-small${bookingsFilter === 'all' ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                onClick={() => setBookingsFilter('all')}
              >
                Alle
              </button>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="admin-bookings-empty">Buchungen werden geladen…</div>
          ) : bookings.length === 0 ? (
            <div className="admin-bookings-empty">
              {bookingsFilter === 'upcoming' ? 'Keine bevorstehenden Termine.' : 'Keine Buchungen vorhanden.'}
            </div>
          ) : (
            <div className="admin-bookings-table-wrap">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Uhrzeit</th>
                    <th>Service</th>
                    <th>Name</th>
                    <th>Telefon</th>
                    <th>Fahrzeug</th>
                    <th>Status</th>
                    <th>Aktionen</th>
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
                                Bestätigen
                              </button>
                              <button
                                className="abt-action-btn cancel"
                                disabled={statusUpdating === b.id}
                                onClick={() => updateBookingStatus(b.id, 'cancelled')}
                              >
                                Absagen
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
                                Abschließen
                              </button>
                              <button
                                className="abt-action-btn cancel"
                                disabled={statusUpdating === b.id}
                                onClick={() => updateBookingStatus(b.id, 'cancelled')}
                              >
                                Absagen
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
          <h2 className="admin-section-title">Permanent deployen</h2>
          <p className="admin-section-sub">
            Ein Klick schreibt <code>features.js</code>, commitet und pusht zu GitHub.
            Vercel deployt automatisch — alle Besucher sehen die Änderung in ~60 Sekunden.
          </p>

          {/* Server status indicator */}
          <div className={`admin-server-status${serverOnline === false ? ' offline' : serverOnline ? ' online' : ''}`}>
            <span className="admin-server-dot" />
            {serverOnline === true  && 'Admin-Server läuft — Deploy bereit.'}
            {serverOnline === false && 'Admin-Server offline. Starte ihn über den Desktop-Shortcut.'}
            {serverOnline === null  && 'Verbindung wird geprüft…'}
          </div>

          {/* One-click deploy button */}
          <div className="admin-deploy-cta">
            <button
              className={`adm-btn adm-btn-deploy${deployStatus === 'deploying' ? ' is-deploying' : ''}`}
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying' || serverOnline === false}
            >
              {deployStatus === 'deploying' ? '⏳  Deploying…' : '🚀  Jetzt deployen'}
            </button>

            {/* Status feedback */}
            {deployStatus === 'success' && (
              <div className="admin-deploy-status is-success">
                ✓ Deployed! Vercel baut jetzt neu — in ~60 Sekunden live für alle Besucher.
              </div>
            )}
            {deployStatus === 'no-change' && (
              <div className="admin-deploy-status is-no-change">
                ✓ Bereits aktuell — keine Änderungen vorhanden.
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
            <summary>Manuell deployen (Fallback)</summary>
            <div className="admin-manual-fallback-body">
              <p>Falls der automatische Deploy nicht funktioniert: Code kopieren, in <code>src/config/features.js</code> einfügen und pushen.</p>
              <div className="admin-code-block">
                <div className="admin-code-header">
                  <span>src/config/features.js — DEFAULTS block</span>
                  <button className="adm-btn adm-btn-small" onClick={handleCopy}>
                    {copied ? '✓ Kopiert!' : 'Kopieren'}
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
