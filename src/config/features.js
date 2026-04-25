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
 * 2. PERMANENT (all visitors) → change the DEFAULTS below,
 *    push to GitHub, Vercel redeploys automatically.
 *    The /admin panel shows the exact code to paste here.
 *
 * ============================================================
 */

const DEFAULTS = {
  /**
   * ESTIMATOR_SHOW_PRICE
   * true  → Show the preliminary CAD price range on step 4
   *         (e.g. $220 – $480). A note explains the price
   *         may adjust slightly after on-site inspection.
   * false → Hide the price. Only the vehicle/symptom summary
   *         and "Request a precise quote" button are shown.
   */
  ESTIMATOR_SHOW_PRICE: true,

  /**
   * ESTIMATOR_ENABLED
   * true  → The full 4-step wizard is visible on the page.
   * false → Estimator section and navbar link are hidden.
   *         Only the main contact form remains.
   */
  ESTIMATOR_ENABLED: true,
};

// ── localStorage override (set from /admin panel) ──────────
function loadFeatures() {
  try {
    const stored = JSON.parse(localStorage.getItem('mar_features') || '{}');
    // Only accept keys that exist in DEFAULTS — ignore unknown keys.
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
