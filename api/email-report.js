import { createClient } from '@supabase/supabase-js';

// ============================================================================
//  VICTOR IA TRAINING — REPORTE REAL Y COMPLETO
//  Flujo: ElevenLabs (transcript + audio) -> OpenRouter (análisis IA)
//         -> Playwright/Chromium (PDF) -> Resend (email con adjuntos)
//  Fallback de email: tracker API. Ejecución única, sin loops.
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.7-sonnet';
const TRACKER_EMAIL_API = 'https://tracker.victor-ia.xyz/api/email/send';
const CC_LIST = ['chrisoria16@gmail.com', 'eldudemateos@gmail.com'];

const GOLD = '#d4af37', DARK = '#1a1a1a', LIGHT = '#f5f5f5';
const GREEN = '#2e7d32', GREEN_BG = '#e8f5e9', YELLOW = '#b8860b', YELLOW_BG = '#fdf6e3';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clampScore = (n) => Math.min(Math.max(Math.round(Number(n) || 0), 0), 10);

// ---------------------------------------------------------------------------
// 1) TRANSCRIPCIÓN REAL — ElevenLabs ConvAI
// ---------------------------------------------------------------------------
async function getTranscriptFromElevenLabs(conversationId) {
  try {
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      { method: 'GET', headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );

    if (!resp.ok) {
      console.error(`[ElevenLabs] transcript API error: ${resp.status}`);
      return { text: '', messages: [], durationSecs: 0 };
    }

    const data = await resp.json();
    // La API expone el arreglo en `transcript`; algunos entornos usan `conversation`.
    const rawMessages = data.transcript || data.conversation || [];

    const messages = rawMessages
      .filter((m) => m && typeof m.message === 'string' && m.message.trim())
      .map((m) => ({
        role: (m.role || 'agent').toLowerCase(),
        message: m.message.trim(),
        time: Number(m.time_in_call_secs ?? m.time_in_call_seconds ?? 0)
      }));

    const text = messages
      .map((m) => `${m.role === 'user' ? 'ASESOR' : 'VÍCTOR'}: ${m.message}`)
      .join('\n\n');

    const durationSecs = Number(
      data.metadata?.call_duration_secs ??
      data.metadata?.call_duration_seconds ??
      (messages.length ? messages[messages.length - 1].time : 0)
    );

    console.log(`[ElevenLabs] transcript OK — ${messages.length} turnos, ${durationSecs}s`);
    return { text, messages, durationSecs };
  } catch (e) {
    console.error('[ElevenLabs] transcript exception:', e.message);
    return { text: '', messages: [], durationSecs: 0 };
  }
}

// ---------------------------------------------------------------------------
// 2) AUDIO REAL — ElevenLabs ConvAI (MP3 -> base64)
// ---------------------------------------------------------------------------
async function getAudioFromElevenLabs(conversationId) {
  try {
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      { method: 'GET', headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );

    if (!resp.ok) {
      console.error(`[ElevenLabs] audio API error: ${resp.status}`);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error('[ElevenLabs] audio vacío');
      return null;
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log(`[ElevenLabs] audio OK — ${(arrayBuffer.byteLength / 1024).toFixed(0)} KB`);
    return base64;
  } catch (e) {
    console.error('[ElevenLabs] audio exception:', e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3) ANÁLISIS IA — OpenRouter (Claude Sonnet)
// ---------------------------------------------------------------------------
function defaultAnalysis() {
  return {
    resumen: 'No fue posible generar el análisis automático de esta sesión. Revisa la transcripción adjunta.',
    competencias: [
      { nombre: 'Rapport', score: 0, feedback: '' },
      { nombre: 'PNL', score: 0, feedback: '' },
      { nombre: 'Manejo de objeciones', score: 0, feedback: '' },
      { nombre: 'Cierre', score: 0, feedback: '' }
    ],
    fortalezas: [],
    mejoras: [],
    plan_gerente: [],
    timeline: [],
    objeciones: [],
    drill: { titulo: 'Repasar fundamentos', descripcion: 'Practica una ronda completa de la llamada.', url: 'https://tracker.victor-ia.xyz' },
    nota_deep_learning: '',
    score_global: 0
  };
}

async function analyzeTranscriptWithAI(transcript) {
  if (!transcript || !transcript.trim()) {
    console.warn('[OpenRouter] transcript vacío — usando análisis por defecto');
    return defaultAnalysis();
  }
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] falta OPENROUTER_API_KEY — usando análisis por defecto');
    return defaultAnalysis();
  }

  const systemPrompt =
    'Eres un evaluador experto de ventas de timeshare del Victorious Travelers Club. ' +
    'Analizas transcripciones de sesiones de entrenamiento entre un ASESOR y el coach IA VÍCTOR. ' +
    'Devuelves EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin ```.';

  const userPrompt =
`Analiza la siguiente transcripción de una sesión de entrenamiento de ventas y devuelve un JSON EXACTO con esta forma:

{
  "resumen": "string (2-4 frases, español, qué pasó en la llamada)",
  "competencias": [{"nombre": "string", "score": 1-10, "feedback": "string breve"}],
  "fortalezas": ["string"],
  "mejoras": ["string"],
  "plan_gerente": ["string (acciones concretas para el gerente)"],
  "timeline": [{"t": "M:SS", "texto": "string (momento clave)"}],
  "objeciones": [{"objecion": "string", "manejo": "string"}],
  "drill": {"titulo": "string", "descripcion": "string"},
  "nota_deep_learning": "string (1 insight de aprendizaje)",
  "score_global": 1-10
}

Reglas:
- Incluye al menos 4 competencias (Rapport, PNL, Manejo de objeciones, Cierre y las que apliquen).
- score y score_global son enteros de 1 a 10.
- Todo en español. Solo el JSON, nada más.

TRANSCRIPCIÓN:
"""
${transcript}
"""`;

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tracker.victor-ia.xyz',
        'X-Title': 'Victor IA Training Report'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => '');
      console.error(`[OpenRouter] error ${resp.status}: ${errTxt.slice(0, 200)}`);
      return defaultAnalysis();
    }

    const data = await resp.json();
    let content = data.choices?.[0]?.message?.content || '';
    // Limpiar posibles fences ```json
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Intentar extraer el primer bloque {...}
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('respuesta no-JSON');
      parsed = JSON.parse(match[0]);
    }

    // Normalizar / merge con defaults
    const base = defaultAnalysis();
    const out = {
      resumen: parsed.resumen || base.resumen,
      competencias: Array.isArray(parsed.competencias) && parsed.competencias.length
        ? parsed.competencias.map((c) => ({
            nombre: c.nombre || 'Competencia',
            score: clampScore(c.score),
            feedback: c.feedback || ''
          }))
        : base.competencias,
      fortalezas: Array.isArray(parsed.fortalezas) ? parsed.fortalezas : [],
      mejoras: Array.isArray(parsed.mejoras) ? parsed.mejoras : [],
      plan_gerente: Array.isArray(parsed.plan_gerente) ? parsed.plan_gerente : [],
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      objeciones: Array.isArray(parsed.objeciones) ? parsed.objeciones : [],
      drill: {
        titulo: parsed.drill?.titulo || base.drill.titulo,
        descripcion: parsed.drill?.descripcion || base.drill.descripcion,
        url: parsed.drill?.url || base.drill.url
      },
      nota_deep_learning: parsed.nota_deep_learning || '',
      score_global: clampScore(parsed.score_global)
    };

    console.log(`[OpenRouter] análisis OK — score_global ${out.score_global}/10, ${out.competencias.length} competencias`);
    return out;
  } catch (e) {
    console.error('[OpenRouter] exception:', e.message);
    return defaultAnalysis();
  }
}

// ---------------------------------------------------------------------------
// HTML del reporte (usado tanto para el email como base para el PDF)
// ---------------------------------------------------------------------------
function buildReportHtml(vtc, { forPdf = false } = {}) {
  const seg = clampScore(vtc.score_global);

  const gaugeCells = Array.from({ length: 10 }, (_, i) =>
    `<td width="10%" bgcolor="${i < seg ? GOLD : '#3a3a3a'}" style="background-color:${i < seg ? GOLD : '#3a3a3a'};height:14px;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
     ${i < 9 ? '<td width="3" style="font-size:0;line-height:0;">&nbsp;</td>' : ''}`
  ).join('');

  const compBars = (vtc.competencias || []).map((c) => {
    const pct = clampScore(c.score) * 10;
    return `<tr><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:12px;color:${DARK};width:130px;">${esc(c.nombre)}</td>
      <td style="padding:6px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td bgcolor="#e8e8e8" style="background-color:#e8e8e8;border-radius:4px;height:10px;font-size:0;line-height:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${pct}%"><tr>
      <td bgcolor="${GOLD}" style="background-color:${GOLD};border-radius:4px;height:10px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table></td>
      <td align="right" style="padding:6px 0 6px 10px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:${GOLD};width:36px;">${clampScore(c.score)}/10</td></tr>`;
  }).join('');

  const timelineRows = (vtc.timeline || []).map((item) => `<tr><td valign="top" style="padding:8px 0;width:52px;">
    <span style="display:inline-block;background-color:${DARK};color:${GOLD};font-family:Arial,sans-serif;font-size:11px;font-weight:bold;padding:3px 8px;border-radius:10px;">${esc(item.t || '0:00')}</span></td>
    <td valign="top" style="padding:8px 0 8px 12px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#333333;border-left:2px solid ${GOLD};">${esc(item.texto || '')}</td></tr>`).join('');

  const listRows = (items, color) => (items || []).map((t) => `<tr><td valign="top" style="padding:5px 0;width:18px;font-family:Arial,sans-serif;font-size:13px;color:${color};font-weight:bold;">&#8226;</td>
    <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#333333;">${esc(t)}</td></tr>`).join('');

  const objecionRows = (vtc.objeciones || []).map((o) => `<tr><td style="padding:8px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid ${GOLD};"><tr>
    <td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:${DARK};background-color:${LIGHT};">&ldquo;${esc(o.objecion)}&rdquo;</td></tr>
    <tr><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#555555;">${esc(o.manejo)}</td></tr></table></td></tr>`).join('');

  const planRows = (vtc.plan_gerente || []).map((p, i) => `<tr><td valign="top" style="padding:7px 0;width:34px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td bgcolor="${GREEN}" align="center" style="background-color:${GREEN};width:24px;height:24px;border-radius:12px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#ffffff;">${i + 1}</td></tr></table></td>
    <td valign="top" style="padding:9px 0 7px 8px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#333333;">${esc(p)}</td></tr>`).join('');

  const sectionTitle = (txt) => `<tr><td style="padding:28px 32px 4px 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;color:${DARK};text-transform:uppercase;padding-bottom:6px;border-bottom:2px solid ${GOLD};">${txt}</td></tr></table></td></tr>`;

  // Bloques condicionales
  const fortalezasBlock = (vtc.fortalezas || []).length
    ? `<tr><td class="px" style="padding:28px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${GREEN_BG}" style="background-color:${GREEN_BG};border-left:4px solid ${GREEN};border-radius:0 6px 6px 0;">
      <tr><td style="padding:16px 18px 6px 18px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:${GREEN};">&#10003;&nbsp; LO QUE HICISTE BIEN</td></tr>
      <tr><td style="padding:0 18px 14px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listRows(vtc.fortalezas, GREEN)}</table></td></tr></table></td></tr>`
    : '';

  const mejorasBlock = (vtc.mejoras || []).length
    ? `<tr><td class="px" style="padding:16px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${YELLOW_BG}" style="background-color:${YELLOW_BG};border-left:4px solid ${YELLOW};border-radius:0 6px 6px 0;">
      <tr><td style="padding:16px 18px 6px 18px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:${YELLOW};">&#9650;&nbsp; A MEJORAR</td></tr>
      <tr><td style="padding:0 18px 14px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listRows(vtc.mejoras, YELLOW)}</table></td></tr></table></td></tr>`
    : '';

  const objecionesBlock = (vtc.objeciones || []).length
    ? `${sectionTitle('Objeciones que enfrentaste')}
      <tr><td class="px" style="padding:10px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${objecionRows}</table></td></tr>`
    : '';

  const timelineBlock = (vtc.timeline || []).length
    ? `${sectionTitle('L&iacute;nea de la conversaci&oacute;n')}
      <tr><td class="px" style="padding:12px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${timelineRows}</table></td></tr>`
    : '';

  const planBlock = (vtc.plan_gerente || []).length
    ? `${sectionTitle('Plan de acci&oacute;n para el gerente')}
      <tr><td class="px" style="padding:12px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${planRows}</table></td></tr>`
    : '';

  const notaBlock = vtc.nota_deep_learning
    ? `${sectionTitle('Nota deep learning')}
      <tr><td class="px" style="padding:14px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${GREEN_BG}" style="background-color:${GREEN_BG};border:1px solid ${GREEN};border-radius:6px;">
      <tr><td style="padding:14px 18px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:${GREEN};"><strong>&#129504; NOTA DEEP LEARNING:</strong>&nbsp; ${esc(vtc.nota_deep_learning)}</td></tr></table></td></tr>`
    : '';

  // La transcripción completa solo va en el PDF (para no inflar el email)
  const transcriptBlock = forPdf && vtc.transcript
    ? `${sectionTitle('Transcripci&oacute;n completa')}
      <tr><td class="px" style="padding:12px 32px 0 32px;"><div style="font-family:Arial,sans-serif;font-size:10px;line-height:1.6;white-space:pre-wrap;background:#f9f9f9;padding:12px;border-radius:4px;color:#333;">${esc(vtc.transcript)}</div></td></tr>`
    : '';

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
EMPLEADO N&ordm; ${esc(vtc.empleado_id)}</td></tr></table>
</td></tr>
<tr><td class="px" style="padding:26px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${DARK}" style="background-color:${DARK};border-radius:8px;">
<tr><td align="center" style="padding:26px 28px 8px 28px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:#999999;">DESEMPE&Ntilde;O GLOBAL</td></tr>
<tr><td align="center" style="padding:0 28px;"><span class="score-num" style="font-family:Arial,sans-serif;font-size:56px;font-weight:bold;color:${GOLD};line-height:1;">${seg}</span><span style="font-family:Arial,sans-serif;font-size:22px;color:#777777;">/10</span></td></tr>
<tr><td style="padding:18px 28px 28px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${gaugeCells}</tr></table></td></tr></table></td></tr>
${sectionTitle('Resumen de la llamada')}
<tr><td class="px" style="padding:12px 32px 0 32px;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#444444;">${esc(vtc.resumen)}</td></tr>
${sectionTitle('Mapa de competencias')}
<tr><td class="px" style="padding:14px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${compBars}</table></td></tr>
${timelineBlock}
${fortalezasBlock}
${mejorasBlock}
${objecionesBlock}
<tr><td class="px" style="padding:30px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${DARK}" style="background-color:${DARK};border-radius:8px;">
<tr><td align="center" style="padding:26px 28px 4px 28px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:${GOLD};">TU PR&Oacute;XIMO DRILL</td></tr>
<tr><td align="center" style="padding:8px 28px 4px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;">${esc(vtc.drill?.titulo)}</td></tr>
<tr><td align="center" style="padding:4px 28px 18px 28px;font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#bbbbbb;">${esc(vtc.drill?.descripcion)}</td></tr>
<tr><td align="center" style="padding:0 28px 28px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td bgcolor="${GOLD}" style="background-color:${GOLD};border-radius:4px;">
<a href="${esc(vtc.drill?.url || 'https://tracker.victor-ia.xyz')}" target="_blank" style="display:inline-block;padding:13px 34px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;color:${DARK};text-decoration:none;">ENTRENAR DE NUEVO&nbsp;&nbsp;&#8594;</a></td></tr></table></td></tr></table></td></tr>
${planBlock}
${notaBlock}
${transcriptBlock}
<tr><td style="padding:34px 32px 0 32px;"></td></tr>
<tr><td bgcolor="${DARK}" style="background-color:${DARK};padding:22px 32px;" align="center">
<div style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;color:${GOLD};">VICTORIOUS TRAVELERS CLUB</div>
<div style="font-family:Arial,sans-serif;font-size:10px;color:#777777;padding-top:8px;">Reporte generado autom&aacute;ticamente por V&iacute;ctor IA &middot; ${esc(vtc.timestamp)}</div></td></tr>
</table></td></tr></table></body></html>`;
}

// ---------------------------------------------------------------------------
// 4) PDF PROFESIONAL — Playwright/Chromium headless (base64)
//    Usa puppeteer-core + @sparticuz/chromium (estándar Vercel serverless).
//    Degrada con gracia: si Chromium no está disponible, retorna null.
// ---------------------------------------------------------------------------
async function generatePDFWithPlaywright(vtc) {
  const html = buildReportHtml(vtc, { forPdf: true });
  let browser;
  try {
    const [{ default: chromium }, puppeteer] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core')
    ]);

    const executablePath = await chromium.executablePath();
    browser = await (puppeteer.default || puppeteer).launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless ?? true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' }
    });
    await browser.close();
    browser = null;

    console.log(`[PDF] generado — ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
    return Buffer.from(pdfBuffer).toString('base64');
  } catch (e) {
    console.error('[PDF] no se pudo generar con Chromium:', e.message);
    if (browser) { try { await browser.close(); } catch {} }
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5) EMAIL CON ADJUNTOS — Resend (fallback: tracker API)
// ---------------------------------------------------------------------------
async function sendEmailWithAttachments({ to, cc, subject, html, attachments }) {
  // Resend directo
  if (RESEND_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Victor IA Training <info@victor-ia.com.mx>',
          to: [to], cc, subject, html,
          ...(attachments && attachments.length ? { attachments } : {})
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        console.log('[Email] enviado vía Resend:', data.id);
        return { via: 'resend', id: data.id || 'sent', status: 200 };
      }
      console.error('[Email] Resend falló:', resp.status, '— probando fallback tracker');
    } catch (e) {
      console.error('[Email] Resend exception:', e.message);
    }
  }

  // Fallback: tracker API
  try {
    const resp = await fetch(TRACKER_EMAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, cc, subject, html, attachments })
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok || data.ok) {
      console.log('[Email] enviado vía tracker:', data.id);
      return { via: 'tracker', id: data.id || 'sent', status: 200 };
    }
    console.error('[Email] tracker falló:', resp.status, data.error);
  } catch (e) {
    console.error('[Email] tracker exception:', e.message);
  }

  return { via: 'none', id: null, status: 500 };
}

// ---------------------------------------------------------------------------
// HANDLER — ejecución única y limpia
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  console.log('=== EMAIL-REPORT HANDLER ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const conversation_id = body.conversation_id || body.conversationId;

  if (!conversation_id) {
    console.error('[Handler] falta conversation_id');
    return res.status(400).json({ success: false, error: 'conversation_id es requerido' });
  }

  const user_name = body.user_name || 'Empleado VTC';
  const user_email = body.user_email || 'mesainteligentedemo@gmail.com';
  const empleado_id = body.empleado_id || 'VTC-AUTO-001';
  const timestampIso = body.timestamp || new Date().toISOString();

  try {
    console.log(`[Handler] conversation_id=${conversation_id} · empleado=${user_name}`);

    // 1 + 2) Transcript y audio de ElevenLabs (en paralelo)
    const [transcriptData, audioBase64] = await Promise.all([
      getTranscriptFromElevenLabs(conversation_id),
      getAudioFromElevenLabs(conversation_id)
    ]);

    // 3) Análisis IA (depende del transcript)
    const analysis = await analyzeTranscriptWithAI(transcriptData.text);

    // Duración: prioriza la del body, luego la de ElevenLabs
    const durSecs = Number(body.call_duration_secs || transcriptData.durationSecs || 0);
    const duracion_minutos = `${Math.floor(durSecs / 60)}:${String(Math.floor(durSecs % 60)).padStart(2, '0')}`;

    // Modelo de datos unificado para HTML/PDF
    const vtc = {
      user_name,
      empleado_id,
      duracion_minutos,
      tipo_sesion: body.tipo_sesion || 'Coaching',
      timestamp: new Date(timestampIso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
      transcript: transcriptData.text,
      ...analysis
    };

    // 4) PDF con Playwright/Chromium
    const pdfBase64 = await generatePDFWithPlaywright(vtc);

    // Email HTML (sin transcripción completa; esa va en el PDF)
    const emailHtml = buildReportHtml(vtc, { forPdf: false });

    // Adjuntos: PDF + audio MP3
    const dateSlug = new Date().toISOString().slice(0, 10);
    const safeId = String(empleado_id).replace(/[^\w-]/g, '');
    const attachments = [];
    if (pdfBase64) {
      attachments.push({ filename: `reporte-vtc-${safeId}-${dateSlug}.pdf`, content: pdfBase64 });
    }
    if (audioBase64) {
      attachments.push({ filename: `sesion-vtc-${safeId}-${dateSlug}.mp3`, content: audioBase64 });
    }

    // 5) Enviar email
    const emailResult = await sendEmailWithAttachments({
      to: user_email,
      cc: CC_LIST,
      subject: `Reporte VTC — ${user_name} · ${vtc.score_global}/10`,
      html: emailHtml,
      attachments
    });

    // Persistir en Supabase (best-effort, no bloquea)
    let dbSaved = false;
    if (supabase) {
      const { error: dbError } = await supabase
        .from('training_sessions')
        .insert({
          employee_name: user_name,
          employee_id: empleado_id,
          conversation_id,
          duration_minutes: durSecs ? durSecs / 60 : null,
          status: body.estado_final || 'completado',
          timestamp: timestampIso,
          transcript: transcriptData.text,
          score_global: vtc.score_global,
          email_sent: emailResult.status === 200
        });
      if (dbError) console.error('[DB] error:', dbError.message);
      else dbSaved = true;
    }

    if (emailResult.status !== 200) {
      return res.status(500).json({ success: false, error: 'Error enviando email', email_via: emailResult.via });
    }

    return res.status(200).json({
      success: true,
      message: 'Reporte real generado y enviado',
      conversation_id,
      score_global: vtc.score_global,
      transcript_turns: transcriptData.messages.length,
      pdf_attached: !!pdfBase64,
      audio_attached: !!audioBase64,
      email_via: emailResult.via,
      email_id: emailResult.id,
      db_saved: dbSaved
    });
  } catch (error) {
    console.error('[Handler] error fatal:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
