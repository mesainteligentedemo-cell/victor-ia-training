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
// VALIDACIÓN DE REPORTE COMPLETO
// Garantiza que ningún reporte se envíe con campos críticos vacíos.
//   · CRÍTICOS  -> bloquean el envío (HTTP 400) si faltan.
//   · RECOMENDADOS -> se advierten en la respuesta, pero no bloquean.
// ---------------------------------------------------------------------------
function isEmptyValue(v) {
  if (v === undefined || v === null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'number') return Number.isNaN(v);
  return false;
}

function validateReport(vtc) {
  // Sin estos campos el reporte carece de sentido -> bloquean el envío.
  const critical = {
    user_name: vtc.user_name,
    empleado_id: vtc.empleado_id,
    duracion_minutos: vtc.duracion_minutos,
    transcript: vtc.transcript,
    competencias: vtc.competencias
  };
  // Ideales para un reporte "sin omisiones"; si faltan se advierte pero se envía.
  const recommended = {
    score_global: vtc.score_global,
    resumen: vtc.resumen,
    fortalezas: vtc.fortalezas,
    mejoras: vtc.mejoras,
    objeciones: vtc.objeciones,
    analisis_pnl: vtc.analisis_pnl,
    plan_gerente: vtc.plan_gerente,
    principios_neuro: vtc.principios_neuro
  };

  const missing_fields = Object.keys(critical).filter((k) => isEmptyValue(critical[k]));
  const warnings = Object.keys(recommended).filter((k) => isEmptyValue(recommended[k]));

  return {
    valid: missing_fields.length === 0,
    missing_fields,
    warnings,
    fields_verified: Object.keys(critical).length + Object.keys(recommended).length,
    all_fields_present: missing_fields.length === 0 && warnings.length === 0,
    error: missing_fields.length
      ? `Campos críticos faltantes: ${missing_fields.join(', ')}`
      : null
  };
}

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

// ===========================================================================
//  NUEVA PALETA + TIPOGRAFÍA (reporte rediseñado)
//  Crema #F5F5F0 · Tinta #070708 · Oro #B89A6A · Verde/Amarillo/Rojo · líneas
// ===========================================================================
const C = {
  bg: '#F5F5F0', ink: '#070708', body: '#2A2824', gold: '#B89A6A', goldDark: '#8B7250',
  green: '#27AE60', yellow: '#F39C12', red: '#C0392B', line: '#D4D4D0',
  headBg: '#0F0F12', rowA: '#F5F5F0', rowB: '#EFEFEA'
};
const FONT_MONO = "'IBM Plex Mono','Courier New',monospace";
const FONT_HEAD = "'Cormorant Garamond','Times New Roman',serif";
const FONT_BODY = "'Inter','Helvetica Neue',Arial,sans-serif";
const FONTS_LINK = '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;700&family=IBM+Plex+Mono:wght@400&family=Inter:wght@300;400&display=swap" rel="stylesheet">';

// Banda de color según score 0-10 (gris si sin dato)
const bandColor = (score) => {
  const s = Number(score) || 0;
  if (s <= 0) return C.line;
  if (s <= 3) return C.red;
  if (s <= 6) return C.yellow;
  return C.green;
};
// Banda de color según porcentaje 0-100 (para gauges neuro)
const bandColorPct = (v) => {
  const n = Number(v) || 0;
  if (n >= 60) return C.green;
  if (n >= 30) return C.yellow;
  return C.red;
};

const compAvg = (arr) => (arr && arr.length)
  ? arr.reduce((a, c) => a + clampScore(c.score), 0) / arr.length : 0;

const parseDurMin = (s) => {
  const m = /(\d+):(\d{1,2})/.exec(String(s || ''));
  return m ? Number(m[1]) + Number(m[2]) / 60 : (Number(s) || 0);
};

// ---------------------------------------------------------------------------
// GRÁFICO A — HEATMAP DE COMPETENCIAS (barras segmentadas por color)
// ---------------------------------------------------------------------------
function heatmapSVG(competencias) {
  const rows = (competencias || []).filter((c) => c && c.nombre).slice(0, 8);
  if (!rows.length) return '';
  const padL = 150, cw = 24, gap = 5, rh = 30, top = 12;
  const W = padL + 10 * (cw + gap) + 52, H = top + rows.length * rh + 8;
  let g = '';
  rows.forEach((c, r) => {
    const sc = clampScore(c.score), y = top + r * rh;
    g += `<text x="0" y="${y + 15}" font-family="${FONT_MONO}" font-size="12" fill="${C.ink}">${esc(String(c.nombre).slice(0, 20))}</text>`;
    for (let i = 0; i < 10; i++) {
      const x = padL + i * (cw + gap);
      g += `<rect x="${x}" y="${y}" width="${cw}" height="20" rx="3" fill="${i < sc ? bandColor(sc) : C.line}"/>`;
    }
    g += `<text x="${padL + 10 * (cw + gap) + 8}" y="${y + 15}" font-family="${FONT_MONO}" font-size="12" font-weight="bold" fill="${C.gold}">${sc}/10</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Heatmap de competencias" style="max-width:100%;height:auto;">${g}</svg>`;
}

// ---------------------------------------------------------------------------
// GRÁFICO B — SPARKLINE HISTÓRICO (línea + puntos, últimas 5 sesiones)
// history: [{pct, score, date}] más reciente primero
// ---------------------------------------------------------------------------
function sparklineSVG(history) {
  const W = 400, H = 150, padL = 36, padR = 16, padT = 16, padB = 26;
  const data = (history || []).slice(0, 5).reverse(); // viejo -> nuevo
  const bg = `<rect x="0" y="0" width="${W}" height="${H}" fill="none"/>`;
  if (!data.length) {
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Histórico" style="max-width:100%;height:auto;">${bg}
      <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="${FONT_BODY}" font-size="14" fill="${C.body}">Primera sesión, sin histórico</text></svg>`;
  }
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const xOf = (i) => data.length === 1 ? padL + plotW / 2 : padL + (i / (data.length - 1)) * plotW;
  const yOf = (v) => padT + (1 - Math.max(0, Math.min(100, v)) / 100) * plotH;
  let grid = '';
  for (let k = 0; k <= 4; k++) {
    const yy = padT + (k / 4) * plotH, val = 100 - k * 25;
    grid += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="${C.line}" stroke-width="1"/>`;
    grid += `<text x="${padL - 6}" y="${yy + 4}" text-anchor="end" font-family="${FONT_MONO}" font-size="9" fill="${C.body}">${val}</text>`;
  }
  const pts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.pct).toFixed(1)}`).join(' ');
  const line = data.length > 1 ? `<polyline points="${pts}" fill="none" stroke="${C.gold}" stroke-width="2.5"/>` : '';
  const dots = data.map((d, i) => `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(d.pct).toFixed(1)}" r="4" fill="${C.green}"/>`).join('');
  const xlabels = data.map((d, i) => `<text x="${xOf(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-family="${FONT_MONO}" font-size="9" fill="${C.body}">S${i + 1}</text>`).join('');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkline histórico" style="max-width:100%;height:auto;">${bg}${grid}${line}${dots}${xlabels}</svg>`;
}

// ---------------------------------------------------------------------------
// GRÁFICO C — GAUGES NEUROCIENCIA (4 semicírculos con aguja)
// neuro: {dopamina, cortisol, oxitocina, amigdala} 0-100
// ---------------------------------------------------------------------------
function gaugesSVG(neuro) {
  const items = [
    ['Dopamina', neuro.dopamina], ['Cortisol', neuro.cortisol],
    ['Oxitocina', neuro.oxitocina], ['Amígdala', neuro.amigdala]
  ];
  const gw = 200, W = 800, H = 300, cy = 150, r = 74;
  let g = '';
  items.forEach(([name, valRaw], idx) => {
    const val = Math.max(0, Math.min(100, Math.round(Number(valRaw) || 0)));
    const cx = idx * gw + gw / 2;
    // arco de fondo (semicírculo 180°)
    const arc = (col, frac, wdt) => {
      const a0 = Math.PI, a1 = Math.PI - frac * Math.PI;
      const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
      const large = frac > 0.5 ? 1 : 0;
      return `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round"/>`;
    };
    g += arc(C.line, 1, 16);
    g += arc(bandColorPct(val), val / 100, 16);
    // aguja
    const na = Math.PI - (val / 100) * Math.PI;
    const nx = cx + (r - 8) * Math.cos(na), ny = cy - (r - 8) * Math.sin(na);
    g += `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${C.ink}" stroke-width="3"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="6" fill="${C.ink}"/>`;
    g += `<text x="${cx}" y="${cy + 34}" text-anchor="middle" font-family="${FONT_MONO}" font-size="22" font-weight="bold" fill="${bandColorPct(val)}">${val}%</text>`;
    g += `<text x="${cx}" y="${cy + 58}" text-anchor="middle" font-family="${FONT_BODY}" font-size="14" fill="${C.body}">${name}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gauges de neurociencia" style="max-width:100%;height:auto;">${g}</svg>`;
}

// ---------------------------------------------------------------------------
// GRÁFICO D — TIMELINE VISUAL (puntos de color en línea, máx 10 hitos)
// ---------------------------------------------------------------------------
function timelineVizSVG(timeline) {
  const items = (timeline || []).slice(0, 10);
  const W = 800, H = 100, y = 46, padL = 24, padR = 24;
  const classify = (t) => {
    const s = stripAccents(t);
    if (/objec|dificult|error|fall|dud|no |confus/.test(s)) return C.red;
    if (/ok|bien|logr|cierre|exito|acuerdo|avanz|correct/.test(s)) return C.green;
    return C.yellow;
  };
  let g = `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${C.line}" stroke-width="2"/>`;
  if (!items.length) {
    g += `<text x="${W / 2}" y="${y + 30}" text-anchor="middle" font-family="${FONT_BODY}" font-size="13" fill="${C.body}">Sin hitos registrados</text>`;
  } else {
    const span = (W - padL - padR);
    items.forEach((it, i) => {
      const x = items.length === 1 ? padL + span / 2 : padL + (i / (items.length - 1)) * span;
      const col = classify(it.texto || '');
      const up = i % 2 === 0;
      g += `<circle cx="${x.toFixed(1)}" cy="${y}" r="7" fill="${col}"/>`;
      const ly = up ? y - 16 : y + 26;
      const label = `${esc(it.t || '0:00')} ${esc(String(it.texto || '').slice(0, 22))}`;
      g += `<text x="${x.toFixed(1)}" y="${ly}" text-anchor="middle" font-family="${FONT_MONO}" font-size="9" fill="${C.body}">${label}</text>`;
    });
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Línea de tiempo" style="max-width:100%;height:auto;">${g}</svg>`;
}

// ---------------------------------------------------------------------------
// GRÁFICO E — INDICADORES DE TENDENCIA (↑↓ con % mejora)
// ---------------------------------------------------------------------------
function trendIndicatorsHtml(vtc, history) {
  const prev = (history && history.length) ? history[0] : null;
  const items = [];
  // Duración
  const curMin = parseDurMin(vtc.duracion_minutos);
  if (prev && prev.duration_min > 0) {
    const pct = ((curMin - prev.duration_min) / prev.duration_min) * 100;
    items.push({ label: 'Duración', val: `${vtc.duracion_minutos} min`, delta: pct });
  } else {
    items.push({ label: 'Duración', val: `${vtc.duracion_minutos} min`, delta: null });
  }
  // Competencias
  const curAvg = compAvg(vtc.competencias);
  if (prev && prev.score > 0) {
    items.push({ label: 'Competencias', val: `${curAvg.toFixed(1)}/10`, delta: curAvg - prev.score, abs: true });
  } else {
    items.push({ label: 'Competencias', val: `${curAvg.toFixed(1)}/10`, delta: null });
  }
  // Sentimiento
  const sentText = prev
    ? `${esc(vtc.sentimiento || 'Neutral')} (vs ${esc(prev.sentiment || 'Neutral')})`
    : `${esc(vtc.sentimiento || 'Neutral')}`;
  const sentUp = stripAccents(vtc.sentimiento || '').includes('positiv');
  items.push({ label: 'Sentimiento', val: sentText, delta: sentUp ? 1 : 0, sentiment: true });

  const cell = (it) => {
    let color = C.body, arrow = '→', txt = 'sin cambio';
    if (it.delta === null) { arrow = ''; txt = 'primera sesión'; color = C.body; }
    else if (it.delta > 0.01) { color = C.green; arrow = '↑'; txt = it.sentiment ? 'mejora' : (it.abs ? `+${it.delta.toFixed(1)}` : `+${it.delta.toFixed(1)}%`); }
    else if (it.delta < -0.01) { color = C.red; arrow = '↓'; txt = it.abs ? `${it.delta.toFixed(1)}` : `${it.delta.toFixed(1)}%`; }
    return `<td width="33%" valign="top" style="padding:14px 12px;border:1px solid ${C.line};background:#ffffff;">
      <div style="font-family:${FONT_MONO};font-size:10px;letter-spacing:1px;color:${C.body};text-transform:uppercase;">${it.label}</div>
      <div style="font-family:${FONT_HEAD};font-size:20px;color:${C.ink};padding:4px 0;">${it.val}</div>
      <div style="font-family:${FONT_MONO};font-size:12px;font-weight:bold;color:${color};">${arrow} ${txt}</div></td>`;
  };
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${items.map(cell).join('<td width="8">&nbsp;</td>')}</tr></table>`;
}

// ---------------------------------------------------------------------------
// getNextModule — determina el próximo módulo según escenario + competencias
// ---------------------------------------------------------------------------
const PITCH_MODULES = ['Prospecting', 'Calificación', 'Presentación', 'Cierre', 'Manejo de Objeciones', 'PNL/Rapport'];
function getNextModule(escenario_actual, competencias) {
  const avg = compAvg(competencias);
  const norm = stripAccents(escenario_actual || '');
  let idx = PITCH_MODULES.findIndex((m) => norm.includes(stripAccents(m).split('/')[0]));
  if (idx < 0) idx = 0;
  // Promedio bajo -> repetir módulo actual; alto -> avanzar
  const nextIdx = avg < 7 ? idx : Math.min(idx + 1, PITCH_MODULES.length - 1);
  const nombre = PITCH_MODULES[nextIdx];
  const base = 'https://victor-ia-training.vercel.app';
  return {
    nombre,
    repetir: avg < 7,
    url: `${base}/?modulo=${encodeURIComponent(nombre.toLowerCase())}`
  };
}

// ---------------------------------------------------------------------------
// deriveNeuro — estima métricas neuro 0-100 desde señales disponibles
// ---------------------------------------------------------------------------
function deriveNeuro(vtc) {
  if (vtc.neuro && typeof vtc.neuro === 'object') {
    return {
      dopamina: clampScore(vtc.neuro.dopamina / 10) * 10 || Number(vtc.neuro.dopamina) || 0,
      cortisol: Number(vtc.neuro.cortisol) || 0,
      oxitocina: Number(vtc.neuro.oxitocina) || 0,
      amigdala: Number(vtc.neuro.amigdala) || 0
    };
  }
  const s = clampScore(vtc.score_global) * 10; // 0-100
  const sent = stripAccents(vtc.sentimiento || '');
  const pos = sent.includes('positiv'), neg = sent.includes('negativ');
  const rapport = (vtc.competencias || []).find((c) => stripAccents(c.nombre).includes('rapport'));
  const rapportPct = rapport ? clampScore(rapport.score) * 10 : s;
  return {
    dopamina: Math.round(Math.max(0, Math.min(100, s * 0.9 + (pos ? 12 : 0) - (neg ? 10 : 0)))),
    cortisol: Math.round(Math.max(0, Math.min(100, 55 - s * 0.4 + (neg ? 22 : 0)))),
    oxitocina: Math.round(Math.max(0, Math.min(100, rapportPct * 0.85 + (pos ? 10 : 0)))),
    amigdala: Math.round(Math.max(0, Math.min(100, 50 - s * 0.35 + (neg ? 20 : 0))))
  };
}

// ===========================================================================
//  TABLAS FORMALES (5) — estilos inline para compatibilidad de email
// ===========================================================================
const TH = `background:${C.headBg};color:${C.gold};font-family:${FONT_MONO};font-size:11px;letter-spacing:1px;padding:12px;text-align:left;text-transform:uppercase;`;
const TDl = (i) => `font-family:${FONT_MONO};font-size:11px;color:${C.ink};padding:12px;border-bottom:1px solid ${C.line};background:${i % 2 ? C.rowB : C.rowA};`;
const tblWrap = (inner) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${C.line};">${inner}</table>`;

// Tabla 1 — Resumen de sesión (9 filas)
function tableSesion(vtc) {
  const rows = [
    ['Empleado', vtc.user_name], ['Número Empleado', vtc.empleado_id],
    ['Departamento', vtc.departamento || 'Dirección'], ['Fecha', vtc.fecha_iso || vtc.timestamp],
    ['Hora Inicio', `${vtc.hora_inicio || '—'} CDMX`], ['Hora Cierre', `${vtc.hora_cierre || '—'} CDMX`],
    ['Duración Total', vtc.duracion_minutos], ['Agente', 'Coach VÍCTOR'], ['Idioma', vtc.idioma || 'ES']
  ];
  const body = rows.map(([k, v], i) =>
    `<tr><td style="${TDl(i)};font-weight:bold;width:45%;">${esc(k)}</td><td style="${TDl(i)}">${esc(v)}</td></tr>`).join('');
  return tblWrap(`<tr><td colspan="2" style="${TH}">Información de sesión</td></tr>${body}`);
}

// Tabla 2 — KPIs (con histórico + variación)
function tableKPIs(vtc, history) {
  const prev = (history && history.length) ? history[0] : null;
  const curMin = parseDurMin(vtc.duracion_minutos);
  const curAvg = compAvg(vtc.competencias);
  const varCell = (delta, unit) => {
    if (delta === null || delta === undefined) return `<span style="color:${C.body}">—</span>`;
    if (delta > 0.01) return `<span style="color:${C.green};font-weight:bold">+${delta.toFixed(1)}${unit} ↑</span>`;
    if (delta < -0.01) return `<span style="color:${C.red};font-weight:bold">${delta.toFixed(1)}${unit} ↓</span>`;
    return `<span style="color:${C.body}">→</span>`;
  };
  const rows = [
    ['Duración (min)', curMin.toFixed(2), prev ? prev.duration_min.toFixed(2) : '—',
      prev && prev.duration_min > 0 ? varCell(((curMin - prev.duration_min) / prev.duration_min) * 100, '%') : '<span style="color:'+C.body+'">—</span>'],
    ['Competencias Prom.', curAvg.toFixed(1), prev ? prev.score.toFixed(1) : '—',
      prev ? varCell(curAvg - prev.score, '') : '<span style="color:'+C.body+'">—</span>'],
    ['Sentimiento', esc(vtc.sentimiento || 'Neutral'), prev ? esc(prev.sentiment || '—') : '—',
      stripAccents(vtc.sentimiento || '').includes('positiv') ? '<span style="color:'+C.green+';font-weight:bold">↑ Mejora</span>' : '<span style="color:'+C.body+'">→</span>'],
    ['Intervenciones', String(vtc.intervenciones ?? 0), '—', '<span style="color:'+C.body+'">—</span>'],
    ['Score Global', `${clampScore(vtc.score_global)}/10`, prev ? `${prev.score.toFixed(1)}/10` : '—',
      prev ? varCell(clampScore(vtc.score_global) - prev.score, '') : '<span style="color:'+C.body+'">—</span>']
  ];
  const body = rows.map(([k, a, h, v], i) =>
    `<tr><td style="${TDl(i)};font-weight:bold;">${k}</td><td style="${TDl(i)}">${a}</td><td style="${TDl(i)}">${h}</td><td style="${TDl(i)}">${v}</td></tr>`).join('');
  return tblWrap(`<tr><td style="${TH}">Métrica</td><td style="${TH}">Actual</td><td style="${TH}">Histórico</td><td style="${TH}">Variación</td></tr>${body}`);
}

// Tabla 3 — Competencias detalladas (con histórico + trend)
function tableCompetencias(vtc, history) {
  const prevScore = (history && history.length) ? history[0].score : null;
  const rows = (vtc.competencias || []).filter((c) => c && c.nombre);
  if (!rows.length) return tblWrap(`<tr><td style="${TH}">Competencia</td></tr><tr><td style="${TDl(0)}">Sin datos de competencias</td></tr>`);
  const body = rows.map((c, i) => {
    const sc = clampScore(c.score);
    const hist = prevScore !== null ? `${prevScore.toFixed(1)}/10` : '—';
    let trend = '<span style="color:'+C.body+'">— Nuevo</span>';
    if (prevScore !== null) {
      const d = sc - prevScore;
      trend = d > 0.05 ? `<span style="color:${C.green};font-weight:bold">↑ +${d.toFixed(1)}</span>`
        : d < -0.05 ? `<span style="color:${C.red};font-weight:bold">↓ ${d.toFixed(1)}</span>`
          : `<span style="color:${C.body}">→ Igual</span>`;
    }
    return `<tr><td style="${TDl(i)};font-weight:bold;">${esc(c.nombre)}</td><td style="${TDl(i)}">${sc}/10</td><td style="${TDl(i)}">${hist}</td><td style="${TDl(i)}">${trend}</td></tr>`;
  }).join('');
  return tblWrap(`<tr><td style="${TH}">Competencia</td><td style="${TH}">Score</td><td style="${TH}">Histórico</td><td style="${TH}">Trend</td></tr>${body}`);
}

// Tabla 4 — Objeciones enfrentadas
function tableObjeciones(vtc) {
  const rows = (vtc.objeciones || []).filter((o) => o && (o.objecion || o.manejo));
  if (!rows.length) {
    return tblWrap(`<tr><td style="${TH}">Objeciones</td></tr><tr><td style="${TDl(0)}">Sin objeciones enfrentadas</td></tr>`);
  }
  const efi = (o) => {
    const s = stripAccents(o.manejo || '') + stripAccents(o.efectividad || '');
    if (/parcial|incomplet|no resuel/.test(s)) return `<span style="color:${C.yellow};font-weight:bold">⚠ Parcial</span>`;
    return `<span style="color:${C.green};font-weight:bold">✔ Resuelta</span>`;
  };
  const body = rows.map((o, i) =>
    `<tr><td style="${TDl(i)};font-weight:bold;">${esc(o.objecion || '—')}</td><td style="${TDl(i)}">${esc(o.manejo || '—')}</td><td style="${TDl(i)}">${efi(o)}</td></tr>`).join('');
  return tblWrap(`<tr><td style="${TH}">Objeción</td><td style="${TH}">Cómo se manejó</td><td style="${TH}">Efectividad</td></tr>${body}`);
}

// Tabla 5 — Transcripción abreviada (primeras 3 + última)
function tableTranscript(vtc) {
  const msgs = (vtc.messages || []).filter((m) => m && m.message);
  const fmtT = (s) => { const n = Math.max(0, Math.floor(Number(s) || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
  let picked = [];
  if (msgs.length <= 4) picked = msgs;
  else picked = [...msgs.slice(0, 3), msgs[msgs.length - 1]];
  if (!picked.length) return tblWrap(`<tr><td style="${TH}">Transcripción</td></tr><tr><td style="${TDl(0)}">Transcripción no disponible</td></tr>`);
  const body = picked.map((m, i) => {
    const isUser = m.role === 'user';
    const who = isUser ? 'Empleado' : 'Coach VCT';
    const excerpt = String(m.message).slice(0, 50) + (m.message.length > 50 ? '…' : '');
    return `<tr><td style="${TDl(i)};width:60px;">${fmtT(m.time)}</td><td style="${TDl(i)};width:90px;font-weight:bold;color:${isUser ? C.gold : C.ink};">${who}</td><td style="${TDl(i)}">&ldquo;${esc(excerpt)}&rdquo;</td></tr>`;
  }).join('');
  const ellip = msgs.length > 4 ? `<tr><td colspan="3" style="${TDl(1)};text-align:center;color:${C.body};">··· ${msgs.length - 4} intervenciones más ···</td></tr>` : '';
  return tblWrap(`<tr><td style="${TH}">Time</td><td style="${TH}">Speaker</td><td style="${TH}">Excerpt</td></tr>${picked.length >= 4 ? body.replace(/(<\/tr>)(?=(?:(?!<\/tr>).)*$)/, '$1' + ellip) : body}`);
}

// ---------------------------------------------------------------------------
// HTML del reporte de EMAIL — rediseñado (paleta crema/oro + Cormorant/Inter)
// ---------------------------------------------------------------------------
function buildReportHtml(vtc, { forPdf = false } = {}) {
  const seg = clampScore(vtc.score_global);
  const history = vtc.history || [];
  const neuro = deriveNeuro(vtc);
  const next = vtc.next_module || getNextModule(vtc.escenario, vtc.competencias);
  const base = 'https://victor-ia-training.vercel.app';
  const reportUrl = `${base}/api/report?session=${encodeURIComponent(vtc.conversation_id || '')}`;
  const pdfUrl = reportUrl;
  const audioUrl = `${base}/api/audio?session=${encodeURIComponent(vtc.conversation_id || '')}`;
  const nextUrl = next.url;

  const H2 = (t) => `<tr><td class="px" style="padding:34px 34px 6px 34px;">
    <div style="font-family:${FONT_HEAD};font-size:22px;font-weight:400;color:${C.ink};border-bottom:1px solid ${C.line};padding-bottom:8px;">${t}</div></td></tr>`;
  const chartRow = (svg) => `<tr><td class="px" align="center" style="padding:16px 20px 0 20px;">${svg}</td></tr>`;
  const tableRow = (tbl) => `<tr><td class="px" style="padding:14px 34px 0 34px;">${tbl}</td></tr>`;

  const cta = (href, emoji, label) => `<a href="${esc(href)}" target="_blank" style="display:inline-block;background:${C.gold};color:${C.bg};padding:14px 24px;text-decoration:none;border-radius:6px;font-family:${FONT_BODY};font-weight:400;font-size:13px;letter-spacing:.5px;">${emoji} ${label}</a>`;

  const listRows = (items, color) => (items || []).map((t) =>
    `<tr><td valign="top" style="padding:5px 0;width:18px;font-family:${FONT_BODY};font-size:14px;color:${color};font-weight:bold;">&#8226;</td>
     <td style="padding:5px 0;font-family:${FONT_BODY};font-size:14px;line-height:22px;color:${C.body};">${esc(t)}</td></tr>`).join('');

  const fortalezasBlock = (vtc.fortalezas || []).length
    ? `<tr><td class="px" style="padding:18px 34px 0 34px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border-left:4px solid ${C.green};">
        <tr><td style="padding:14px 18px 4px 18px;font-family:${FONT_MONO};font-size:11px;font-weight:bold;letter-spacing:1px;color:${C.green};">&#10003; LO QUE HICISTE BIEN</td></tr>
        <tr><td style="padding:0 18px 12px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listRows(vtc.fortalezas, C.green)}</table></td></tr></table></td></tr>` : '';
  const mejorasBlock = (vtc.mejoras || []).length
    ? `<tr><td class="px" style="padding:14px 34px 0 34px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border-left:4px solid ${C.yellow};">
        <tr><td style="padding:14px 18px 4px 18px;font-family:${FONT_MONO};font-size:11px;font-weight:bold;letter-spacing:1px;color:${C.yellow};">&#9650; A MEJORAR</td></tr>
        <tr><td style="padding:0 18px 12px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listRows(vtc.mejoras, C.yellow)}</table></td></tr></table></td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Reporte VTC</title>${FONTS_LINK}
<style>body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}img,svg{border:0;}
@media only screen and (max-width:620px){.wrap{width:100%!important;}.px{padding-left:16px!important;padding-right:16px!important;}.score-num{font-size:72px!important;}.ctacell{display:block!important;width:100%!important;padding:6px 0!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};" bgcolor="${C.bg}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.bg}" style="background-color:${C.bg};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:${C.bg};border:1px solid ${C.line};border-radius:10px;overflow:hidden;">

<!-- HEADER -->
<tr><td style="background:${C.headBg};padding:36px 34px 28px 34px;" align="center">
<div style="font-family:${FONT_MONO};font-size:12px;letter-spacing:4px;color:${C.gold};">VICTORIOUS TRAVELERS CLUB</div>
<div style="font-family:${FONT_HEAD};font-size:28px;font-weight:700;color:${C.gold};padding-top:10px;letter-spacing:.5px;">Reporte de Entrenamiento</div>
<div style="font-family:${FONT_MONO};font-size:10px;letter-spacing:3px;color:#8a8a8a;padding-top:10px;text-transform:uppercase;">${esc(vtc.timestamp)}</div>
</td></tr>

<!-- SUBTÍTULO -->
<tr><td class="px" style="padding:22px 34px 0 34px;" align="center">
<div style="font-family:${FONT_HEAD};font-size:16px;font-weight:300;color:${C.ink};">Sesi&oacute;n de ${esc(vtc.user_name)} con V&iacute;ctor &middot; ${esc(vtc.tipo_sesion)} &middot; ${esc(vtc.duracion_minutos)} min</div>
</td></tr>

<!-- SCORE -->
<tr><td align="center" style="padding:18px 34px 4px 34px;">
<div style="font-family:${FONT_MONO};font-size:11px;letter-spacing:3px;color:${C.body};text-transform:uppercase;">Desempeño Global</div>
<div style="padding:6px 0;"><span class="score-num" style="font-family:${FONT_HEAD};font-size:88px;font-weight:700;color:${C.gold};line-height:1;">${seg}</span><span style="font-family:${FONT_HEAD};font-size:34px;color:${C.goldDark};">/10</span></div>
</td></tr>

<!-- TENDENCIAS -->
${H2('Indicadores de tendencia')}
<tr><td class="px" style="padding:14px 34px 0 34px;">${trendIndicatorsHtml(vtc, history)}</td></tr>

<!-- RESUMEN -->
${H2('Resumen de la llamada')}
<tr><td class="px" style="padding:12px 34px 0 34px;font-family:${FONT_BODY};font-size:14px;line-height:23px;color:${C.body};">${esc(vtc.resumen)}</td></tr>

<!-- TABLA 1 SESIÓN -->
${H2('Información de sesión')}
${tableRow(tableSesion(vtc))}

<!-- TABLA 2 KPIs -->
${H2('Métricas clave (KPIs)')}
${tableRow(tableKPIs(vtc, history))}

<!-- HEATMAP -->
${H2('Heatmap de competencias')}
${chartRow(heatmapSVG(vtc.competencias))}

<!-- TABLA 3 COMPETENCIAS -->
${tableRow(tableCompetencias(vtc, history))}

<!-- SPARKLINE -->
${H2('Histórico de desempeño')}
${chartRow(sparklineSVG(history))}

<!-- GAUGES NEURO -->
${H2('Neurociencia de la conversación')}
${chartRow(gaugesSVG(neuro))}

<!-- TIMELINE VISUAL -->
${H2('Línea de tiempo')}
${chartRow(timelineVizSVG(vtc.timeline))}

<!-- ACIERTOS / MEJORAS -->
${fortalezasBlock}
${mejorasBlock}

<!-- TABLA 4 OBJECIONES -->
${H2('Objeciones enfrentadas')}
${tableRow(tableObjeciones(vtc))}

<!-- TABLA 5 TRANSCRIPT -->
${H2('Transcripción abreviada')}
${tableRow(tableTranscript(vtc))}

<!-- PRÓXIMO MÓDULO -->
${H2('Tu próximo paso')}
<tr><td class="px" style="padding:12px 34px 0 34px;font-family:${FONT_BODY};font-size:14px;line-height:22px;color:${C.body};">
${next.repetir ? 'Recomendamos <b>repetir</b>' : 'Avanza al módulo'} <b style="color:${C.gold};">${esc(next.nombre)}</b> ${next.repetir ? 'para consolidar competencias antes de avanzar.' : 'para continuar tu progreso en el pitch.'}</td></tr>

<!-- 4 CTAs -->
<tr><td align="center" style="padding:26px 20px 8px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;"><tr>
<td class="ctacell" align="center" style="padding:8px;">${cta(reportUrl, '📊', 'Ver Reporte')}</td>
<td class="ctacell" align="center" style="padding:8px;">${cta(pdfUrl, '📥', 'Descargar PDF')}</td></tr>
<tr>
<td class="ctacell" align="center" style="padding:8px;">${cta(audioUrl, '🎙️', 'Escuchar Grabación')}</td>
<td class="ctacell" align="center" style="padding:8px;">${cta(nextUrl, '📚', 'Módulo Siguiente')}</td></tr></table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C.headBg};padding:24px 34px;margin-top:20px;" align="center">
<div style="font-family:${FONT_MONO};font-size:11px;letter-spacing:3px;color:${C.gold};">VICTORIOUS TRAVELERS CLUB</div>
<div style="font-family:${FONT_BODY};font-size:10px;color:#8a8a8a;padding-top:8px;">Reporte generado autom&aacute;ticamente por V&iacute;ctor IA &middot; ${esc(vtc.timestamp)}</div></td></tr>

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
  .chartbox { background: #F5F5F0; border-radius: 12px; padding: 18px 16px; margin: 12px 0; text-align: center; }
  .chartbox .ct { font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 2px; color: #6f6f6f; text-transform: uppercase; margin-bottom: 10px; text-align: left; }
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

    <!-- GRÁFICOS A COLOR (heatmap · histórico · neuro · timeline) -->
    <div class="chartbox avoid"><div class="ct">Heatmap de competencias</div>${heatmapSVG(vtc.competencias)}</div>
    <div class="chartbox avoid"><div class="ct">Histórico de desempeño</div>${sparklineSVG(vtc.history || [])}</div>
    <div class="chartbox avoid"><div class="ct">Neurociencia de la conversación</div>${gaugesSVG(deriveNeuro(vtc))}</div>
    <div class="chartbox avoid"><div class="ct">Línea de tiempo</div>${timelineVizSVG(vtc.timeline)}</div>

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
          from: 'Victor IA Training <info@victor-ia.xyz>',
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
// HISTÓRICO DEL EMPLEADO — últimas 5 sesiones previas (Supabase)
//   Retorna [{ duration_min, score, pct, sentiment, date }] (más reciente primero)
//   Si no hay Supabase o no hay histórico -> []
// ---------------------------------------------------------------------------
async function loadEmployeeHistory(empleado_id, excludeConversationId) {
  if (!supabase || !empleado_id) return [];
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('duration_minutes, score_global, timestamp, conversation_id, status')
      .eq('employee_id', empleado_id)
      .order('timestamp', { ascending: false })
      .limit(8);
    if (error) { console.error('[History] error:', error.message); return []; }
    return (data || [])
      .filter((r) => r.conversation_id !== excludeConversationId)
      .slice(0, 5)
      .map((r) => {
        const score = Number(r.score_global) || 0;
        return {
          duration_min: Number(r.duration_minutes) || 0,
          score,
          pct: Math.max(0, Math.min(100, score * 10)),
          sentiment: r.status && /neg/i.test(r.status) ? 'Negativo' : 'Neutral',
          date: r.timestamp
        };
      });
  } catch (e) {
    console.error('[History] exception:', e.message);
    return [];
  }
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

  // Validación del empleado contra el roster autorizado (3 empleados de Dirección).
  // No bloquea el reporte, pero lo marca como no validado para auditoría.
  const AUTHORIZED_EMPLOYEES = [
    { name: 'Pablo Solar',     employee_id: '1234567' },
    { name: 'Christian Soria', employee_id: '123456'  },
    { name: 'Andrés Mateos',   employee_id: '12345'   }
  ];
  const _norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const empleado_validado = AUTHORIZED_EMPLOYEES.some(
    e => e.employee_id === String(empleado_id).trim() && _norm(e.name) === _norm(user_name)
  );
  if (!empleado_validado) {
    console.warn(`[Handler] ACCESO NO VALIDADO — empleado=${user_name} id=${empleado_id} (reporte se genera igual, marcado como no validado)`);
  }

  try {
    console.log(`[Handler] conversation_id=${conversation_id} · empleado=${user_name}`);

    // 1 + 2) Transcript y audio de ElevenLabs (en paralelo)
    const [transcriptData, audioBase64] = await Promise.all([
      getTranscriptFromElevenLabs(conversation_id),
      getAudioFromElevenLabs(conversation_id)
    ]);

    // 3) Análisis IA (depende del transcript) + histórico del empleado (en paralelo)
    const [analysis, history] = await Promise.all([
      analyzeTranscriptWithAI(transcriptData.text),
      loadEmployeeHistory(empleado_id, conversation_id)
    ]);

    // Duración: prioriza la del body, luego la de ElevenLabs
    const durSecs = Number(body.call_duration_secs || transcriptData.durationSecs || 0);
    const duracion_minutos = `${Math.floor(durSecs / 60)}:${String(Math.floor(durSecs % 60)).padStart(2, '0')}`;

    // Departamento del empleado autorizado (todos en Dirección por defecto)
    const departamento = body.departamento || 'Dirección';

    // Hora de inicio / cierre (CDMX) — cierre = inicio + duración de la llamada
    const startDate = new Date(timestampIso);
    const endDate = new Date(startDate.getTime() + durSecs * 1000);
    const fmtHora = (d) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });

    // Modelo de datos unificado para HTML/PDF
    const vtc = {
      user_name,
      empleado_id,
      departamento,
      duracion_minutos,
      tipo_sesion: body.tipo_sesion || 'Sesión',
      timestamp: new Date(timestampIso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }),
      fecha_corta: new Date(timestampIso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' }).toUpperCase(),
      fecha_iso: new Date(timestampIso).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }), // YYYY-MM-DD
      hora_inicio: fmtHora(startDate),
      hora_cierre: fmtHora(endDate),
      transcript: transcriptData.text,
      messages: transcriptData.messages,
      intervenciones: transcriptData.messages.length,
      conversation_id,
      history,
      ...analysis
    };
    // Próximo módulo (depende del escenario + competencias del análisis)
    vtc.next_module = getNextModule(vtc.escenario, vtc.competencias);

    // VALIDACIÓN — ningún reporte se envía con campos críticos vacíos
    const validation = validateReport(vtc);
    if (!validation.valid) {
      console.error('[Handler] validación fallida:', validation.error);
      return res.status(400).json({
        success: false,
        error: validation.error,
        missing_fields: validation.missing_fields,
        warnings: validation.warnings
      });
    }
    if (validation.warnings.length) {
      console.warn('[Handler] campos recomendados vacíos:', validation.warnings.join(', '));
    }

    // AUDIO OBLIGATORIO — no se envía un reporte sin la grabación original (MP3).
    // Escape hatch para pruebas/tolerancia: body.require_audio === false.
    const requireAudio = body.require_audio !== false;
    if (requireAudio && !audioBase64) {
      console.error('[Handler] audio no disponible — reporte bloqueado');
      return res.status(400).json({
        success: false,
        error: 'Audio de la conversación no disponible. No se envía el reporte sin la grabación original (MP3).',
        conversation_id,
        hint: 'La grabación puede tardar en procesarse tras finalizar la llamada. Reintenta en unos segundos, o envía "require_audio": false para omitir esta validación.'
      });
    }

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
      // pdf_url / audio_url: si no hay storage externo, se guardan como data: URI
      // (así /api/report y /api/audio sirven el binario). Guard de tamaño para no
      // inflar la fila con adjuntos gigantes (>6 MB base64 → se omite).
      const MAX_INLINE = 6 * 1024 * 1024;
      const pdf_url = (pdfBase64 && pdfBase64.length <= MAX_INLINE)
        ? `data:application/pdf;base64,${pdfBase64}` : (body.pdf_url || null);
      const audio_url = (audioBase64 && audioBase64.length <= MAX_INLINE)
        ? `data:audio/mpeg;base64,${audioBase64}` : (body.audio_url || null);

      const { error: dbError } = await supabase
        .from('training_sessions')
        .upsert({
          employee_name: user_name,
          employee_id: empleado_id,
          conversation_id,
          duration_minutes: durSecs ? durSecs / 60 : null,
          status: body.estado_final || 'completado',
          timestamp: timestampIso,
          transcript: transcriptData.text,
          score_global: vtc.score_global,
          email_sent: emailResult.status === 200,
          empleado_validado,
          pdf_url,
          audio_url
        }, { onConflict: 'conversation_id' });
      if (dbError) console.error('[DB] training_sessions error:', dbError.message);
      else dbSaved = true;

      // Marcar la sesión como completada en el progreso del empleado
      const { error: progErr } = await supabase
        .from('training_interactions')
        .insert({
          employee_id: empleado_id,
          conversation_id,
          type: 'session_completed',
          data: {
            score_global: vtc.score_global,
            duration_minutes: durSecs ? durSecs / 60 : null,
            email_sent: emailResult.status === 200,
            timestamp: timestampIso
          }
        });
      if (progErr) console.error('[DB] training_interactions(session_completed) error:', progErr.message);
    }

    if (emailResult.status !== 200) {
      return res.status(500).json({ success: false, error: 'Error enviando email', email_via: emailResult.via });
    }

    return res.status(200).json({
      success: true,
      message: 'Reporte completo generado y enviado',
      conversation_id,
      score_global: vtc.score_global,
      transcript_turns: transcriptData.messages.length,
      pdf_attached: !!pdfBase64,
      audio_attached: !!audioBase64,
      email_via: emailResult.via,
      email_id: emailResult.id,
      db_saved: dbSaved,
      empleado_validado,
      attachments: {
        pdf: !!pdfBase64,
        audio: !!audioBase64,
        transcript_lines: transcriptData.messages.length
      },
      validation: {
        fields_verified: validation.fields_verified,
        all_fields_present: validation.all_fields_present,
        missing_fields: validation.missing_fields,
        warnings: validation.warnings
      }
    });
  } catch (error) {
    console.error('[Handler] error fatal:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Exports para pruebas/reuso (no afecta al handler serverless por defecto)
export {
  buildReportHtml, buildPdfReportHtml,
  heatmapSVG, sparklineSVG, gaugesSVG, timelineVizSVG, trendIndicatorsHtml,
  tableSesion, tableKPIs, tableCompetencias, tableObjeciones, tableTranscript,
  getNextModule, deriveNeuro, loadEmployeeHistory
};
