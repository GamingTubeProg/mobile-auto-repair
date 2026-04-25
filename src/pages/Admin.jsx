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
  const [stored,   setStored]   = useState(loadStored);
  const [saved,    setSaved]    = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem('mar_admin_auth') === 'ok'
  );

  const effective = getEffective(stored);

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
          <h2 className="admin-section-title">Make Changes Permanent</h2>
          <p className="admin-section-sub">
            Copy the snippet below and paste it into{' '}
            <code>src/config/features.js</code> (replace the <code>DEFAULTS</code> block),
            then push to GitHub — Vercel redeploys automatically and all visitors see the change.
          </p>

          <div className="admin-code-block">
            <div className="admin-code-header">
              <span>src/config/features.js — DEFAULTS block</span>
              <button className="adm-btn adm-btn-small" onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="admin-code"><code>{codeSnippet}</code></pre>
          </div>

          <div className="admin-deploy-steps">
            <div className="admin-deploy-step">
              <span className="admin-deploy-num">1</span>
              <span>Copy the code above</span>
            </div>
            <div className="admin-deploy-step">
              <span className="admin-deploy-num">2</span>
              <span>Open <code>src/config/features.js</code> in your editor</span>
            </div>
            <div className="admin-deploy-step">
              <span className="admin-deploy-num">3</span>
              <span>Replace the <code>const DEFAULTS = &#123;…&#125;</code> block</span>
            </div>
            <div className="admin-deploy-step">
              <span className="admin-deploy-num">4</span>
              <span>Commit &amp; push → Vercel deploys in ~60 seconds</span>
            </div>
          </div>
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
