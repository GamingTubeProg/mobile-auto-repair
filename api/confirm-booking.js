/**
 * Vercel Serverless Function — GET /api/confirm-booking?id=...&token=...
 *
 * Called when the business owner clicks "Confirm Booking" in the notification
 * email. Verifies the one-time token, updates the booking status to
 * 'confirmed', and returns a styled HTML confirmation page.
 *
 * Security:
 *   - Token is a UUIDv4 generated at booking-creation time (unguessable).
 *   - RLS policy "anon_confirm_booking_by_token" enforces:
 *       USING  (confirm_token IS NOT NULL AND status = 'pending')
 *       WITH CHECK (status = 'confirmed')
 *     so only genuinely pending bookings can be confirmed, and only to
 *     the 'confirmed' value — nothing else can be changed.
 *   - After confirmation the token stays in the DB but the status is no
 *     longer 'pending', so clicking the link a second time is a no-op.
 */

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      ?? 'https://udporjlwjwsmmouvflkk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcG9yamx3andzbW1vdXZmbGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODY0NTMsImV4cCI6MjA5Mjc2MjQ1M30.APsdy0cSYBufTmvJp-YnnumtKSuMEao4lMwrJACBbSM';

const ACCENT = '#e65c00';

function htmlPage({ title, heading, body, isError = false }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} — Mobile Auto Repair</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
    }
    .card-header {
      background: ${isError ? '#c0392b' : ACCENT};
      padding: 20px 28px;
    }
    .card-header h1 {
      color: #fff;
      font-size: 16px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .card-body {
      padding: 32px 28px;
      text-align: center;
    }
    .icon {
      font-size: 52px;
      line-height: 1;
      margin-bottom: 16px;
    }
    .card-body h2 {
      font-size: 22px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .card-body p {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: ${ACCENT};
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    .footer {
      padding: 14px 28px;
      background: #f4f4f4;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h1>Mobile Auto Repair</h1>
    </div>
    <div class="card-body">
      <div class="icon">${isError ? '⚠️' : '✅'}</div>
      <h2>${heading}</h2>
      <p>${body}</p>
      <a href="/admin" class="btn">Open Admin Panel →</a>
    </div>
    <div class="footer">Mobile Auto Repair — London, Ontario</div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const { id, token } = req.query ?? {};

  if (!id || !token) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(htmlPage({
      title:   'Invalid Link',
      heading: 'Invalid Link',
      body:    'This confirmation link is missing required information. Please open the admin panel to manage bookings.',
      isError: true,
    }));
  }

  try {
    // PATCH the booking — RLS enforces that only a pending booking with
    // a matching confirm_token can be updated to 'confirmed'.
    const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}&confirm_token=eq.${encodeURIComponent(token)}`;

    const response = await fetch(url, {
      method:  'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey':         SUPABASE_ANON_KEY,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify({ status: 'confirmed' }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[confirm-booking] Supabase error:', response.status, errText);
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(htmlPage({
        title:   'Error',
        heading: 'Something went wrong',
        body:    'Could not confirm the booking. Please open the admin panel to confirm it manually.',
        isError: true,
      }));
    }

    const rows = await response.json();

    if (!rows || rows.length === 0) {
      // No row matched — already confirmed, cancelled, or invalid token
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(htmlPage({
        title:   'Already Processed',
        heading: 'Already Processed',
        body:    'This booking has already been confirmed or cancelled. Check the admin panel for its current status.',
        isError: false,
      }));
    }

    const booking = rows[0];
    console.log(`[confirm-booking] Confirmed booking ${booking.id} for ${booking.name}`);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlPage({
      title:   'Booking Confirmed',
      heading: 'Booking Confirmed!',
      body:    `The appointment for <strong>${booking.name || 'customer'}</strong> on <strong>${booking.booking_date}</strong> (${booking.time_slot}) has been confirmed.`,
      isError: false,
    }));

  } catch (err) {
    console.error('[confirm-booking] Fetch error:', err.message);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(htmlPage({
      title:   'Error',
      heading: 'Network Error',
      body:    'Could not reach the database. Please try again or confirm via the admin panel.',
      isError: true,
    }));
  }
}
