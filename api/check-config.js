/**
 * Diagnostic endpoint — GET /api/check-config
 * Checks whether RESEND_API_KEY is set and makes a live test call.
 * DELETE THIS FILE after the email issue is resolved.
 */
export default async function handler(req, res) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      keySet: false,
      message: 'RESEND_API_KEY environment variable is NOT set in Vercel.',
    });
  }

  // Show a safe preview (first 8 + last 4 chars)
  const preview =
    apiKey.length > 12
      ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
      : '(key too short to preview)';

  // Make a live test send to confirm the key actually works
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
        subject: 'Config test — Mobile Auto Repair',
        text:    'This is an automated configuration test from the check-config endpoint.',
      }),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return res.status(200).json({
      keySet: true,
      keyPreview: preview,
      resendStatus: response.status,
      resendOk: response.ok,
      resendResponse: data,
    });
  } catch (err) {
    return res.status(200).json({
      keySet: true,
      keyPreview: preview,
      resendStatus: null,
      resendOk: false,
      fetchError: err.message,
    });
  }
}
