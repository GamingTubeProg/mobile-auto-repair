import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL   = 'Mobile.Automotive@hotmail.com';
const FROM_EMAIL = 'Mobile Auto Repair <onboarding@resend.dev>';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, vehicle, details } = req.body ?? {};

  // Basic validation
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const subject  = `Quote Request – ${vehicle || 'Vehicle not specified'}`;
  const textBody = [
    `New quote request from your website`,
    ``,
    `Name:    ${name}`,
    `Phone:   ${phone}`,
    `Vehicle: ${vehicle || 'Not specified'}`,
    ``,
    details || '(no additional details)',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#e65c00;padding:20px 28px;">
        <h1 style="margin:0;color:#fff;font-size:18px;letter-spacing:1px;">
          MOBILE AUTO REPAIR — New Quote Request
        </h1>
      </div>
      <div style="padding:28px;border:1px solid #ddd;border-top:none;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;width:100px;color:#555;">Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">
              <a href="tel:${phone}" style="color:#e65c00;">${phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Vehicle</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">${vehicle || 'Not specified'}</td>
          </tr>
        </table>
        ${details ? `
        <div style="background:#f8f8f8;border-left:3px solid #e65c00;padding:16px 20px;">
          <p style="margin:0 0 8px;font-weight:600;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Details / Notes</p>
          <pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6;">${details}</pre>
        </div>` : ''}
      </div>
      <div style="padding:16px 28px;background:#f4f4f4;font-size:12px;color:#888;">
        Sent from mobileautorepair.ca contact form
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to:   [TO_EMAIL],
      subject,
      text: textBody,
      html: htmlBody,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[send-email]', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again or call directly.' });
  }
}
