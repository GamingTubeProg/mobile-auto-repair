/**
 * ============================================================
 * FEATURE TOGGLES — Mobile Auto Repair
 * ============================================================
 *
 * Change a value here and redeploy (git push) to activate or
 * deactivate features — no other code changes needed.
 *
 * ============================================================
 */

const FEATURES = {
  /**
   * ESTIMATOR_SHOW_PRICE
   * -----------------------------------------------------------
   * true  → Show the calculated CAD price range (e.g. $220–$480)
   *         on the result step of the Estimator wizard.
   * false → Hide the price completely. The summary and the
   *         "Request a precise quote" button are still shown.
   *         Use this if you prefer customers to call for pricing.
   */
  ESTIMATOR_SHOW_PRICE: true,

  /**
   * ESTIMATOR_ENABLED
   * -----------------------------------------------------------
   * true  → The full 4-step wizard is shown (Vehicle → Problem
   *         → Details → Result/Quote button).
   * false → The Estimator section is hidden entirely. Only the
   *         main contact form at #contact remains active.
   *         Navbar "Estimate" link is also hidden automatically.
   */
  ESTIMATOR_ENABLED: true,
};

export default FEATURES;
