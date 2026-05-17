/**
 * GET /api/ping
 *
 * Lightweight keepalive endpoint — makes a minimal Supabase query so the
 * free-tier project never reaches the 7-day inactivity threshold that
 * triggers an automatic pause.
 *
 * Called by an external cron service (e.g. cron-job.org) every 5 days.
 */

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      ?? 'https://udporjlwjwsmmouvflkk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcG9yamx3andzbW1vdXZmbGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODY0NTMsImV4cCI6MjA5Mjc2MjQ1M30.APsdy0cSYBufTmvJp-YnnumtKSuMEao4lMwrJACBbSM';

export default async function handler(req, res) {
  // Allow GET only
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?select=id&limit=1`,
      {
        headers: {
          'apikey':        SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[ping] Supabase responded with', response.status);
      return res.status(500).json({ ok: false, status: response.status });
    }

    console.log('[ping] Supabase keepalive OK —', new Date().toISOString());
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });

  } catch (err) {
    console.error('[ping] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
