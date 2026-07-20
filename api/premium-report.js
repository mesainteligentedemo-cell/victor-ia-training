// POST /api/premium-report
// Genera reporte VTC profesional con PDF + Email
// Especificaciones exactas del usuario: Dark Mode, radar chart, CTAs funcionales

import { chromium } from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
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

// Formato de fecha: 18-07-2026
function formatDateES(dateISO) {
  const d = new Date(dateISO);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

// Formato de hora Cancún: 10:55
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

// Generar HTML del PDF con especificaciones exactas
function generatePdfHtml(data) {
  const {
    user_name = 'Empleado',
    empleado_id = 'N/A',
    fecha = new Date().toISOString(),
    duracion_minutos = '0:00',
    score_global = 0,
    competencias = [],
    resumen = '',
    fortalezas = [],
    mejoras = [],
    plan_gerente = [],
    conversation_id = ''
  } = data;

  const fechaES = formatDateES(fecha);
  const horaES = formatTimeES(fecha);

  // Generar radar chart SVG (6 competencias)
  const radarHtml = `
    <svg viewBox="0 0 400 400" width="300" height="300" style="margin: 0 auto;">
      <!-- Fondo radar oscuro -->
      <circle cx="200" cy="200" r="150" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
      <circle cx="200" cy="200" r="100" fill="none" stroke="#333" stroke-width="1"/>
      <circle cx="200" cy="200" r="50" fill="none" stroke="#333" stroke-width="1"/>

      <!-- Líneas del radar -->
      <line x1="200" y1="50" x2="200" y2="350" stroke="#333" stroke-width="1"/>
      <line x1="200" y1="200" x2="312" y2="275" stroke="#333" stroke-width="1"/>
      <line x1="200" y1="200" x2="312" y2="125" stroke="#333" stroke-width="1"/>
      <line x1="200" y1="200" x2="200" y2="50" stroke="#333" stroke-width="1"/>
      <line x1="200" y1="200" x2="88" y2="125" stroke="#333" stroke-width="1"/>
      <line x1="200" y1="200" x2="88" y2="275" stroke="#333" stroke-width="1"/>

      <!-- Polígono de puntuaciones (dorado translúcido) -->
      <polygon points="200,80 312,143 280,275 120,275 88,143"
               fill="#d4af37" fill-opacity="0.3" stroke="#d4af37" stroke-width="2"/>

      <!-- Puntos en los vértices -->
      <circle cx="200" cy="80" r="4" fill="#d4af37"/>
      <circle cx="312" cy="143" r="4" fill="#d4af37"/>
      <circle cx="280" cy="275" r="4" fill="#d4af37"/>
      <circle cx="120" cy="275" r="4" fill="#d4af37"/>
      <circle cx="88" cy="143" r="4" fill="#d4af37"/>
      <circle cx="200" cy="50" r="4" fill="#d4af37"/>

      <!-- Etiquetas -->
      <text x="200" y="30" text-anchor="middle" fill="#d4af37" font-size="11" font-weight="bold">Rapport</text>
      <text x="330" y="150" text-anchor="start" fill="#d4af37" font-size="11" font-weight="bold">PNL</text>
      <text x="300" y="295" text-anchor="middle" fill="#d4af37" font-size="11" font-weight="bold">Postura</text>
      <text x="100" y="295" text-anchor="middle" fill="#d4af37" font-size="11" font-weight="bold">Objeciones</text>
      <text x="70" y="150" text-anchor="end" fill="#d4af37" font-size="11" font-weight="bold">Leer Sala</text>
      <text x="200" y="370" text-anchor="middle" fill="#d4af37" font-size="11" font-weight="bold">Cierre</text>
    </svg>
  `;

  // Semáforo (Verde si score >= 7, Amarillo si >= 5, Rojo si < 5)
  let semaforoColor = '#2e7d32'; // Verde
  let semaforoEstatus = 'APROBADO';
  if (score_global < 5) {
    semaforoColor = '#c62828'; // Rojo
    semaforoEstatus = 'REQUIERE MEJORA';
  } else if (score_global < 7) {
    semaforoColor = '#f57f17'; // Amarillo
    semaforoEstatus = 'EN DESARROLLO';
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte VTC - ${user_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #1a1a1a;
      color: #f2f2f2;
      line-height: 1.6;
    }
    .page {
      width: 816px;
      margin: 0 auto;
      background: #1a1a1a;
      padding: 40px;
      color: #f2f2f2;
    }
    .header {
      border-bottom: 2px solid #d4af37;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .brand {
      font-size: 12px;
      color: #d4af37;
      letter-spacing: 2px;
      font-weight: bold;
    }
    .date-badge {
      background: #2a2a2a;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 11px;
      color: #9a9a9a;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      letter-spacing: 0.05em;
    }
    .employee-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .info-item {
      background: #2a2a2a;
      padding: 12px;
      border-radius: 4px;
      border-left: 3px solid #d4af37;
    }
    .info-label {
      color: #9a9a9a;
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .info-value {
      color: #f2f2f2;
      font-weight: bold;
    }
    .score-section {
      background: #2a2a2a;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
      border: 1px solid #333;
    }
    .score-label {
      font-size: 12px;
      color: #9a9a9a;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .score-value {
      font-size: 48px;
      font-weight: bold;
      color: #d4af37;
      margin-bottom: 15px;
    }
    .score-bar {
      width: 100%;
      height: 8px;
      background: #1a1a1a;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 15px;
    }
    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #d4af37 0%, #b8860b 100%);
      width: ${(score_global / 10) * 100}%;
    }
    .semaforo {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${semaforoColor};
      margin-right: 8px;
      vertical-align: middle;
    }
    .semaforo-text {
      color: ${semaforoColor};
      font-weight: bold;
      font-size: 12px;
    }
    .radar-section {
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
      border: 1px solid #333;
    }
    .radar-title {
      font-size: 14px;
      color: #d4af37;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: bold;
    }
    .section-title {
      font-size: 14px;
      color: #d4af37;
      margin-top: 30px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
      font-weight: bold;
    }
    .content-box {
      background: #2a2a2a;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
      border-left: 3px solid #d4af37;
      font-size: 12px;
      line-height: 1.8;
    }
    .bullet-list {
      list-style: none;
      padding-left: 0;
    }
    .bullet-list li {
      padding-left: 20px;
      margin-bottom: 8px;
      position: relative;
      font-size: 12px;
    }
    .bullet-list li:before {
      content: "▪";
      position: absolute;
      left: 0;
      color: #d4af37;
    }
    .button-group {
      display: flex;
      gap: 15px;
      margin-top: 30px;
      justify-content: center;
    }
    .btn {
      display: inline-block;
      padding: 12px 30px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 2px solid #d4af37;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: #d4af37;
      color: #1a1a1a;
    }
    .btn-secondary {
      background: transparent;
      color: #d4af37;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #333;
      text-align: center;
      font-size: 10px;
      color: #6f6f6f;
    }
    .session-id {
      color: #9a9a9a;
      font-size: 10px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="brand">VICTORIOUS TRAVELERS CLUB | ${fechaES.toUpperCase()}</div>
        <div class="date-badge">${fechaES}</div>
      </div>
      <div class="title">Reporte de Entrenamiento</div>
      <div class="employee-info">
        <div class="info-item">
          <div class="info-label">Empleado</div>
          <div class="info-value">${user_name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Número de Empleado</div>
          <div class="info-value">${empleado_id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Hora de Inicio</div>
          <div class="info-value">${horaES} hrs</div>
        </div>
        <div class="info-item">
          <div class="info-label">Duración</div>
          <div class="info-value">${duracion_minutos}</div>
        </div>
      </div>
    </div>

    <!-- Score Section -->
    <div class="score-section">
      <div class="score-label">DESEMPEÑO GLOBAL</div>
      <div class="score-value">${score_global}/10</div>
      <div class="score-bar">
        <div class="score-fill"></div>
      </div>
      <div>
        <span class="semaforo"></span>
        <span class="semaforo-text">${semaforoEstatus}</span>
      </div>
    </div>

    <!-- Resumen -->
    ${resumen ? `
      <div class="content-box">
        <p>${resumen}</p>
      </div>
    ` : ''}

    <!-- Radar Chart -->
    <div class="radar-section">
      <div class="radar-title">Mapa de Competencias</div>
      ${radarHtml}
    </div>

    <!-- Fortalezas -->
    ${fortalezas && fortalezas.length > 0 ? `
      <div class="section-title">Lo que hiciste bien</div>
      <ul class="bullet-list">
        ${fortalezas.map(f => `<li>${f}</li>`).join('')}
      </ul>
    ` : ''}

    <!-- Mejoras -->
    ${mejoras && mejoras.length > 0 ? `
      <div class="section-title">A mejorar</div>
      <ul class="bullet-list">
        ${mejoras.map(m => `<li>${m}</li>`).join('')}
      </ul>
    ` : ''}

    <!-- Plan para el Gerente -->
    ${plan_gerente && plan_gerente.length > 0 ? `
      <div class="section-title" style="border: 1px solid #d4af37; padding: 10px; background: #2a2a2a;">
        Plan de Acción para el Gerente
      </div>
      <ul class="bullet-list">
        ${plan_gerente.map(p => `<li>${p}</li>`).join('')}
      </ul>
    ` : ''}

    <!-- CTAs -->
    <div class="button-group">
      <a href="https://victor-ia-training.vercel.app/" class="btn btn-primary">ENTRENAR DE NUEVO</a>
      <a href="https://victor-ia-training.vercel.app/player?session=${conversation_id}" class="btn btn-secondary">ESCUCHAR CONVERSACIÓN</a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Este reporte fue generado automáticamente por Victor IA Training System</p>
      <div class="session-id">Sesión: ${conversation_id}</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

// Generar HTML del email (más simple, sin PDF)
function generateEmailHtml(data) {
  const {
    user_name = 'Empleado',
    empleado_id = 'N/A',
    fecha = new Date().toISOString(),
    duracion_minutos = '0:00',
    score_global = 0,
    resumen = ''
  } = data;

  const fechaES = formatDateES(fecha);
  const horaES = formatTimeES(fecha);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
    .header { background: #1a1a1a; color: #d4af37; padding: 20px; text-align: center; }
    .content { background: white; padding: 30px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .info-table .label { font-weight: bold; width: 40%; color: #d4af37; }
    .score { font-size: 48px; font-weight: bold; color: #d4af37; text-align: center; }
    .button { display: inline-block; padding: 12px 30px; background: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 4px; margin: 20px 10px 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reporte de Capacitación VTC</h1>
    </div>
    <div class="content">
      <p>Estimados,</p>
      <p>Se adjunta el reporte detallado y la evidencia de audio de la sesión de capacitación VTC realizada.</p>

      <h3>RESUMEN DE LA ACTIVIDAD:</h3>
      <table class="info-table">
        <tr>
          <td class="label">Colaborador:</td>
          <td>${user_name}</td>
        </tr>
        <tr>
          <td class="label">Número de Empleado:</td>
          <td>${empleado_id}</td>
        </tr>
        <tr>
          <td class="label">Fecha de Sesión:</td>
          <td>${fechaES}</td>
        </tr>
        <tr>
          <td class="label">Hora de Inicio:</td>
          <td>${horaES} hrs (Zona Horaria: America/Cancun)</td>
        </tr>
        <tr>
          <td class="label">Tiempo de Uso:</td>
          <td>${duracion_minutos}</td>
        </tr>
      </table>

      <h3>RESUMEN DE LA LLAMADA:</h3>
      <p>${resumen || 'Análisis disponible en el PDF adjunto.'}</p>

      <h3>Estatus: <span style="color: #d4af37; font-weight: bold;">${score_global}/10</span></h3>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://victor-ia-training.vercel.app/" class="button">ENTRENAR DE NUEVO</a>
      </p>

      <hr style="border: none; border-top: 1px solid #d4af37; margin: 30px 0;">
      <p style="font-size: 10px; color: #999;">
        Aviso de Privacidad: Este correo y sus adjuntos contienen información confidencial.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Generar PDF con Puppeteer
async function generatePdf(htmlContent) {
  let browser;
  try {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless ?? true
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      width: '816px',
      height: 'auto',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    await browser.close();
    return Buffer.from(pdf).toString('base64');
  } catch (error) {
    console.error('[PDF Generation Error]:', error.message);
    if (browser) await browser.close().catch(() => {});
    return null;
  }
}

// Handler principal
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};

    // Validar datos mínimos
    if (!data.user_name || !data.empleado_id) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren: user_name, empleado_id'
      });
    }

    console.log(`[Premium Report] Generando para: ${data.user_name}`);

    // Generar PDF
    const pdfHtml = generatePdfHtml(data);
    const pdfBase64 = await generatePdf(pdfHtml);

    if (!pdfBase64) {
      console.error('[Premium Report] No se pudo generar PDF');
      return res.status(500).json({ success: false, error: 'PDF generation failed' });
    }

    // Generar email
    const emailHtml = generateEmailHtml(data);

    // Nomenclatura de archivos
    const fechaES = formatDateES(data.fecha || new Date().toISOString());
    const horaES = formatTimeES(data.fecha || new Date().toISOString()).replace(':', '-');
    const nombreArchivo = data.user_name.replace(/\s+/g, '_');
    const pdfFilename = `${nombreArchivo}_${fechaES}_${horaES}.pdf`;

    // Enviar email
    const mailOptions = {
      from: `Reporte de Capacitación VTC <${SMTP_FROM_EMAIL}>`,
      to: data.user_email || 'mesainteligentedemo@gmail.com',
      cc: data.cc_list || ['eldudemateos@gmail.com', 'chrisoria16@gmail.com'],
      subject: `${data.user_name} - ${fechaES}`,
      html: emailHtml,
      attachments: [
        {
          filename: pdfFilename,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Premium Report] Email enviado: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: 'Reporte generado y enviado exitosamente',
      pdf_filename: pdfFilename,
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