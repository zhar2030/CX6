// Vercel Serverless Function (CommonJS)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, service, details } = req.body || {};

  if (!firstName || !lastName || !email || !service) {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL || 'T.hanan_q@hotmail.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'CX Strategy Lab <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key not set' });
  }

  const html = <div dir="rtl" style="font-family: Arial, sans-serif;"><h2>Service Request - CX Strategy Lab</h2><p><strong>Name:</strong> {escapeHtml(firstName)} {escapeHtml(lastName)}</p><p><strong>Email:</strong> {escapeHtml(email)}</p><p><strong>Phone:</strong> {escapeHtml(phone || 'Not provided')}</p><p><strong>Service:</strong> {escapeHtml(service)}</p><p><strong>Details:</strong></p><p style="white-space: pre-wrap;">{escapeHtml(details || 'None')}</p></div>;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: 'Service Request from ' + firstName + ' ' + lastName,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(502).json({ error: 'Failed to send' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
