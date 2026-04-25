import React, { useEffect, useState } from 'react';
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

const Admin = () => {
  const [stored,       setStored]       = useState(loadStored);
  const [saved,        setSaved]        = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [deployStatus, setDeployStatus] = useState(null); // null|'checking'|'deploying'|'success'|'no-change'|{error}
  const [serverOnline, setServerOnline] = useState(null); // null=unknown, true, false
  const [password,     setPassword]     = useState('');
  const [unlocked,     setUnlocked]     = useState(
    () => localStorage.getItem('mar_admin_auth') === 'ok'
  );

  const effective = getEffective(stored);

  // Check if local admin server is reachable
  React.useEffect(() => {
    if (!unlocked) return;
    fetch('http://localhost:3001/api/status')
      .then(r => r.ok && setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, [unlocked]);

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'mobileauto2024') {
      localStorage.setItem('mar_admin_auth', 'ok');
      setUnlocked(true);
    } else {
      alert('Incorrect password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mar_admin_auth');
    setUnlocked(false);
    setPassword('');
  };

  const hasOverrides = Object.keys(stored).length > 0;

  // ── Login screen ─────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="admin-root">
        <div className="admin-login">
          <div className="admin-login-card">
            <h1 className="admin-logo">
              MOBILE <span>AUTO REPAIR</span>
            </h1>
            <p className="admin-login-sub">Admin — Feature Settings</p>
            <form onSubmit={handleLogin} className="admin-login-form">
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button type="submit" className="adm-btn adm-btn-primary">
                Unlock →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
