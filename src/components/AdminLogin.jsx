import { useState } from 'react';
import { supabase } from '../lib/supabase';
import '../pages/Admin.css';

export default function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Invalid email address or password.');
      setLoading(false);
    }
    // On success: App.jsx onAuthStateChange fires → Admin renders automatically
  }

  return (
    <div className="admin-root">
      <div className="admin-login">
        <div className="admin-login-card">
          <h1 className="admin-logo">
            MOBILE <span>AUTO REPAIR</span>
          </h1>
          <p className="admin-login-sub">Admin — Sign In</p>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <p className="admin-login-error">{error}</p>}
            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
