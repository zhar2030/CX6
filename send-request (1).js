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
    return res.status(500).json({ error: 'Resend API key not configured' });
  }

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #1a2b3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">طلب خدمة جديد</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>الاسم:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(firstName)} ${escapeHtml(lastName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>البريد الإلكتروني:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>رقم الهاتف:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(phone || 'لم يتم إدخال رقم')}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>نوع الخدمة:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(service)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; vertical-align: top;"><strong>التفاصيل:</strong></td>
          <td style="padding: 8px; white-space: pre-wrap;">${escapeHtml(details || 'لا توجد تفاصيل')}</td>
        </tr>
      </table>
    </div>
  `;

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
        subject: 'طلب خدمة جديد من ' + firstName + ' ' + lastName,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error occurred' });
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
