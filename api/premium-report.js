// POST /api/premium-report
// Reporte VTC profesional: genera email + PDF opcional

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'mail.victor-ia.com.mx';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'info@victor-ia.com.mx';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'info@victor-ia.com.mx';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

function formatDateES(dateISO) {
  const d = new Date(dateISO);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function formatTimeES(dateISO) {
  const d = new Date(dateISO);
  const formatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(d);
}

function generateEmailHtml(data) {
  const {
    user_name = 'Empleado',
    empleado_id = 'N/A',
    fecha = new Date().toISOString(),
    duracion_minutos = '0:00',
    score_global = 0,
    resumen = '',
    fortalezas = [],
    mejoras = [],
    plan_gerente = []
  } = data;

  const fechaES = formatDateES(fecha);
  const horaES = formatTimeES(fecha);

  let semaforoColor = '#2e7d32';
  let semaforoEstatus = 'APROBADO';
  if (score_global < 5) {
    semaforoColor = '#c62828';
    semaforoEstatus = 'REQUIERE MEJORA';
  } else if (score_global < 7) {
    semaforoColor = '#f57f17';
    semaforoEstatus = 'EN DESARROLLO';
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; color: #333; margin: 0; padding: 0; }
    .container { max-width: 700px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); color: #d4af37; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
    .header p { margin: 5px 0 0 0; font-size: 12px; color: #aaa; }
    .content { padding: 40px 30px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #d4af37; }
    .info-label { font-size: 11px; color: #999; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
    .info-value { font-size: 14px; color: #333; font-weight: bold; }
    .score-box { background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
    .score-label { font-size: 12px; text-transform: uppercase; margin-bottom: 10px; color: #aaa; }
    .score-value { font-size: 48px; font-weight: bold; margin-bottom: 15px; }
    .score-bar { width: 100%; height: 6px; background: #444; border-radius: 3px; overflow: hidden; }
    .score-fill { height: 100%; background: linear-gradient(90deg, #d4af37, #b8860b); width: ${(score_global / 10) * 100}%; }
    .semaforo-badge { display: inline-block; margin-top: 15px; padding: 8px 16px; background: ${semaforoColor}; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .section-title { font-size: 14px; color: #d4af37; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; font-weight: bold; }
    .bullet-list { list-style: none; padding-left: 0; }
    .bullet-list li { padding-left: 20px; margin-bottom: 8px; position: relative; }
    .bullet-list li:before { content: "▪"; position: absolute; left: 0; color: #d4af37; font-weight: bold; }
    .cta-button { display: inline-block; padding: 12px 30px; background: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 4px; margin: 10px 5px 10px 0; font-weight: bold; font-size: 12px; }
    .footer { background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>REPORTE DE CAPACITACIÓN VTC</h1>
      <p>Victorious Travelers Club | ${fechaES.toUpperCase()}</p>
    </div>

    <div class="content">
      <p>Estimados,</p>
      <p>Se adjunta el reporte detallado de la sesión de capacitación realizada.</p>

      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Colaborador</div>
          <div class="info-value">${user_name}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Número de Empleado</div>
          <div class="info-value">${empleado_id}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Fecha de Sesión</div>
          <div class="info-value">${fechaES}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Hora de Inicio</div>
          <div class="info-value">${horaES} hrs (Cancún)</div>
        </div>
      </div>

      <div class="score-box">
        <div class="score-label">Desempeño Global</div>
        <div class="score-value">${score_global}/10</div>
        <div class="score-bar">
          <div class="score-fill"></div>
        </div>
        <div class="semaforo-badge">${semaforoEstatus}</div>
      </div>

      ${resumen ? `
        <div class="section-title">Resumen de la Llamada</div>
        <p>${resumen}</p>
      ` : ''}

      ${fortalezas && fortalezas.length > 0 ? `
        <div class="section-title">Lo que hiciste bien</div>
        <ul class="bullet-list">
          ${fortalezas.map(f => `<li>${f}</li>`).join('')}
        </ul>
      ` : ''}

      ${mejoras && mejoras.length > 0 ? `
        <div class="section-title">A mejorar</div>
        <ul class="bullet-list">
          ${mejoras.map(m => `<li>${m}</li>`).join('')}
        </ul>
      ` : ''}

      ${plan_gerente && plan_gerente.length > 0 ? `
        <div class="section-title">Plan de Acción para el Gerente</div>
        <ul class="bullet-list">
          ${plan_gerente.map(p => `<li>${p}</li>`).join('')}
        </ul>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://victor-ia-training.vercel.app/" class="cta-button">ENTRENAR DE NUEVO</a>
      </div>

      <hr style="border: none; border-top: 1px solid #d4af37; margin: 30px 0;">
    </div>

    <div class="footer">
      <p>Aviso de Privacidad: Este correo y sus adjuntos contienen información confidencial.</p>
      <p>Victor IA Training System</p>
    </div>
  </div>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};

    if (!data.user_name || !data.empleado_id) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren: user_name, empleado_id'
      });
    }

    console.log(`[Premium Report] Generando para: ${data.user_name}`);

    // Generar email
    const emailHtml = generateEmailHtml(data);

    // Enviar email
    const fechaES = formatDateES(data.fecha || new Date().toISOString());
    const mailOptions = {
      from: `Reporte de Capacitación VTC <${SMTP_FROM_EMAIL}>`,
      to: data.user_email || 'mesainteligentedemo@gmail.com',
      cc: data.cc_list || ['eldudemateos@gmail.com', 'chrisoria16@gmail.com'],
      subject: `${data.user_name} - ${fechaES}`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Premium Report] Email enviado: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: 'Reporte generado y enviado exitosamente',
      email_id: info.messageId
    });
  } catch (error) {
    console.error('[Premium Report Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}