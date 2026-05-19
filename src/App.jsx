import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import Admin from './pages/Admin';
import Tuning from './pages/Tuning';
import Booking from './pages/Booking';
import Reviews from './pages/Reviews';
import PrePurchaseInspection from './pages/PrePurchaseInspection';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import CookieBanner from './components/CookieBanner';
import AdminLogin from './components/AdminLogin';
import StickyCallButton from './components/StickyCallButton';
import { supabase } from './lib/supabase';

const path = window.location.pathname;

function App() {
  // undefined = still checking, null = not logged in, object = logged in
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    // Keep session in sync on login / logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // The sticky Call-Now button is the same component everywhere; on
  // /admin we force it visible even on desktop (alwaysVisible) since
  // the admin is usually on desktop and needs to be able to call out.
  const callBtn       = <StickyCallButton />;
  const callBtnAdmin  = <StickyCallButton alwaysVisible />;

  // ── /admin route ─────────────────────────────────────────
  if (path === '/admin') {
    if (session === undefined) {
      // Still loading session — show minimal spinner so layout doesn't flash
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-dark)',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.8rem',
          letterSpacing: '0.12em',
        }}>
          LADEN…
        </div>
      );
    }
    if (!session) return <AdminLogin />;
    return <><Admin />{callBtnAdmin}</>;
  }

  // ── /booking route ────────────────────────────────────────
  if (path === '/booking') return <><Booking />{callBtn}<CookieBanner /></>;

  // ── /review route ────────────────────────────────────────
  if (path === '/review' || path === '/reviews') return <><Reviews />{callBtn}<CookieBanner /></>;

  // ── /tuning route ─────────────────────────────────────────
  if (path === '/tuning') return <><Tuning />{callBtn}<CookieBanner /></>;

  // ── /pre-purchase-inspection route ────────────────────────
  if (path === '/pre-purchase-inspection' || path === '/inspection') {
    return <><PrePurchaseInspection />{callBtn}<CookieBanner /></>;
  }

  // ── Legal routes ──────────────────────────────────────────
  if (path === '/privacy') return <><Privacy />{callBtn}<CookieBanner /></>;
  if (path === '/terms')   return <><Terms />{callBtn}<CookieBanner /></>;

  // ── Home (root path only) ─────────────────────────────────
  if (path === '/' || path === '') {
    return (
      <div className="app">
        <Navbar />
        <main>
          <Home />
        </main>
        <Footer />
        {callBtn}
        <CookieBanner />
      </div>
    );
  }

  // ── 404 — anything else falls through here ────────────────
  return <><NotFound />{callBtn}</>;
}

export default App;
