// GET /api/sessions/history
// Retorna TODAS las sesiones + interacciones de capacitación (historial completo)
// Query params: ?employee_id=X&department=X&module=X&days=X

import { createClient } from '@supabase/supabase-js';

// Mismos nombres de env vars que api/email-report.js. Guard contra createClient('', '').
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default async function handler(req, res) {
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
        sessions: [],
        stats: { total_sessions: 0, active_now: 0, unique_employees: 0, by_module: {}, by_department: {} },
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'Supabase no configurado'
      });
    }

    // Parse query params
    const { employee_id, department, module: moduleFilter, days = '30' } = req.query;
    const daysNum = parseInt(days) || 30;
    const dateThreshold = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString();

    // Base query
    let query = supabase
      .from('active_sessions')
      .select('*')
      .gte('session_start', dateThreshold)
      .order('session_start', { ascending: false });

    // Apply filters
    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    if (department) {
      // Filter by department in metadata
      // This is a workaround since Supabase doesn't support JSON filtering easily
      // We'll filter in-app
    }

    if (moduleFilter) {
      // Filter by module in metadata
      // We'll filter in-app
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(200).json({
        sessions: [],
        total: 0,
        timestamp: new Date().toISOString()
      });
    }

    // In-app filtering for department and module
    let filtered = sessions || [];

    if (department) {
      filtered = filtered.filter(s =>
        s.metadata?.department?.toLowerCase() === department.toLowerCase()
      );
    }

    if (moduleFilter) {
      filtered = filtered.filter(s =>
        s.metadata?.current_module === moduleFilter ||
        s.metadata?.last_module === moduleFilter
      );
    }

    // Enrich data
    const enriched = filtered.map(s => ({
      session_id: s.conversation_id,
      user_name: s.metadata?.name || s.metadata?.user_name || 'Unknown',
      employee_id: s.employee_id,
      department: s.metadata?.department || 'N/A',
      current_module: s.metadata?.current_module || 'Unknown',
      progress_percent: calculateProgress(s.metadata?.current_module),
      session_start: s.session_start,
      last_activity: s.last_activity,
      duration_minutes: Math.round(
        (new Date(s.last_activity) - new Date(s.session_start)) / 1000 / 60
      ),
      role: s.metadata?.role || 'Trainee',
      status: isSessionActive(s.last_activity) ? 'Activo' : 'Completado'
    }));

    // Summary stats
    const stats = {
      total_sessions: enriched.length,
      active_now: enriched.filter(s => s.status === 'Activo').length,
      unique_employees: new Set(enriched.map(s => s.employee_id)).size,
      by_module: {
        'modulo-f': enriched.filter(s => s.current_module === 'modulo-f').length,
        'modulo-0': enriched.filter(s => s.current_module === 'modulo-0').length,
        'modulo-1': enriched.filter(s => s.current_module === 'modulo-1').length,
        'otros': enriched.filter(s => !['modulo-f', 'modulo-0', 'modulo-1'].includes(s.current_module)).length
      },
      by_department: {}
    };

    // Count by department
    enriched.forEach(s => {
      stats.by_department[s.department] = (stats.by_department[s.department] || 0) + 1;
    });

    return res.status(200).json({
      sessions: enriched,
      stats,
      total: enriched.length,
      filtered_by: { employee_id, department, module: moduleFilter, days: daysNum },
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Error en /api/sessions/history:', e.message);
    return res.status(200).json({
      sessions: [],
      total: 0,
      error: e.message,
      timestamp: new Date().toISOString()
    });
  }
}

function calculateProgress(moduleId) {
  const modules = ['modulo-f', 'modulo-0', 'modulo-1', 'modulo-2', 'modulo-3', 'modulo-4', 'modulo-5', 'modulo-6', 'modulo-7', 'modulo-8', 'modulo-9', 'modulo-10', 'modulo-11', 'modulo-12'];
  const idx = modules.indexOf(moduleId);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / modules.length) * 100);
}

function isSessionActive(lastActivityTime) {
  const diffSeconds = (new Date() - new Date(lastActivityTime)) / 1000;
  return diffSeconds < 300; // 5 minutos
}