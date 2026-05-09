/**
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
  ESTIMATOR_SHOW_PRICE: false,
  ESTIMATOR_ENABLED: true,
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
