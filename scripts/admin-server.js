/**
 * Mobile Auto Repair — Local Admin API Server
 * ─────────────────────────────────────────────
 * Runs alongside the Vite dev server (port 3001).
 * The /admin panel calls this to deploy feature changes
 * automatically: write features.js → git commit → git push.
 * Vercel then redeploys automatically in ~60 seconds.
 *
 * Start: node scripts/admin-server.js
 */

import http               from 'http';
import { execSync }       from 'child_process';
import fs                 from 'fs';
import path               from 'path';
import { fileURLToPath }  from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT  = 3001;
const ROOT  = path.resolve(__dirname, '..');
const FEATURES_PATH = path.join(ROOT, 'src', 'config', 'features.js');

const ALLOWED_KEYS = ['ESTIMATOR_SHOW_PRICE', 'ESTIMATOR_ENABLED'];

/* ── Write src/config/features.js ─────────────────────────── */
function writeFeatures(features) {
  const defaults = ALLOWED_KEYS
    .map(k => `  ${k}: ${features[k] !== false},`)
    .join('\n');

  const content =
`/**
 * ============================================================
 * FEATURE TOGGLES — Mobile Auto Repair
 * ============================================================
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────
 * 1. INSTANT (browser only) → visit /admin on your live site,
 *    flip the toggles. Changes save to localStorage and take
 *    effect immediately in that browser — no redeploy needed.
 *    Useful for testing or temporarily hiding a feature.
 *
 * 2. PERMANENT (all visitors) → use the "Deploy" button in
 *    the /admin panel. The local API server writes this file,
 *    commits, and pushes to GitHub. Vercel redeploys in ~60s.
 *
 * ============================================================
 */

const DEFAULTS = {
  /**
   * ESTIMATOR_SHOW_PRICE
   * true  → Show the preliminary CAD price range on step 4.
   * false → Hide the price; only summary + quote button shown.
   */

  /**
   * ESTIMATOR_ENABLED
   * true  → The full 4-step wizard is visible on the page.
   * false → Estimator section and navbar link are hidden.
   */
${defaults}
};

// ── localStorage override (set from /admin panel) ──────────
function loadFeatures() {
  try {
    const stored = JSON.parse(localStorage.getItem('mar_features') || '{}');
    const safe = Object.fromEntries(
      Object.keys(DEFAULTS)
        .filter(k => k in stored)
        .map(k => [k, Boolean(stored[k])])
    );
    return { ...DEFAULTS, ...safe };
  } catch {
    return { ...DEFAULTS };
  }
}

const FEATURES = loadFeatures();
export default FEATURES;
`;

  fs.writeFileSync(FEATURES_PATH, content, 'utf8');
}

/* ── HTTP server ──────────────────────────────────────────── */
const server = http.createServer((req, res) => {
  // CORS — accept any localhost origin
  const origin = req.headers.origin || '';
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* GET /api/status — health check */
  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  /* POST /api/deploy — write features.js + git push */
  if (req.method === 'POST' && req.url === '/api/deploy') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { features } = JSON.parse(body);

        // 1. Write file
        writeFeatures(features);

        // 2. Stage
        execSync('git add src/config/features.js', { cwd: ROOT, stdio: 'pipe' });

        // 3. Check if anything actually changed
        const staged = execSync('git diff --cached --name-only', {
          cwd: ROOT, stdio: 'pipe',
        }).toString().trim();

        if (!staged) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            noChange: true,
            message: 'Bereits aktuell — keine Änderungen zu deployen.',
          }));
          return;
        }

        // 4. Commit
        execSync(
          'git commit -m "chore: update feature flags via admin panel"',
          { cwd: ROOT, stdio: 'pipe' }
        );

        // 5. Push
        execSync('git push', { cwd: ROOT, stdio: 'pipe' });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Deployed! Vercel baut jetzt neu (~60 Sekunden).',
        }));

      } catch (err) {
        const msg = (err.stderr ? err.stderr.toString() : err.message).trim();
        console.error('[admin-server] deploy error:', msg);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: msg }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log('\n  ✓ Admin-Server läuft auf http://localhost:' + PORT);
  console.log('  Warte auf Deploy-Anfragen vom /admin Panel...\n');
});
