/**
 * Vercel Serverless Function — POST /api/send-email
 * Calls the Resend REST API directly (no SDK import needed).
 * Requires env variable: RESEND_API_KEY
 */
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel auto-parses JSON bodies; body could also arrive as string
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { name, phone, vehicle, details } = body ?? {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const subject  = `Quote Request – ${vehicle || 'Vehicle not specified'}`;
  const textBody = [
    `New quote request from mobileautorepair website`,
    ``,
    `Name:    ${name}`,
    `Phone:   ${phone}`,
    `Vehicle: ${vehicle || 'Not specified'}`,
    ``,
    details || '(no details provided)',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#e65c00;padding:18px 24px;">
        <h1 style="margin:0;color:#fff;font-size:17px;letter-spacing:1px;">
          MOBILE AUTO REPAIR — New Quote Request
        </h1>
      </div>
      <div style="padding:24px;border:1px solid #ddd;border-top:none;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:600;width:90px;color:#555;vertical-align:top;">Name</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;vertical-align:top;">Phone</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee;">
              <a href="tel:${phone}" style="color:#e65c00;">${phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;vertical-align:top;">Vehicle</td>
            <td style="padding:9px 0;border-bottom:1px solid #eee;">${vehicle || 'Not specified'}</td>
          </tr>
        </table>
        ${details ? `
        <div style="background:#f8f8f8;border-left:3px solid #e65c00;padding:14px 18px;">
          <p style="margin:0 0 7px;font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Details</p>
          <pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6;">${details}</pre>
        </div>` : ''}
      </div>
      <div style="padding:14px 24px;background:#f4f4f4;font-size:12px;color:#888;">
        Sent from the Mobile Auto Repair website contact form
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
        to:      ['Mobile.Automotive@hotmail.com'],
        subject,
        text:    textBody,
        html:    htmlBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[send-email] Resend API error:', response.status, errText);
      return res.status(500).json({ error: 'Email delivery failed.' });
    }

    console.log('[send-email] Email sent to Mobile.Automotive@hotmail.com');
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[send-email] Fetch error:', err.message);
    return res.status(500).json({ error: 'Network error sending email.' });
  }
}
