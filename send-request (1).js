// Vercel Serverless Function (CommonJS)
// المفتاح يُقرأ من متغير بيئة (Environment Variable) على Vercel، وليس من الكود مطلقًا.

module.exports = async (req, res) => {
  // نسمح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'الطريقة غير مسموحة' });
  }

  const { firstName, lastName, email, phone, service, details } = req.body || {};

  // تحقق أساسي من الحقول المطلوبة
  if (!firstName || !lastName || !email || !service) {
    return res.status(400).json({ error: 'الرجاء تعبئة جميع الحقول المطلوبة' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  // البريد الذي ستصلك عليه الطلبات — غيّره لبريدك
  const TO_EMAIL = process.env.TO_EMAIL || 'T.hanan_q@hotmail.com';
  // بريد المُرسل: يجب أن يكون على نطاق موثّق في Resend
  // مؤقتًا نستخدم نطاق Resend التجريبي إلى أن توثّق نطاقك الخاص
  const FROM_EMAIL = process.env.FROM_EMAIL || 'CX Strategy Lab <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'لم يتم إعداد مفتاح Resend على الخادم' });
  }

  const serviceLabels = {
    'استشارات-متسوق-خفي': 'استشارات متسوق خفي',
    'تحليل-تجربة-العميل': 'تحليل تجربة العميل',
    'تصميم-تجربة-العميل': 'تصميم تجربة العميل',
    'خدمة-أخرى': 'خدمة أخرى',
  };

  const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.8;">
      <h2>طلب خدمة جديد — CX Strategy Lab</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
      <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(email)}</p>
      <p><strong>رقم الهاتف:</strong> ${escapeHtml(phone || 'غير مُدخل')}</p>
      <p><strong>نوع الخدمة:</strong> ${escapeHtml(serviceLabels[service] || service)}</p>
      <p><strong>تفاصيل الطلب:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(details || 'لا توجد تفاصيل إضافية')}</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `طلب خدمة جديد من ${firstName} ${lastName}`,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(502).json({ error: 'تعذر إرسال الطلب، حاول مرة أخرى' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'حدث خطأ غير متوقع' });
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
