// POST /api/generate-report
// Recibe webhook del loop, genera PDF, guarda en Supabase, envía email con Resend

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import puppeteer from 'puppeteer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function generatePdfHtml(data) {
  const {
    user_name,
    empleado_id,
    duracion_minutos,
    estado_final,
    timestamp,
    transcript,
    disc_type = 'Amiable'
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0; background: white; }
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #d4af37;
      padding: 40px 30px;
      border-bottom: 3px solid #d4af37;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }

    .content { padding: 40px 30px; }

    .section { margin-bottom: 40px; }
    .section h2 {
      font-size: 16px;
      text-transform: uppercase;
      color: #d4af37;
      border-bottom: 2px solid #d4af37;
      padding-bottom: 10px;
      margin-bottom: 20px;
      letter-spacing: 1px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-item {
      background: #f9f9f9;
      padding: 15px;
      border-left: 3px solid #d4af37;
      border-radius: 4px;
    }

    .info-label {
      font-weight: bold;
      color: #555;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .info-value {
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    .performance {
      text-align: center;
      padding: 30px;
      background: #1a1a1a;
      color: #d4af37;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .performance-score {
      font-size: 64px;
      font-weight: bold;
      margin: 20px 0;
    }

    .performance-label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .transcript-box {
      background: #f0f0f0;
      padding: 20px;
      border-left: 4px solid #d4af37;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .transcript-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ddd;
    }

    .transcript-item:last-child {
      border-bottom: none;
    }

    .speaker {
      font-weight: bold;
      color: #d4af37;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .message {
      color: #333;
      font-size: 13px;
      line-height: 1.5;
    }

    .action-items {
      background: #1a1a1a;
      color: #d4af37;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .action-items h3 {
      margin-bottom: 15px;
      font-size: 14px;
      text-transform: uppercase;
    }

    .action-items ol {
      margin-left: 20px;
    }

    .action-items li {
      margin-bottom: 10px;
      font-size: 13px;
      line-height: 1.5;
    }

    .footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 12px;
    }

    .badge {
      display: inline-block;
      background: #d4af37;
      color: #1a1a1a;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte de Capacitación VTC</h1>
      <p>Sesión de ${user_name} con Víctor · ${new Date(timestamp).toLocaleDateString('es-MX')}</p>
    </div>

    <div class="content">
      <!-- EMPLEADO INFO -->
      <div class="section">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Empleado</div>
            <div class="info-value">${user_name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">ID Empleado</div>
            <div class="info-value">${empleado_id}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Duración</div>
            <div class="info-value">${duracion_minutos} min</div>
          </div>
          <div class="info-item">
            <div class="info-label">Estado</div>
            <div class="info-value">${estado_final}</div>
          </div>
        </div>
      </div>

      <!-- DESEMPEÑO GLOBAL -->
      <div class="section">
        <h2>Desempeño Global</h2>
        <div class="performance">
          <div class="performance-label">Puntuación</div>
          <div class="performance-score">0/10</div>
          <div class="performance-label">Sin sesión completada</div>
        </div>
      </div>

      <!-- TRANSCRIPCIÓN -->
      <div class="section">
        <h2>Transcripción de la Llamada</h2>
        <div class="transcript-box">
          ${transcript ? transcript.split('\\n').map(line => {
            if (line.includes('AGENT:')) {
              return \`<div class="transcript-item">
                <div class="speaker">🎙️ Víctor (Coach)</div>
                <div class="message">\${line.replace('AGENT:', '').trim()}</div>
              </div>\`;
            } else if (line.includes('USER:')) {
              return \`<div class="transcript-item">
                <div class="speaker">👤 Empleado</div>
                <div class="message">\${line.replace('USER:', '').trim()}</div>
              </div>\`;
            }
            return '';
          }).join('') : '<p style="color: #999;">No hay transcripción disponible.</p>'}
        </div>
      </div>

      <!-- PLAN DE ACCIÓN -->
      <div class="section">
        <h2>Plan de Acción para el Gerente</h2>
        <div class="action-items">
          <h3>🎯 Próximos Pasos</h3>
          <ol>
            <li>Revisar la transcripción completa de la sesión</li>
            <li>Identificar áreas de mejora específicas</li>
            <li>Programar sesión de retroalimentación con el empleado</li>
            <li>Establecer objetivos SMART para la próxima evaluación</li>
          </ol>
        </div>
      </div>

      <!-- METADATA -->
      <div class="section">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Tipo DISC</div>
            <div class="info-value">${disc_type}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Timestamp</div>
            <div class="info-value" style="font-size: 14px;">${new Date(timestamp).toLocaleString('es-MX')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Este reporte fue generado automáticamente por Victor IA Training System</p>
      <p style="margin-top: 10px; opacity: 0.7;">Reporte interno del equipo VTC - Confidencial</p>
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

  try {
    const {
      user_name,
      empleado_id,
      user_email,
      duracion_minutos,
      estado_final,
      timestamp,
      transcript,
      conversation_id,
      disc_type
    } = req.body;

    if (!user_name || !empleado_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // 1. Generar PDF
    const pdfHtml = generatePdfHtml(req.body);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // 2. Guardar PDF en Supabase Storage
    const fileName = `reporte-vtc-${conversation_id}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('vtc-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error subiendo PDF:', uploadError);
      return res.status(500).json({ error: 'Error guardando PDF' });
    }

    // 3. Obtener URL pública del PDF
    const { data: { publicUrl } } = supabase.storage
      .from('vtc-reports')
      .getPublicUrl(fileName);

    // 4. Enviar email con Resend + PDF adjunto
    const emailResponse = await resend.emails.send({
      from: 'info@victor-ia.com.mx',
      to: user_email || 'mesainteligentedemo@gmail.com',
      cc: 'chrisoria16@gmail.com, eldudemateos@gmail.com',
      subject: `Reporte VTC - ${user_name}`,
      html: `
        <h2>Reporte de Capacitación VTC</h2>
        <p><strong>Empleado:</strong> ${user_name}</p>
        <p><strong>ID:</strong> ${empleado_id}</p>
        <p><strong>Duración:</strong> ${duracion_minutos} minutos</p>
        <p><strong>Estado:</strong> ${estado_final}</p>
        <hr>
        <p>El reporte completo está adjunto en PDF.</p>
        <p><a href="${publicUrl}" target="_blank">Ver reporte en línea</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">Reporte generado por Victor IA Training System</p>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer
        }
      ]
    });

    if (emailResponse.error) {
      console.error('Error enviando email:', emailResponse.error);
      return res.status(500).json({ error: 'Error enviando email' });
    }

    // 5. Guardar en Supabase DB
    const { error: dbError } = await supabase
      .from('training_sessions')
      .insert({
        employee_name: user_name,
        employee_id: empleado_id,
        conversation_id,
        duration_minutes: duracion_minutos,
        status: estado_final,
        timestamp,
        transcript,
        disc_type,
        pdf_url: publicUrl,
        email_sent: true
      });

    if (dbError) {
      console.error('Error guardando en DB:', dbError);
    }

    return res.status(200).json({
      success: true,
      message: 'Reporte generado y email enviado',
      pdf_url: publicUrl,
      email_id: emailResponse.data?.id
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}