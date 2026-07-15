// GET /api/voices
// Devuelve el roster de voces ElevenLabs configurado para el roleplay VTC,
// y una sugerencia de asignación si se pasa ?language=ES|EN&kids=1.
// Ver lib/voices.js para la limitación real (una llamada = una sola voz TTS;
// esto NO implementa cambio de voz en vivo, solo documenta/asigna el roster).

import { VOICE_PROFILES, assignVoices } from '../lib/voices.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const language = String(req.query.language || 'ES').toUpperCase();
  const withKids = req.query.kids === '1' || req.query.kids === 'true';

  return res.status(200).json({
    profiles: VOICE_PROFILES,
    suggested_assignment: assignVoices({ language, withKids }),
    note:
      'ElevenLabs Conversational AI usa una sola voz TTS por llamada. Este roster ' +
      'es informativo/asignación lógica; el cambio real de voz en vivo requiere ' +
      'Agent Transfer configurado en el dashboard de ElevenLabs.',
  });
}