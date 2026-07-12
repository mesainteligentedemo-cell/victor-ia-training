// POST /api/signed-url
// Genera conversation token (signed URL) para conectar al agente ElevenLabs
// Solo llamable desde victor-ia-training.vercel.app
//
// Body: { user_id, user_name, employee_id }
// Response: { conversation_id, client_secret, signed_url, expires_at }

import { createClient } from '@supabase/supabase-js';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67';
const AGENT_ID = 'agent_9501k3vkt6svekjs6y0qe5xzcek1';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS — estricto, solo victor-ia-training.vercel.app
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://victor-ia-training.vercel.app',
    'http://localhost:3000' // dev
  ];

  if (!allowedOrigins.some(o => origin.includes(o))) {
    return res.status(403).json({
      error: 'Origin not allowed',
      received: origin
    });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { user_id = 'anon', user_name = 'Usuario', employee_id = '' } = body || {};

  try {
    console.log(`📞 Generando token de conversacion para ${user_name} (${user_id})`);

    // WebRTC: token de conversacion (endpoint correcto de ElevenLabs)
    // GET /v1/convai/conversation/token?agent_id=... -> { token }
    const tokenRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(AGENT_ID)}`,
      { method: 'GET', headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
    );

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`ElevenLabs token (${tokenRes.status}): ${errBody}`);
    }

    const tokenJson = await tokenRes.json();
    const conversationToken = tokenJson.token || tokenJson.conversation_token || null;

    // WebSocket fallback: signed URL (best-effort, no bloquea)
    let signedUrl = null;
    try {
      const suRes = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(AGENT_ID)}`,
        { method: 'GET', headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
      );
      if (suRes.ok) { const suJson = await suRes.json(); signedUrl = suJson.signed_url || null; }
    } catch (e) { console.warn('get-signed-url fallo (no critico):', e.message); }

    const data = {
      conversation_id: `conv_${Date.now()}_${(user_id || 'anon')}`,
      client_secret: conversationToken,
      signed_url: signedUrl,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    // Log en Supabase (auditoría de inicios de sesión)
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('conversation_tokens').insert({
          conversation_id: data.conversation_id,
          user_id,
          user_name,
          employee_id,
          signed_url: data.signed_url,
          expires_at: data.expires_at,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.error('⚠️ Supabase token log failed:', e.message);
        // No bloquea la respuesta
      }
    }

    console.log(`✅ Token generado: ${data.conversation_id}`);

    return res.status(200).json({
      conversation_id: data.conversation_id,
      client_secret: data.client_secret,
      signed_url: data.signed_url,
      expires_at: data.expires_at,
      message: 'Token generado correctamente'
    });

  } catch (error) {
    console.error('❌ signed-url error:', error.message);
    return res.status(500).json({
      error: 'No se pudo generar token de autenticación',
      message: error.message
    });
  }
}