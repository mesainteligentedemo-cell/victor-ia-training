// POST /api/generate-report
// LEGACY — mantenido solo por compatibilidad con integraciones/tests antiguos.
//
// Hasta 2026-07-15 este archivo generaba un email con una narrativa FIJA e
// INVENTADA (score aleatorio, "fortalezas"/"mejoras"/objeciones de ejemplo)
// sin ninguna relación con lo que realmente ocurrió en la sesión — el campo
// `transcript` se guardaba en Supabase pero nunca se usaba para construir el
// reporte. Eso viola el requisito explícito de "transcripción completa real"
// y el protocolo de no fabricar información.
//
// Ahora este endpoint YA NO genera contenido: reenvía la solicitud tal cual
// a /api/email-report, que es el pipeline real y validado (transcript + audio
// reales desde la API de ElevenLabs vía conversation_id, análisis con IA,
// PDF real por Playwright, envío por Resend, y bloquea el envío si faltan
// campos críticos). Si algo todavía apunta a /api/generate-report, seguirá
// funcionando — pero con datos reales, nunca inventados.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const conversation_id = body.conversation_id || body.conversationId;
  if (!conversation_id) {
    return res.status(400).json({
      success: false,
      error:
        'conversation_id es requerido. Este endpoint reenvía a /api/email-report, ' +
        'que necesita el conversation_id real para traer transcripción y audio ' +
        'desde ElevenLabs. Ya no se envían reportes con contenido inventado.',
    });
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const targetUrl = `${proto}://${host}/api/email-report`;

  try {
    console.log(`[generate-report → proxy] reenviando a ${targetUrl} (conversation_id=${conversation_id})`);
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json({
      ...data,
      proxied_via: '/api/generate-report -> /api/email-report',
    });
  } catch (error) {
    console.error('[generate-report proxy] error:', error.message);
    return res.status(502).json({
      success: false,
      error: 'No se pudo reenviar a /api/email-report',
      message: error.message,
    });
  }
}