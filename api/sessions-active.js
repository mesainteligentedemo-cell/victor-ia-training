// GET /api/sessions/active
// Retorna sesiones activas de entrenamiento VTC en tiempo real
// Acceso: público (read-only, datos no sensibles)

import { createClient } from '@supabase/supabase-js';

// Usa los mismos nombres de env vars que api/email-report.js (los que existen en Vercel).
// Guard: solo se instancia el cliente si ambas credenciales existen — evita que
// createClient('', '') lance al cargar el módulo (FUNCTION_INVOCATION_FAILED / 500).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default async function handler(req, res) {
  // CORS para tracker.victor-ia.xyz
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sin credenciales configuradas: responder 200 con datos vacíos (nunca 500).
    if (!supabase) {
      return res.status(200).json({
        active_sessions: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'Supabase no configurado'
      });
    }

    // Obtener sesiones activas de Supabase (últimas 2 horas)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error } = await supabase
      .from('active_sessions')
      .select('*')
      .gte('last_activity', twoHoursAgo)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(200).json({
        active_sessions: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'No hay sesiones activas'
      });
    }

    // Enriquecer datos de sesiones
    const enriched = (sessions || []).map(s => ({
      employee_id: s.employee_id,
      conversation_id: s.conversation_id,
      agent_id: s.agent_id,
      session_start: s.session_start,
      last_activity: s.last_activity,
      duration_minutes: Math.round(
        (new Date(s.last_activity) - new Date(s.session_start)) / 1000 / 60
      ),
      metadata: s.metadata || {},
      // Extraer del metadata si está disponible
      user_name: s.metadata?.name || s.metadata?.user_name || 'Unknown',
      department: s.metadata?.department || 'N/A',
      current_module: s.metadata?.current_module || 'iniciando',
      progress_percent: calculateProgress(s.metadata?.current_module)
    }));

    return res.status(200).json({
      active_sessions: enriched,
      total: enriched.length,
      timestamp: new Date().toISOString(),
      endpoint: '/api/sessions/active',
      refresh_interval: '5s'
    });

  } catch (e) {
    console.error('Error en /api/sessions/active:', e.message);
    return res.status(200).json({
      active_sessions: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: e.message
    });
  }
}

function calculateProgress(moduleId) {
  // Estimación básica de progreso por módulo
  const modules = ['modulo-f', 'modulo-0', 'modulo-1', 'modulo-2', 'modulo-3', 'modulo-4', 'modulo-5', 'modulo-6', 'modulo-7', 'modulo-8', 'modulo-9', 'modulo-10', 'modulo-11', 'modulo-12'];
  const idx = modules.indexOf(moduleId);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / modules.length) * 100);
}