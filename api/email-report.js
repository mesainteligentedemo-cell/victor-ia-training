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

// Paleta del PDF (tema oscuro luxury — idéntico al referente VTC)
const PDF = {
  page: '#ececed',   // fondo de la hoja (gris claro)
  card: '#181818',   // tarjeta principal (negro)
  panel: '#1e1e1e',  // cajas internas (gris oscuro)
  panel2: '#1c1c22', // burbuja del asesor
  border: '#333333', // bordes sutiles
  gold: '#d4af37',   // oro
  txt: '#f2f2f2',    // texto principal
  muted: '#9a9a9a',  // texto secundario
  dim: '#6f6f6f',    // texto terciario
  green: '#5cc08a',  // verde suave (plan / aciertos)
  blue: '#8fa0c0'    // nombre del asesor
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clampScore = (n) => Math.min(Math.max(Math.round(Number(n) || 0), 0), 10);

const stripAccents = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
    score_global: 0,
    // Campos extendidos para el PDF (tema oscuro luxury)
    titular: '',
    escenario: '—',
    idioma: 'Español',
    sentimiento: 'Neutral',
    tono: 'analítico',
    principios_neuro: [],
    participacion: '—',
    analisis_pnl: '—',
    nota_bullets: [],
    comprension_general: 0
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
  "titular": "string (1 frase corta que resume el desempeño de la sesión)",
  "escenario": "string (descripción del escenario de roleplay que se practicó)",
  "idioma": "Español | Inglés",
  "sentimiento": "Positivo | Neutral | Negativo",
  "tono": "string (1 palabra: consultivo, analítico, agresivo, empático...)",
  "competencias": [{"nombre": "string", "score": 1-10, "feedback": "string breve"}],
  "principios_neuro": ["string (principios neurocientíficos/PNL activados; vacío si ninguno)"],
  "fortalezas": ["string"],
  "mejoras": ["string"],
  "objeciones": [{"objecion": "string", "manejo": "string"}],
  "analisis_pnl": "string (patrones de lenguaje/PNL detectados en el asesor)",
  "participacion": "string (1 frase sobre cómo participó el asesor)",
  "plan_gerente": ["string (acciones concretas para el gerente)"],
  "timeline": [{"t": "M:SS", "texto": "string (momento clave)"}],
  "drill": {"titulo": "string", "descripcion": "string"},
  "nota_deep_learning": "string (1 insight de aprendizaje)",
  "nota_bullets": ["string (mejoras concretas para el coach Víctor)"],
  "comprension_general": 1-10,
  "score_global": 1-10
}

Reglas:
- Las competencias DEBEN mapear a estos 6 ejes del radar: "Rapport", "PNL", "Postura", "Objeciones", "Cierre", "Leer la sala". Usa exactamente esos nombres.
- score, comprension_general y score_global son enteros de 1 a 10.
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
      score_global: clampScore(parsed.score_global),
      // Campos extendidos para el PDF
      titular: parsed.titular || '',
      escenario: parsed.escenario || base.escenario,
      idioma: parsed.idioma || base.idioma,
      sentimiento: parsed.sentimiento || base.sentimiento,
      tono: parsed.tono || base.tono,
      principios_neuro: Array.isArray(parsed.principios_neuro) ? parsed.principios_neuro.filter(Boolean) : [],
      participacion: parsed.participacion || base.participacion,
      analisis_pnl: parsed.analisis_pnl || base.analisis_pnl,
      nota_bullets: Array.isArray(parsed.nota_bullets) ? parsed.nota_bullets.filter(Boolean) : [],
      comprension_general: clampScore(parsed.comprension_general)
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
// GRÁFICO RADIAL (SVG puro generado por JS) — Mapa de competencias hexagonal
// 6 ejes fijos: Rapport · Postura · Objeciones · Leer la sala · Cierre · PNL
// ---------------------------------------------------------------------------
function radarSVG(vtc) {
  const axes = ['Rapport', 'Postura', 'Objeciones', 'Leer la sala', 'Cierre', 'PNL'];

  // Mapeo difuso desde las competencias del análisis IA -> eje del radar
  const scoreFor = (label) => {
    const key = stripAccents(label);
    let best = 0;
    for (const c of (vtc.competencias || [])) {
      const n = stripAccents(c.nombre);
      const hit =
        (key === 'rapport' && n.includes('rapport')) ||
        (key === 'postura' && (n.includes('postura') || n.includes('lenguaje corporal'))) ||
        (key === 'objeciones' && n.includes('objec')) ||
        (key === 'leer la sala' && (n.includes('leer') || n.includes('sala') || n.includes('escucha'))) ||
        (key === 'cierre' && n.includes('cierre')) ||
        (key === 'pnl' && n.includes('pnl'));
      if (hit) best = Math.max(best, clampScore(c.score));
    }
    return best;
  };

  const W = 440, H = 380, cx = 220, cy = 190, R = 130, N = 6, levels = 4;
  const ang = (i) => (-90 + i * 60) * Math.PI / 180;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = (r) => Array.from({ length: N }, (_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');

  // Anillos concéntricos (hexágonos)
  let rings = '';
  for (let l = 1; l <= levels; l++) rings += `<polygon points="${poly(R * l / levels)}" fill="none" stroke="${PDF.border}" stroke-width="1"/>`;

  // Radios (spokes)
  let spokes = '';
  for (let i = 0; i < N; i++) { const [x, y] = pt(i, R); spokes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2a2a2a" stroke-width="1"/>`; }

  // Polígono de datos
  const vals = axes.map(scoreFor);
  const hasData = vals.some((v) => v > 0);
  let data = '';
  if (hasData) {
    const pts = vals.map((v, i) => pt(i, R * v / 10).map((n) => n.toFixed(1)).join(',')).join(' ');
    data = `<polygon points="${pts}" fill="rgba(212,175,55,0.18)" stroke="${PDF.gold}" stroke-width="2"/>` +
      vals.map((v, i) => { const [x, y] = pt(i, R * v / 10); return v > 0 ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${PDF.gold}"/>` : ''; }).join('');
  }

  // Punto central dorado
  const center = `<circle cx="${cx}" cy="${cy}" r="4" fill="${PDF.gold}"/>`;

  // Etiquetas de ejes
  const labelR = R + 24;
  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, labelR);
    const c = Math.cos(ang(i));
    const anchor = c > 0.3 ? 'start' : (c < -0.3 ? 'end' : 'middle');
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="13" fill="#b9b9b9">${a}</text>`;
  }).join('');

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de competencias" style="max-width:100%;">${rings}${spokes}${data}${center}${labels}</svg>`;
}

// ---------------------------------------------------------------------------
// HTML DEL PDF — tema oscuro luxury (idéntico al referente VTC, 4-5 páginas)
// ---------------------------------------------------------------------------
function buildPdfReportHtml(vtc) {
  const P = PDF;
  const seg = clampScore(vtc.score_global);
  const comp = clampScore(vtc.comprension_general ?? vtc.score_global);
  const fmtTime = (s) => { const n = Math.max(0, Math.floor(Number(s) || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
  const dash = (v) => (v && String(v).trim() && String(v).trim() !== '—') ? esc(v) : '—';

  const headline = vtc.titular?.trim()
    || (vtc.resumen ? String(vtc.resumen).split(/(?<=[.!?])\s+/)[0] : '');

  // ---- Metadata inline (4 celdas) ----
  const metaCells = [
    { v: vtc.duracion_minutos || '0:00', k: 'TIEMPO HABLADO', gold: true },
    { v: vtc.idioma || 'Español', k: 'IDIOMA' },
    { v: vtc.sentimiento || 'Neutral', k: 'SENTIMIENTO' },
    { v: String(vtc.intervenciones ?? 0), k: 'INTERVENCIONES' }
  ].map((m) => `<div class="mbox"><div class="mv${m.gold ? ' gold' : ''}">${esc(m.v)}</div><div class="mk">${m.k}</div></div>`).join('');

  // ---- Timeline ----
  const timeline = (vtc.timeline || []).length
    ? (vtc.timeline || []).map((t) => `<div class="tl-row"><div class="tl-t">${esc(t.t || '0:00')}</div><div class="tl-x">${esc(t.texto || '')}</div></div>`).join('')
    : `<div class="tl-row"><div class="tl-t">—</div><div class="tl-x">Sin momentos clave registrados.</div></div>`;

  // ---- Listas de accent ----
  const bullets = (arr) => (arr && arr.length)
    ? `<ul class="b">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    : `<div class="dash-sm">—</div>`;

  // ---- Principios neuro ----
  const principios = (vtc.principios_neuro || []).length
    ? `<ul class="b">${vtc.principios_neuro.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    : `<p class="p">No registrado en esta sesión.</p>`;

  // ---- Objeciones ----
  const objeciones = (vtc.objeciones || []).length
    ? (vtc.objeciones || []).map((o) => `<p class="p"><b class="q">&ldquo;${esc(o.objecion)}&rdquo;</b><br><span class="muted">${esc(o.manejo)}</span></p>`).join('')
    : `<div class="dash-sm">—</div>`;

  // ---- Plan del gerente ----
  const plan = (vtc.plan_gerente || []).length
    ? `<ol class="ol">${vtc.plan_gerente.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`
    : `<div class="dash-sm">—</div>`;

  // ---- Nota deep learning (bullets) ----
  const notaSrc = (vtc.nota_bullets && vtc.nota_bullets.length)
    ? vtc.nota_bullets
    : (vtc.nota_deep_learning ? [vtc.nota_deep_learning] : []);
  const nota = notaSrc.length
    ? notaSrc.map((n, i) => `<p class="nb${i === 0 ? ' green' : ''}">${esc(n)}</p>`).join('')
    : `<div class="dash-sm">—</div>`;

  // ---- Transcripción (burbujas de chat) ----
  const bubbles = (vtc.messages || []).length
    ? (vtc.messages || []).map((m) => {
        const isUser = m.role === 'user';
        const name = isUser ? 'ASESOR' : 'VÍCTOR';
        return `<div class="brow ${isUser ? 'right' : 'left'}"><div class="bub ${isUser ? 'user' : 'agent'}">
          <div class="bh"><span class="bn ${isUser ? 'user' : 'agent'}">${name}</span><span class="bt">${fmtTime(m.time)}</span></div>
          <div class="bm">${esc(m.message)}</div></div></div>`;
      }).join('')
    : `<p class="p muted">Transcripción no disponible.</p>`;

  const drillUrl = esc(vtc.drill?.url || 'https://tracker.victor-ia.xyz');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html { margin: 0; padding: 0; background: ${P.page}; }
  body { margin: 0; padding: 22px; background: ${P.page}; font-family: Arial, Helvetica, sans-serif; }
  .card { background: ${P.card}; border-radius: 16px; overflow: hidden; color: ${P.txt}; }
  .pad { padding: 30px 34px; }

  /* Header */
  .brandline { display: flex; align-items: baseline; gap: 12px; }
  .brand { font-size: 13px; font-weight: bold; letter-spacing: 3px; color: ${P.gold}; }
  .date { font-size: 12px; letter-spacing: 2px; color: #b79b52; }
  h1 { font-size: 40px; font-weight: 400; margin: 10px 0 6px; color: ${P.txt}; letter-spacing: -0.5px; }
  .sub { font-size: 15px; color: ${P.muted}; }
  .sub b { color: ${P.txt}; font-weight: bold; }
  .badges { margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; }
  .badge { font-size: 11px; font-weight: bold; letter-spacing: 1.5px; color: ${P.muted}; border: 1px solid #444; border-radius: 8px; padding: 7px 14px; }
  .badge.gold { color: ${P.gold}; border-color: ${P.gold}; }
  .rule { border: 0; border-top: 1px solid #2b2b2b; margin: 0 34px; }

  /* Score */
  .score { text-align: center; padding: 26px 34px 6px; }
  .klabel { font-size: 12px; font-weight: bold; letter-spacing: 3px; color: ${P.muted}; text-transform: uppercase; }
  .bignum { line-height: 1; margin: 8px 0 14px; }
  .bignum .n { font-size: 118px; font-weight: bold; color: ${P.gold}; }
  .bignum .slash { font-size: 40px; font-weight: bold; color: ${P.gold}; }
  .headline { font-size: 15px; color: ${P.muted}; max-width: 560px; margin: 0 auto; line-height: 1.5; }

  /* Cajas */
  .box { background: ${P.panel}; border: 1px solid ${P.border}; border-radius: 12px; padding: 18px 20px; }
  .box-t { font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
  .box-t.gold { color: ${P.gold}; }
  .box-t.green { color: ${P.green}; }
  .box-t.muted { color: ${P.muted}; }
  .p { font-size: 14px; line-height: 1.6; color: #d9d9d9; margin: 0 0 8px; }
  .p:last-child { margin-bottom: 0; }
  .p.muted, .muted { color: ${P.muted}; }
  .lead { font-size: 17px; line-height: 1.4; color: ${P.txt}; margin: 4px 0 10px; }
  .foot { font-size: 12px; color: ${P.dim}; }
  .dash { font-size: 26px; color: ${P.txt}; margin: 2px 0 6px; }
  .dash-sm { font-size: 18px; color: ${P.muted}; }

  .cols { display: flex; gap: 14px; }
  .cols > .box { flex: 1; }

  .meta { display: flex; gap: 12px; margin-top: 18px; }
  .mbox { flex: 1; border: 1px solid ${P.border}; border-radius: 10px; padding: 14px 10px; text-align: center; }
  .mv { font-size: 22px; color: ${P.txt}; }
  .mv.gold { color: ${P.gold}; }
  .mk { font-size: 10px; letter-spacing: 1.5px; color: ${P.dim}; margin-top: 4px; }

  .sect-c { text-align: center; font-size: 13px; font-weight: bold; letter-spacing: 3px; color: ${P.muted}; text-transform: uppercase; margin: 30px 0 4px; }
  .radar { text-align: center; padding: 10px 0 6px; }
  .klabel2 { font-size: 12px; font-weight: bold; letter-spacing: 2.5px; color: ${P.muted}; text-transform: uppercase; margin: 24px 0 8px; }

  /* Timeline */
  .tl-row { display: flex; gap: 16px; padding: 6px 0; }
  .tl-t { color: ${P.gold}; font-size: 13px; font-weight: bold; width: 52px; flex: none; }
  .tl-x { font-size: 14px; line-height: 1.5; color: #d9d9d9; border-left: 2px solid #2f2f2f; padding-left: 16px; flex: 1; }

  /* Accents */
  .accent { border-left: 3px solid #444; padding: 4px 0 4px 18px; margin: 18px 0; }
  .accent.green { border-color: ${P.green}; }
  .accent.gold { border-color: ${P.gold}; }
  .accent.gray { border-color: #555; }
  .acc-t { font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .acc-t.green { color: ${P.green}; }
  .acc-t.gold { color: ${P.gold}; }
  .acc-t.muted { color: ${P.muted}; }
  ul.b { margin: 0; padding-left: 18px; }
  ul.b li { font-size: 14px; line-height: 1.6; color: #d9d9d9; margin-bottom: 4px; }
  ol.ol { margin: 6px 0 0; padding-left: 22px; }
  ol.ol li { font-size: 14px; line-height: 1.6; color: #d9d9d9; margin-bottom: 8px; padding-left: 4px; }
  ol.ol li::marker { color: ${P.gold}; font-weight: bold; }
  .q { color: ${P.txt}; }

  /* Drill */
  .btn-outline { display: inline-block; margin-top: 6px; border: 1px solid ${P.gold}; color: ${P.gold}; font-size: 12px; font-weight: bold; letter-spacing: 2px; padding: 12px 26px; border-radius: 24px; text-decoration: none; }
  .btn-gold { display: inline-block; margin-top: 6px; background: ${P.gold}; color: #1a1a1a; font-size: 12px; font-weight: bold; letter-spacing: 2px; padding: 13px 26px; border-radius: 24px; text-decoration: none; }

  /* Aprendizaje */
  .learn-h { display: flex; align-items: center; gap: 12px; margin: 24px 0 8px; }
  .pill { font-size: 10px; font-weight: bold; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 12px; }
  .pill.green { background: rgba(92,192,138,0.15); color: ${P.green}; border: 1px solid ${P.green}; }
  .comp { font-size: 15px; color: ${P.txt}; margin: 6px 0 4px; }
  .comp .gold { color: ${P.gold}; font-weight: bold; font-size: 20px; }
  .nb { font-size: 13px; line-height: 1.55; color: #cfcfcf; margin: 0 0 8px; padding-left: 14px; position: relative; }
  .nb::before { content: "•"; position: absolute; left: 0; color: ${P.muted}; }
  .nb.green { color: ${P.green}; }

  /* Transcript */
  .brow { display: flex; margin: 10px 0; }
  .brow.right { justify-content: flex-end; }
  .bub { max-width: 78%; border-radius: 12px; padding: 12px 16px; }
  .bub.agent { background: ${P.panel}; border: 1px solid ${P.border}; }
  .bub.user { background: ${P.panel2}; border: 1px solid #33384a; }
  .bh { margin-bottom: 5px; }
  .bn { font-size: 12px; font-weight: bold; letter-spacing: 2px; }
  .bn.agent { color: ${P.gold}; }
  .bn.user { color: ${P.blue}; }
  .bt { font-size: 11px; color: ${P.dim}; margin-left: 8px; }
  .bm { font-size: 14px; line-height: 1.55; color: ${P.txt}; }
  .tbtns { display: flex; gap: 14px; margin-top: 20px; }

  /* Footer */
  .ftr { display: flex; justify-content: space-between; align-items: flex-end; padding: 20px 34px 26px; }
  .ftr .l { font-size: 13px; color: ${P.muted}; line-height: 1.6; }
  .ftr .l b { color: ${P.txt}; }
  .ftr .l .gold { color: ${P.gold}; }
  .ftr .r { font-size: 12px; color: ${P.dim}; }
  .pagefoot { text-align: center; font-size: 12px; color: #9a9a9a; padding: 16px 0 6px; }

  /* Documento continuo — sin cortes de página (flujo único tipo scroll) */
  .avoid { }
  .pb { }
</style></head>
<body>
<div class="card">
  <!-- HEADER -->
  <div class="pad">
    <div class="brandline"><span class="brand">VICTORIOUS TRAVELERS CLUB</span><span class="date">${esc(vtc.fecha_corta || vtc.timestamp || '')}</span></div>
    <h1>Reporte de entrenamiento</h1>
    <div class="sub">Sesi&oacute;n de <b>${esc(vtc.user_name)}</b> con V&iacute;ctor &middot; ${esc(vtc.tipo_sesion || 'Sesi&oacute;n')} &middot; ${esc(vtc.duracion_minutos)} min</div>
    <div class="badges"><span class="badge gold">EMPLEADO N&ordm; ${esc(vtc.empleado_id)}</span><span class="badge">DIRECCI&Oacute;N</span><span class="badge">&mdash;</span></div>
  </div>
  <hr class="rule">

  <!-- SCORE -->
  <div class="score">
    <div class="klabel">Desempe&ntilde;o global</div>
    <div class="bignum"><span class="n">${seg}</span><span class="slash">/10</span></div>
    ${headline ? `<div class="headline">${esc(headline)}</div>` : ''}
  </div>

  <div class="pad" style="padding-top:20px">
    <!-- RESUMEN -->
    <div class="box avoid"><div class="box-t gold">Resumen de la llamada</div><p class="p">${esc(vtc.resumen)}</p></div>

    <!-- 2 COLUMNAS -->
    <div class="cols" style="margin-top:16px">
      <div class="box avoid"><div class="box-t muted">Escenario</div><div class="lead">${dash(vtc.escenario)}</div><div class="foot">${esc(vtc.tono || 'anal&iacute;tico')} &middot; ${esc(vtc.idioma || 'Espa&ntilde;ol')}</div></div>
      <div class="box avoid"><div class="box-t muted">M&oacute;dulos practicados</div><div class="dash">&mdash;</div><div class="foot">${esc(vtc.tipo_sesion || 'Sesi&oacute;n')}</div></div>
    </div>

    <!-- METADATA -->
    <div class="meta">${metaCells}</div>

    <!-- MAPA DE COMPETENCIAS -->
    <div class="sect-c">Mapa de competencias</div>
    <div class="radar avoid">${radarSVG(vtc)}</div>

    <!-- PRINCIPIOS NEURO -->
    <div class="klabel2">Principios neurocient&iacute;ficos activados</div>
    ${principios}

    <!-- TIMELINE -->
    <div class="klabel2">L&iacute;nea de la conversaci&oacute;n</div>
    <div class="avoid">${timeline}</div>

    <!-- ACIERTOS -->
    <div class="accent green avoid"><div class="acc-t green">Lo que hiciste bien</div>${bullets(vtc.fortalezas)}</div>
    <!-- MEJORAS -->
    <div class="accent gold avoid"><div class="acc-t gold">A mejorar</div>${bullets(vtc.mejoras)}</div>
    <!-- OBJECIONES -->
    <div class="accent gray avoid"><div class="acc-t muted">Objeciones que enfrentaste</div>${objeciones}</div>

    <!-- ANÁLISIS PNL -->
    <div class="box avoid" style="margin-top:18px"><div class="box-t gold">An&aacute;lisis PNL</div><p class="p">${dash(vtc.analisis_pnl)}</p></div>

    <!-- DRILL -->
    <div class="box avoid" style="margin-top:22px"><div class="box-t gold">Tu pr&oacute;ximo drill</div>
      <div class="lead">${esc(vtc.drill?.descripcion || vtc.drill?.titulo || '')}</div>
      <a class="btn-outline" href="${drillUrl}">ENTRENAR DE NUEVO</a>
    </div>

    <!-- PLAN GERENTE -->
    <div class="box avoid" style="margin-top:18px"><div class="box-t green">Plan de acci&oacute;n &middot; para el gerente</div>
      <div class="foot" style="margin-bottom:6px">Pasos concretos para llevar a este asesor a la excelencia.</div>${plan}</div>

    <!-- APRENDIZAJE -->
    <div class="learn-h"><span class="klabel2" style="margin:0">An&aacute;lisis del aprendizaje</span><span class="pill green">CONSULTA</span></div>
    <div class="comp">Comprensi&oacute;n general <span class="gold">${comp}/10</span></div>
    <div class="klabel2">Participaci&oacute;n</div>
    <p class="p">${dash(vtc.participacion)}</p>
    <div class="box avoid" style="margin-top:12px"><div class="box-t muted">Nota deep learning &mdash; mejoras para V&iacute;ctor</div>${nota}</div>

    <!-- ACTIVIDAD -->
    <div class="klabel2">Actividad de la sesi&oacute;n</div>
    <div class="foot" style="margin-bottom:8px">Lo que Victor hizo paso a paso durante la sesi&oacute;n.</div>
    <p class="p">${(vtc.timeline || []).length ? esc((vtc.timeline || []).map((t) => t.texto).join(' ')) : 'Sesi&oacute;n de conversaci&oacute;n libre (sin recorrido de m&oacute;dulos).'}</p>

    <!-- TRANSCRIPCIÓN -->
    <div class="klabel2">Transcripci&oacute;n completa</div>
    <div class="foot" style="margin-bottom:10px">Conversaci&oacute;n palabra por palabra entre V&iacute;ctor y el asesor.</div>
    <div class="chat">${bubbles}</div>

    <div class="tbtns">
      <a class="btn-outline" href="${drillUrl}">ESCUCHAR CONVERSACI&Oacute;N</a>
      <a class="btn-gold" href="${drillUrl}">VOLVER A ENTRENAR</a>
    </div>
  </div>

  <hr class="rule">
  <div class="ftr">
    <div class="l"><b>V&Iacute;CTOR</b> &middot; Coach de IA del piso<br>Generado por <span class="gold">Victor IA</span></div>
    <div class="r">Sesi&oacute;n ${esc(vtc.conversation_id || '')}</div>
  </div>
</div>
<div class="pagefoot">Este reporte es interno del equipo VTC.</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// 4) PDF PROFESIONAL — Playwright/Chromium headless (base64)
//    Usa puppeteer-core + @sparticuz/chromium (estándar Vercel serverless).
//    Degrada con gracia: si Chromium no está disponible, retorna null.
// ---------------------------------------------------------------------------
async function generatePDFWithPlaywright(vtc) {
  const html = buildPdfReportHtml(vtc);
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
    await page.emulateMediaType('screen');

    // Documento continuo: una sola página larga (scroll continuo, sin cortes).
    // Medimos el alto real del contenido y emitimos un PDF de una sola página
    // con esa altura exacta, en vez de paginar en tamaño Letter.
    const contentPx = await page.evaluate(() => {
      const b = document.body, e = document.documentElement;
      return Math.ceil(Math.max(
        b.scrollHeight, b.offsetHeight,
        e.scrollHeight, e.offsetHeight, e.clientHeight
      ));
    });
    const PAGE_WIDTH_PX = 816;          // ~8.5in @ 96dpi (ancho tipo Letter)
    const heightPx = Math.max(contentPx + 4, 100); // el padding del body ya da respiro

    const pdfBuffer = await page.pdf({
      width: `${PAGE_WIDTH_PX}px`,
      height: `${heightPx}px`,
      printBackground: true,
      pageRanges: '1',
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
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
      tipo_sesion: body.tipo_sesion || 'Sesión',
      timestamp: new Date(timestampIso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
      fecha_corta: new Date(timestampIso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
      transcript: transcriptData.text,
      messages: transcriptData.messages,
      intervenciones: transcriptData.messages.length,
      conversation_id,
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
