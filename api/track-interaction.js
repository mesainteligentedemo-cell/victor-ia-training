// POST /api/track-interaction
// Registra interacciones granulares del curso VTC en Supabase.
// Body: { employee_id, conversation_id, type, data, timestamp }
//   type ∈ block_viewed | quiz_answered | module_completed | error_reported |
//          session_completed | heartbeat
// Nunca lanza 500 por Supabase: si no hay credenciales responde 200 (best-effort).

import { createClient } from '@supabase/supabase-js';

// Mismos nombres de env vars que api/email-report.js (los que existen en Vercel).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const VALID_TYPES = new Set([
  'block_viewed', 'quiz_answered', 'module_completed',
  'error_reported', 'session_completed', 'heartbeat'
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const employee_id = String(body.employee_id || '').trim();
    const conversation_id = body.conversation_id ? String(body.conversation_id) : null;
    const type = String(body.type || '').trim();
    const data = body.data && typeof body.data === 'object' ? body.data : {};
    const timestamp = body.timestamp || new Date().toISOString();

    if (!employee_id) return res.status(400).json({ success: false, error: 'employee_id requerido' });
    if (!VALID_TYPES.has(type)) return res.status(400).json({ success: false, error: `type inválido: ${type}` });

    // Sin Supabase: aceptar y no-op (el frontend no debe romperse).
    if (!supabase) {
      return res.status(200).json({ success: true, stored: false, message: 'Supabase no configurado', timestamp });
    }

    const module_id = data.module_id || data.moduleId || data.module || null;
    const block_id = data.block_id || data.blockId || null;
    const score = Number.isFinite(+data.score) ? Math.round(+data.score) : null;

    // 1) Errores → tabla dedicada
    if (type === 'error_reported') {
      const { error } = await supabase.from('training_errors').insert({
        employee_id,
        conversation_id,
        message: String(data.message || data.error || 'error'),
        context: { ...data, timestamp }
      });
      if (error) console.error('[track] training_errors:', error.message);
      return res.status(200).json({ success: true, stored: !error, type, timestamp });
    }

    // 2) Interacción granular
    const { error: iErr } = await supabase.from('training_interactions').insert({
      employee_id, conversation_id, type, module_id, block_id, score,
      data: { ...data, timestamp }
    });
    if (iErr) console.error('[track] training_interactions:', iErr.message);

    // 3) Progreso por módulo (upsert) para quiz_answered / module_completed
    if (type === 'quiz_answered' || type === 'module_completed') {
      const completed = type === 'module_completed';
      const row = {
        employee_id,
        module_id: module_id || 'unknown',
        module_name: data.module_name || module_id || 'unknown',
        completed,
        quiz_passed: type === 'quiz_answered' ? !!data.passed : undefined,
        quiz_score: score !== null ? score : undefined,
        quiz_answers: data.answers || undefined,
        time_spent_seconds: Number.isFinite(+data.time_spent_seconds) ? Math.round(+data.time_spent_seconds) : undefined,
        completed_at: completed ? timestamp : undefined
      };
      // limpiar undefined
      Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
      const { error: pErr } = await supabase
        .from('employee_module_progress')
        .upsert(row, { onConflict: 'employee_id,module_id' });
      if (pErr) console.error('[track] employee_module_progress:', pErr.message);
    }

    // 4) Actualizar last_activity de la sesión activa (best-effort)
    if (conversation_id) {
      await supabase.from('active_sessions')
        .update({ last_activity: timestamp })
        .eq('conversation_id', conversation_id)
        .then(({ error }) => error && console.error('[track] active_sessions:', error.message));
    }

    return res.status(200).json({ success: true, stored: true, type, timestamp });
  } catch (e) {
    console.error('[track-interaction] fatal:', e.message);
    // Nunca 500: el tracking no debe tumbar la UX.
    return res.status(200).json({ success: false, stored: false, error: e.message, timestamp: new Date().toISOString() });
  }
}