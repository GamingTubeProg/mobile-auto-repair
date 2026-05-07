/**
 * Vercel Serverless Function — POST /api/send-email
 * Calls the Resend REST API directly (no SDK import needed).
 *
 * Body fields:
 *   type     : 'booking' | 'quote'   (default: 'quote')
 *   subject  : string (optional, overrides auto-generated subject)
 *   name     : string (optional)
 *   phone    : string (optional)
 *   vehicle  : string (optional)
 *   details  : string (free-form body — date/time/service for bookings, problem desc for quotes)
 *
 * Env:
 *   RESEND_API_KEY  — required
 *   NOTIFY_EMAIL    — optional, defaults to mobile-auto-repair@outlook.com
 *
 * Extra body fields for booking emails:
 *   bookingId    : string (UUID from DB — used to build the confirm link)
 *   confirmToken : string (UUIDv4 generated client-side and stored with the booking)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const {
    type:         rawType,
    subject:      customSubject,
    name,
    phone,
    vehicle,
    details,
    bookingId,
    confirmToken,
  } = body ?? {};

  const type = rawType === 'booking' ? 'booking' : 'quote';

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  // Resolve recipient — normalize (lowercase + trim) since Resend free tier
  // requires an EXACT match against the email registered with the Resend account.
  // Also defend against accidentally pasting an API key here: must contain "@".
  const FALLBACK_TO = 'mobile-auto-repair@outlook.com';
  const rawNotify   = (process.env.NOTIFY_EMAIL || '').trim().toLowerCase();
  const toAddress   = rawNotify.includes('@') ? rawNotify : FALLBACK_TO;
  if (process.env.NOTIFY_EMAIL && !rawNotify.includes('@')) {
    console.warn('[send-email] NOTIFY_EMAIL does not look like an email address — falling back to', FALLBACK_TO);
  }

  // ── Build action URLs ──
  const siteOrigin = `https://${req.headers.host}`;
  const adminUrl   = `${siteOrigin}/admin`;
  const confirmUrl = (type === 'booking' && bookingId && confirmToken)
    ? `${siteOrigin}/api/confirm-booking?id=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(confirmToken)}`
    : null;

  // ── Build subject ──
  const safeName    = (name    && name.trim())    || '(no name)';
  const safePhone   = (phone   && phone.trim())   || 'Not provided';
  const safeVehicle = (vehicle && vehicle.trim()) || 'Not specified';

  const subject = customSubject || (type === 'booking'
    ? `🗓️ New Appointment Request – ${safeName}`
    : `Quote Request – ${safeVehicle}`);

  // ── Build body ──
  const accent     = '#e65c00';
  const headerText = type === 'booking'
    ? 'MOBILE AUTO REPAIR — New Appointment Request'
    : 'MOBILE AUTO REPAIR — New Quote Request';
  const introText  = type === 'booking'
    ? 'A customer has requested an appointment online and is waiting for confirmation.'
    : 'A new quote request was submitted from the website.';

  const textBody = [
    headerText,
    '',
    introText,
    '',
    `Name:    ${safeName}`,
    `Phone:   ${safePhone}`,
    `Vehicle: ${safeVehicle}`,
    '',
    details || '(no details provided)',
    '',
    ...(type === 'booking' ? [
      confirmUrl ? `✅ Confirm booking: ${confirmUrl}` : '',
      `🔧 Admin panel:   ${adminUrl}`,
    ] : []),
  ].filter(Boolean).join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
      <div style="background:${accent};padding:18px 24px;">
        <h1 style="margin:0;color:#fff;font-size:17px;letter-spacing:1px;">
          ${headerText}
        </h1>
      </div>
      <div style="padding:24px;border:1px solid #ddd;border-top:none;">
        <p style="margin:0 0 18px;font-size:14px;color:#444;line-height:1.55;">${introText}</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:600;width:90px;color:#555;vertical-align:top;">Name</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;vertical-align:top;">Phone</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee;">
              ${phone && phone.trim()
                ? `<a href="tel:${phone}" style="color:${accent};">${phone}</a>`
                : safePhone}
            </td>
          </tr>
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;vertical-align:top;">Vehicle</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee;">${safeVehicle}</td>
          </tr>
        </table>

        ${details ? `
        <div style="background:#f8f8f8;border-left:3px solid ${accent};padding:14px 18px;">
          <p style="margin:0 0 7px;font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">
            ${type === 'booking' ? 'Appointment Details' : 'Details'}
          </p>
          <pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6;">${details}</pre>
        </div>` : ''}

        ${type === 'booking' ? `
        <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
          ${confirmUrl ? `
          <a href="${confirmUrl}"
             style="display:inline-block;background:${accent};color:#fff;text-decoration:none;
                    padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;
                    letter-spacing:.3px;">
            ✅ Confirm Booking
          </a>` : ''}
          <a href="${adminUrl}"
             style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;
                    padding:12px 22px;border-radius:6px;font-size:14px;font-weight:600;">
            🔧 Open Admin Panel
          </a>
        </div>
        <p style="margin:12px 0 0;font-size:12px;color:#999;">
          Clicking "Confirm Booking" will immediately mark this appointment as confirmed.
          To cancel or make changes, use the admin panel.
        </p>` : ''}
      </div>
      <div style="padding:14px 24px;background:#f4f4f4;font-size:12px;color:#888;">
        Sent from the Mobile Auto Repair website
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Mobile Auto Repair <onboarding@resend.dev>',
        to:      [toAddress],
        subject,
        text:    textBody,
        html:    htmlBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      // Print on multiple lines so Vercel's log viewer doesn't truncate
      console.error('[send-email] Resend API error — status:', response.status);
      console.error('[send-email] Resend API error — to:', toAddress);
      console.error('[send-email] Resend API error — body:', errText);
      return res.status(500).json({
        error:        'Email delivery failed.',
        resendStatus: response.status,
        resendBody:   errText,
      });
    }

    console.log(`[send-email] ${type} email sent to ${toAddress}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[send-email] Fetch error:', err.message);
    return res.status(500).json({ error: 'Network error sending email.' });
  }
}
