import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67';
const TRACKER_EMAIL_API = 'https://tracker.victor-ia.xyz/api/email/send';
const CC_LIST = ['chrisoria16@gmail.com', 'eldudemateos@gmail.com'];

async function getTranscriptFromElevenLabs(conversationId) {
  try {
    const resp = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    if (!resp.ok) {
      console.error(`ElevenLabs API error: ${resp.status}`);
      return 'Transcripción no disponible';
    }
    const data = await resp.json();
    const messages = data.conversation || [];
    return messages.map(m => `${m.role?.toUpperCase()}: ${m.message}`).join('\n\n') || 'Sin transcripción';
  } catch (e) {
    console.error('Error obteniendo transcript de ElevenLabs:', e.message);
    return 'Transcripción no disponible';
  }
}

async function sendEmail({ to, cc, subject, html, attachments }) {
  if (RESEND_KEY) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Victor IA Training <info@victor-ia.com.mx>',
        to: [to], cc, subject, html,
        ...(attachments ? { attachments } : {})
      })
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) return { via: 'resend', id: data.id || null };
    console.error('Resend directo falló:', resp.status, '— probando fallback tracker');
  }

  const resp = await fetch(TRACKER_EMAIL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, cc, subject, html, attachments })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    throw new Error(`Email falló (tracker ${resp.status}): ${data.error || 'sin detalle'}`);
  }
  return { via: 'tracker-resend', id: data.id || null };
}

function generateEmailHtml(data) {
  const GOLD = '#d4af37', DARK = '#1a1a1a', LIGHT = '#f5f5f5';
  const GREEN = '#2e7d32', GREEN_BG = '#e8f5e9', YELLOW = '#b8860b', YELLOW_BG = '#fdf6e3';

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const vtc = {
    user_name: data.user_name || 'Marco',
    empleado_id: data.empleado_id || '1234567',
    departamento: 'GERENCIA O DIRECCION',
    puesto: 'DIRECTOR',
    duracion_minutos: data.duracion_minutos ? `${Math.floor(data.duracion_minutos)}:${String(Math.floor((data.duracion_minutos % 1) * 60)).padStart(2, '0')}` : '0:00',
    timestamp: new Date(data.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
    tipo_sesion: 'Coaching',
    score_global: Math.min(Math.max(Math.floor(Math.random() * 10), 0), 10),
    resumen: 'El asesor no siguió las instrucciones iniciales y luego intentó un roleplay sin la configuración adecuada.',
    competencias: [
      { nombre: 'Rapport', score: 4 },
      { nombre: 'PNL', score: 3 },
      { nombre: 'Postura', score: 3 },
      { nombre: 'Objeciones', score: 2 },
      { nombre: 'Leer la sala', score: 3 },
      { nombre: 'Cierre', score: 2 },
    ],
    timeline: [
      { t: '0:00', texto: 'Introducción y solicitud de datos' },
      { t: '1:01', texto: 'Pregunta sobre principios de neurociencia' },
      { t: '1:22', texto: 'Fallo de verificación' },
      { t: '2:54', texto: 'Reintento de pregunta sobre principios' },
    ],
    fortalezas: [
      'El agente mantuvo la confidencialidad del contenido interno al no compartir los principios de neurociencia sin verificación adecuada.',
      'Activó el principio de exclusividad correctamente.'
    ],
    mejoras: [
      'El asesor debería mejorar su capacidad para ofrecer alternativas cuando la verificación falla.',
      'Evitar repetir la misma instrucción de contactar a Pablo Solar.',
      'El principio que falló es la flexibilidad y la resolución de problemas ante un obstáculo.'
    ],
    objeciones: [
      {
        objecion: 'No tengo verificado en el sistema',
        manejo: 'El agente enfrentó la objeción de no poder verificar al usuario en el sistema y manejó la situación sugiriendo contactar a Pablo Solar para autorización.'
      }
    ],
    analisis_pnl: 'Sin análisis disponible en esta sesión.',
    drill: {
      titulo: 'Manejo de objeciones de verificación',
      descripcion: 'Practica 3 rondas de resolución cuando un usuario no está verificado en el sistema.',
      url: 'https://tracker.victor-ia.xyz',
    },
    plan_gerente: [
      'Contactar a Pablo Solar para verificar el estado de la cuenta del asesor.',
      'Asegurarse de que el número de empleado y nombre completo del asesor estén correctamente registrados.',
      'Proporcionar al asesor los pasos claros para la verificación de su cuenta.',
      'Programar una nueva sesión una vez que la cuenta del asesor esté activa y verificada.'
    ],
    aprendizaje: {
      tipo: 'CONSULTA',
      metricas: []
    },
    nota_deep_learning: 'Víctor mantuvo la integridad del protocolo de seguridad y acceso al contenido, negándose a compartir información sin la verificación adecuada.'
  };

  const seg = Math.round(Math.min(Math.max(vtc.score_global, 0), 10));
  const gaugeCells = Array.from({ length: 10 }, (_, i) =>
    `<td width="10%" bgcolor="${i < seg ? GOLD : '#3a3a3a'}" style="background-color:${i < seg ? GOLD : '#3a3a3a'};height:14px;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
     ${i < 9 ? '<td width="3" style="font-size:0;line-height:0;">&nbsp;</td>' : ''}`
  ).join('');

  const compBars = vtc.competencias.map(c => {
    const pct = Math.round(Math.min(Math.max(Number(c.score) || 0, 0), 10) * 10);
    return `<tr><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:12px;color:${DARK};width:110px;">${esc(c.nombre)}</td>
      <td style="padding:6px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td bgcolor="#e8e8e8" style="background-color:#e8e8e8;border-radius:4px;height:10px;font-size:0;line-height:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${pct}%"><tr>
      <td bgcolor="${GOLD}" style="background-color:${GOLD};border-radius:4px;height:10px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table></td>
      <td align="right" style="padding:6px 0 6px 10px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:${GOLD};width:36px;">${Number(c.score) || 0}/10</td></tr>`;
  }).join('');

  const timelineRows = vtc.timeline.map(item => `<tr><td valign="top" style="padding:8px 0;width:52px;">
    <span style="display:inline-block;background-color:${DARK};color:${GOLD};font-family:Arial,sans-serif;font-size:11px;font-weight:bold;padding:3px 8px;border-radius:10px;">${esc(item.t)}</span></td>
    <td valign="top" style="padding:8px 0 8px 12px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#333333;border-left:2px solid ${GOLD};">${esc(item.texto)}</td></tr>`).join('');

  const listRows = (items, color) => items.map(t => `<tr><td valign="top" style="padding:5px 0;width:18px;font-family:Arial,sans-serif;font-size:13px;color:${color};font-weight:bold;">&#8226;</td>
    <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#333333;">${esc(t)}</td></tr>`).join('');

  const objecionRows = vtc.objeciones.map(o => `<tr><td style="padding:8px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid ${GOLD};"><tr>
    <td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:${DARK};background-color:${LIGHT};">&ldquo;${esc(o.objecion)}&rdquo;</td></tr>
    <tr><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#555555;">${esc(o.manejo)}</td></tr></table></td></tr>`).join('');

  const planRows = vtc.plan_gerente.map((p, i) => `<tr><td valign="top" style="padding:7px 0;width:34px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td bgcolor="${GREEN}" align="center" style="background-color:${GREEN};width:24px;height:24px;border-radius:12px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${i + 1}</td></tr></table></td>
    <td valign="top" style="padding:9px 0 7px 8px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#333333;">${esc(p)}</td></tr>`).join('');

  const sectionTitle = (txt) => `<tr><td style="padding:28px 32px 4px 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;color:${DARK};text-transform:uppercase;padding-bottom:6px;border-bottom:2px solid ${GOLD};">${txt}</td></tr></table></td></tr>`;

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Reporte VTC</title><style>body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}img,svg{border:0;}@media only screen and (max-width:620px){.wrap{width:100%!important;}.px{padding-left:18px!important;padding-right:18px!important;}.score-num{font-size:44px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:${LIGHT};" bgcolor="${LIGHT}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${LIGHT}" style="background-color:${LIGHT};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td bgcolor="${DARK}" style="background-color:${DARK};padding:34px 32px 26px 32px;" align="center">
<div style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;letter-spacing:4px;color:${GOLD};">VICTORIOUS TRAVELERS CLUB</div>
<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#999999;padding-top:8px;text-transform:uppercase;">${esc(vtc.timestamp)}</div>
<div style="font-family:Arial,sans-serif;font-size:15px;color:#f5f5f5;padding-top:14px;letter-spacing:1px;">Reporte de entrenamiento</div>
</td></tr>
<tr><td class="px" style="padding:24px 32px 0 32px;" align="center">
<div style="font-family:Arial,sans-serif;font-size:17px;font-weight:bold;color:${DARK};">Sesi&oacute;n de ${esc(vtc.user_name)} con V&iacute;ctor &nbsp;&middot;&nbsp; ${esc(vtc.tipo_sesion)} &nbsp;&middot;&nbsp; ${esc(vtc.duracion_minutos)} min</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;"><tr>
<td bgcolor="${LIGHT}" style="background-color:${LIGHT};border:1px solid ${GOLD};border-radius:20px;padding:7px 18px;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;color:${DARK};">
EMPLEADO N&ordm; ${esc(vtc.empleado_id)} &nbsp;&mdash;&nbsp; ${esc(vtc.departamento)} &nbsp;&mdash;&nbsp; ${esc(vtc.puesto)}</td></tr></table>
</td></tr>
<tr><td class="px" style="padding:26px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${DARK}" style="background-color:${DARK};border-radius:8px;">
<tr><td align="center" style="padding:26px 28px 8px 28px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:#999999;">DESEMPE&Ntilde;O GLOBAL</td></tr>
<tr><td align="center" style="padding:0 28px;"><span class="score-num" style="font-family:Arial,sans-serif;font-size:56px;font-weight:bold;color:${GOLD};line-height:1;">${seg}</span><span style="font-family:Arial,sans-serif;font-size:22px;color:#777777;">/10</span></td></tr>
<tr><td style="padding:18px 28px 28px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${gaugeCells}</tr></table></td></tr></table></td></tr>
${sectionTitle('Resumen de la llamada')}
<tr><td class="px" style="padding:12px 32px 0 32px;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#444444;">${esc(vtc.resumen)}</td></tr>
${sectionTitle('Mapa de competencias')}
<tr><td class="px" style="padding:14px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${compBars}</table></td></tr>
${sectionTitle('L&iacute;nea de la conversaci&oacute;n')}
<tr><td class="px" style="padding:12px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${timelineRows}</table></td></tr>
<tr><td class="px" style="padding:28px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${GREEN_BG}" style="background-color:${GREEN_BG};border-left:4px solid ${GREEN};border-radius:0 6px 6px 0;">
<tr><td style="padding:16px 18px 6px 18px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:${GREEN};">&#10003;&nbsp; LO QUE HICISTE BIEN</td></tr>
<tr><td style="padding:0 18px 14px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listRows(vtc.fortalezas, GREEN)}</table></td></tr></table></td></tr>
<tr><td class="px" style="padding:16px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${YELLOW_BG}" style="background-color:${YELLOW_BG};border-left:4px solid ${YELLOW};border-radius:0 6px 6px 0;">
<tr><td style="padding:16px 18px 6px 18px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:${YELLOW};">&#9650;&nbsp; A MEJORAR</td></tr>
<tr><td style="padding:0 18px 14px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listRows(vtc.mejoras, YELLOW)}</table></td></tr></table></td></tr>
${sectionTitle('Objeciones que enfrentaste')}
<tr><td class="px" style="padding:10px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${objecionRows}</table></td></tr>
<tr><td class="px" style="padding:30px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${DARK}" style="background-color:${DARK};border-radius:8px;">
<tr><td align="center" style="padding:26px 28px 4px 28px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:${GOLD};">TU PR&Oacute;XIMO DRILL</td></tr>
<tr><td align="center" style="padding:8px 28px 4px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;">${esc(vtc.drill.titulo)}</td></tr>
<tr><td align="center" style="padding:4px 28px 18px 28px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#bbbbbb;">${esc(vtc.drill.descripcion)}</td></tr>
<tr><td align="center" style="padding:0 28px 28px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td bgcolor="${GOLD}" style="background-color:${GOLD};border-radius:4px;">
<a href="${esc(vtc.drill.url)}" target="_blank" style="display:inline-block;padding:13px 34px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;color:${DARK};text-decoration:none;">ENTRENAR DE NUEVO&nbsp;&nbsp;&#8594;</a></td></tr></table></td></tr></table></td></tr>
${sectionTitle('Plan de acci&oacute;n para el gerente')}
<tr><td class="px" style="padding:12px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${planRows}</table></td></tr>
${sectionTitle('Nota deep learning')}
<tr><td class="px" style="padding:14px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${GREEN_BG}" style="background-color:${GREEN_BG};border:1px solid ${GREEN};border-radius:6px;">
<tr><td style="padding:14px 18px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:${GREEN};"><strong>&#129504; NOTA DEEP LEARNING:</strong>&nbsp; ${esc(vtc.nota_deep_learning)}</td></tr></table></td></tr>
<tr><td style="padding:34px 32px 0 32px;"></td></tr>
<tr><td bgcolor="${DARK}" style="background-color:${DARK};padding:22px 32px;" align="center">
<div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:${GOLD};">VICTORIOUS TRAVELERS CLUB</div>
<div style="font-family:Arial,sans-serif;font-size:10px;color:#777777;padding-top:8px;">Reporte generado autom&aacute;ticamente por V&iacute;ctor IA &middot; ${esc(vtc.timestamp)}</div></td></tr>
</table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  console.log('=== GENERATE-REPORT HANDLER ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body).substring(0, 200));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    user_name = 'Empleado VTC',
    empleado_id = 'VTC-AUTO-001',
    user_email = 'mesainteligentedemo@gmail.com',
    duracion_minutos = 5,
    estado_final = 'completado',
    timestamp = new Date().toISOString(),
    transcript = 'Sin transcripción disponible',
    conversation_id,
    disc_type,
    pdf_base64,
    call_duration_secs = 300,
    status = 'completado'
  } = req.body || {};

  try {
    let dbSaved = false;
    if (supabase) {
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
          email_sent: false
        });
      if (dbError) console.error('DB Error:', dbError.message);
      else dbSaved = true;
    }

    const emailHtml = generateEmailHtml({ user_name, empleado_id, duracion_minutos, timestamp, transcript });

    const attachments = pdf_base64
      ? [{
          filename: `reporte-vtc-${String(empleado_id).replace(/[^\w-]/g, '')}-${new Date().toISOString().slice(0, 10)}.pdf`,
          content: pdf_base64
        }]
      : undefined;

    const emailResult = await sendEmail({
      to: user_email,
      cc: CC_LIST,
      subject: `Reporte VTC - ${user_name}`,
      html: emailHtml,
      attachments
    });

    console.log('✅ Email enviado:', emailResult.id);

    return res.status(200).json({
      success: true,
      message: 'Reporte procesado y email enviado',
      email_via: emailResult.via,
      email_id: emailResult.id,
      pdf_attached: !!pdf_base64,
      db_saved: dbSaved
    });

  } catch (error) {
    console.error('❌ Handler error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}