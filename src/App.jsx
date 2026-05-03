import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import Admin from './pages/Admin';
import Tuning from './pages/Tuning';
import Booking from './pages/Booking';
import AdminLogin from './components/AdminLogin';
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
    return <Admin />;
  }

  // ── /booking route ────────────────────────────────────────
  if (path === '/booking') return <Booking />;

  // ── /tuning route ─────────────────────────────────────────
  if (path === '/tuning') return <Tuning />;

  // ── Home ──────────────────────────────────────────────────
  return (
    <div className="app">
      <Navbar />
      <main>
        <Home />
      </main>
      <Footer />
    </div>
  );
}

export default App;
