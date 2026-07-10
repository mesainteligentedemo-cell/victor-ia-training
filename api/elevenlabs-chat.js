// POST /api/elevenlabs-chat
// Chat de texto con el agente ElevenLabs "Nuevo Agente Victor IA" vía API directa.
// Reemplaza al widget ConvAI (que fallaba con "Sesión terminada").
//
// Arquitectura:
//   1. Pide un signed_url a ElevenLabs (autenticado con xi-api-key en el server).
//   2. Abre un WebSocket nativo (Node 20+) al signed_url — sin dependencias extra.
//   3. Reinyecta el historial con "contextual_update" (no dispara respuesta).
//   4. Envía "user_message", espera el "agent_response" y lo devuelve.
//
// Body:     { userMessage: "string", conversationId?: "string", history?: [{role, text}] }
// Response: { agentResponse: "string", conversationId: "string" }
//
// NOTA: la continuidad de contexto se logra reenviando `history` desde el cliente.
// ElevenLabs no permite "reanudar" un WS por id, así que el historial viaja en cada turno.

const ELEVENLABS_API_KEY =
  process.env.ELEVENLABS_API_KEY || 'sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67';
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'agent_6401kx70ge6tednaxw9ph311h5wr';

// ── Config ─────────────────────────────────────────────────────────────────
const RESPONSE_TIMEOUT_MS = 25000; // Vercel serverless suele cortar a 30s
const MAX_MESSAGE_LEN = 4000;
const MAX_HISTORY_TURNS = 20; // solo se reinyectan los últimos N turnos

// ── Rate limiting básico (best-effort, en memoria por instancia) ─────────────
const RATE_WINDOW_MS = 60000; // ventana de 1 min
const RATE_MAX = 20; // 20 mensajes / min / IP
const rateStore = new Map(); // ip -> { count, resetAt }

function checkRate(ip) {
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, remaining: RATE_MAX - 1 };
  }
  if (entry.count >= RATE_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, remaining: RATE_MAX - entry.count };
}

// Limpieza oportunista para no acumular IPs viejas
function sweepRateStore() {
  const now = Date.now();
  if (rateStore.size < 500) return;
  for (const [ip, e] of rateStore) if (now > e.resetAt) rateStore.delete(ip);
}

// ── Paso 1: obtener signed_url del agente ────────────────────────────────────
async function getSignedUrl() {
  const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(
    AGENT_ID
  )}`;
  const r = await fetch(url, {
    method: 'GET',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`get-signed-url (${r.status}): ${body}`);
  }
  const data = await r.json();
  if (!data.signed_url) throw new Error('Respuesta sin signed_url');
  return data.signed_url;
}

// ── Paso 2-4: conversar por WebSocket y devolver la respuesta del agente ─────
function talkToAgent({ signedUrl, userMessage, history }) {
  return new Promise((resolve, reject) => {
    if (typeof WebSocket === 'undefined') {
      return reject(new Error('WebSocket nativo no disponible (requiere Node 20+)'));
    }

    const ws = new WebSocket(signedUrl);
    let conversationId = null;
    let settled = false;
    let sentUserMessage = false;

    const timer = setTimeout(() => {
      finish(new Error('Timeout esperando respuesta del agente'));
    }, RESPONSE_TIMEOUT_MS);

    function finish(err, result) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch (_) {}
      if (err) reject(err);
      else resolve(result);
    }

    function sendJSON(obj) {
      try {
        ws.send(JSON.stringify(obj));
      } catch (e) {
        finish(new Error(`No se pudo enviar al WS: ${e.message}`));
      }
    }

    ws.onopen = () => {
      // Inicializa la conversación (texto). Los eventos de audio se ignoran.
      sendJSON({ type: 'conversation_initiation_client_data' });
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      } catch (_) {
        return;
      }

      switch (msg.type) {
        case 'conversation_initiation_metadata': {
          conversationId =
            msg.conversation_initiation_metadata_event?.conversation_id || conversationId;

          // Reinyecta contexto previo sin disparar respuesta.
          if (Array.isArray(history) && history.length) {
            const recent = history.slice(-MAX_HISTORY_TURNS);
            const transcript = recent
              .map((t) => `${t.role === 'agent' ? 'Victor' : 'Usuario'}: ${t.text}`)
              .join('\n');
            sendJSON({
              type: 'contextual_update',
              text: `Contexto de la conversación previa:\n${transcript}`
            });
          }

          // Turno del usuario.
          sentUserMessage = true;
          sendJSON({ type: 'user_message', text: userMessage });
          break;
        }

        case 'agent_response': {
          if (!sentUserMessage) return; // ignora saludos automáticos previos
          const text = msg.agent_response_event?.agent_response;
          if (text && text.trim()) {
            finish(null, { agentResponse: text.trim(), conversationId });
          }
          break;
        }

        case 'ping': {
          // Mantener vivo el socket.
          const id = msg.ping_event?.event_id;
          if (id !== undefined) sendJSON({ type: 'pong', event_id: id });
          break;
        }

        // audio / user_transcript / vad_score / interruption → ignorados
        default:
          break;
      }
    };

    ws.onerror = (err) => {
      finish(new Error(`WS error: ${err?.message || 'desconocido'}`));
    };

    ws.onclose = () => {
      if (!settled) finish(new Error('WS cerrado antes de recibir respuesta'));
    };
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://victor-ia-training.vercel.app',
    'http://localhost:3000'
  ];
  const allow = allowedOrigins.some((o) => origin.includes(o));
  res.setHeader('Access-Control-Allow-Origin', allow ? origin : allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  sweepRateStore();
  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const rl = checkRate(ip);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta en un momento.' });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { userMessage, conversationId, history } = body || {};

  // Validación
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return res.status(400).json({ error: 'Falta userMessage' });
  }
  if (userMessage.length > MAX_MESSAGE_LEN) {
    return res.status(400).json({ error: `Mensaje demasiado largo (máx ${MAX_MESSAGE_LEN})` });
  }

  try {
    const signedUrl = await getSignedUrl();
    const result = await talkToAgent({
      signedUrl,
      userMessage: userMessage.trim(),
      history
    });

    return res.status(200).json({
      agentResponse: result.agentResponse,
      conversationId: result.conversationId || conversationId || null
    });
  } catch (error) {
    console.error('❌ elevenlabs-chat error:', error.message);
    return res.status(502).json({
      error: 'No se pudo obtener respuesta del agente',
      message: error.message
    });
  }
}