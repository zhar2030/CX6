// Vercel Serverless Function (CommonJS)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, service, details } = req.body || {};

  if (!firstName || !lastName || !email || !service) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL || 'T.hanan_q@hotmail.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'CX Strategy Lab <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key not configured' });
  }

  const serviceLabels = {
    'استشارات-متسوق-خفي': 'استشارات متسوق خفي',
    'تحليل-تجربة-العميل': 'تحليل تجربة العميل',
    'تصميم-تجربة-العميل': 'تصميم تجربة العميل',
    'خدمة-أخرى': 'خدمة أخرى',
  };

  const html = 
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.8;">
      <h2>طلب خدمة جديد — CX Strategy Lab</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(firstName)} </p>
      <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(email)}</p>
      <p><strong>رقم الهاتف:</strong> ${escapeHtml(phone || 'غير مُدخل')}</p>
      <p><strong>نوع الخدمة:</strong> ${escapeHtml(serviceLabels[service] || service)}</p>
      <p><strong>تفاصيل الطلب:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(details || 'لا توجد تفاصيل إضافية')}</p>
    </div>
  ;

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
        subject: طلب خدمة جديد من ${firstName} ,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(502).json({ error: 'Failed to send request' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'Unexpected error occurred' });
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
