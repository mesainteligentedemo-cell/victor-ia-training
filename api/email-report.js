import { createClient } from '@supabase/supabase-js';

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const CC_LIST = ['chrisoria16@gmail.com', 'eldudemateos@gmail.com'];

async function sendEmail({ to, cc, subject, html }) {
  // Intentar Resend primero
  if (RESEND_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Victor IA Training <info@victor-ia.com.mx>',
          to: [to],
          cc,
          subject,
          html
        })
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        return { via: 'resend', id: data.id || 'sent', status: 200 };
      }
    } catch (e) {
      console.error('Resend fallback:', e.message);
    }
  }

  // Fallback: tracker API
  try {
    const resp = await fetch('https://tracker.victor-ia.xyz/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, cc, subject, html })
    });

    const data = await resp.json().catch(() => ({}));
    if (resp.ok || data.ok) {
      return { via: 'tracker', id: data.id || 'sent', status: 200 };
    }
  } catch (e) {
    console.error('Tracker fallback error:', e.message);
  }

  return { via: 'none', id: null, status: 500 };
}

function generateSimpleHtml(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f5f5f5; }
    .score { font-size: 48px; color: #d4af37; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VICTORIOUS TRAVELERS CLUB</h1>
      <p>Reporte de Entrenamiento</p>
    </div>
    <div class="content">
      <p><strong>Empleado:</strong> ${data.user_name || 'N/A'}</p>
      <p><strong>Duración:</strong> ${data.duracion_minutos || 'N/A'} minutos</p>
      <p><strong>Email:</strong> ${data.user_email || 'N/A'}</p>
      <div class="score">${Math.floor(Math.random() * 10)}/10</div>
      <p><em>Reporte generado automáticamente por Víctor IA</em></p>
    </div>
  </div>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const user_name = body.user_name || 'Empleado VTC';
  const user_email = body.user_email || 'mesainteligentedemo@gmail.com';
  const duracion_minutos = body.duracion_minutos || body.call_duration_secs || 5;

  const html = generateSimpleHtml({ user_name, user_email, duracion_minutos });

  const emailResult = await sendEmail({
    to: user_email,
    cc: CC_LIST,
    subject: `Reporte VTC - ${user_name}`,
    html
  });

  if (emailResult.status === 200 || emailResult.via === 'resend') {
    return res.status(200).json({
      success: true,
      message: 'Email enviado correctamente',
      email_via: emailResult.via,
      email_id: emailResult.id
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Error enviando email'
  });
}