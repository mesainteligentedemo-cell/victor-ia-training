// GET /api/audio?session=<conversation_id | employee_id>
// Devuelve el MP3 de la sesión. Lee training_sessions.audio_url.
// - URL http(s): redirect 302.
// - data:audio/mpeg;base64,...: se sirve el binario como descarga.
// Sin sesión / sin audio_url: 404 JSON.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = String(req.query.session || req.query.id || '').trim();
  if (!session) return res.status(400).json({ error: 'Parámetro "session" requerido' });
  if (!supabase) return res.status(503).json({ error: 'Supabase no configurado' });

  try {
    let { data, error } = await supabase
      .from('training_sessions')
      .select('audio_url, employee_id, conversation_id, timestamp')
      .eq('conversation_id', session)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if ((!data || !data.audio_url) && !error) {
      const alt = await supabase
        .from('training_sessions')
        .select('audio_url, employee_id, conversation_id, timestamp')
        .eq('employee_id', session)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      data = alt.data; error = alt.error;
    }

    if (error) return res.status(500).json({ error: error.message });
    if (!data || !data.audio_url) return res.status(404).json({ error: 'Audio no encontrado para esa sesión', session });

    const url = data.audio_url;
    const m = /^data:audio\/(?:mpeg|mp3);base64,(.+)$/i.exec(url);
    if (m) {
      const buf = Buffer.from(m[1], 'base64');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="sesion-vtc-${session}.mp3"`);
      return res.status(200).send(buf);
    }
    return res.redirect(302, url);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}