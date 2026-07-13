// GET /api/sessions/reports
// Retorna PDFs y audios de sesiones completadas
// Query params: ?session_id=X&employee_id=X

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
        reports: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'Supabase no configurado'
      });
    }

    const { session_id, employee_id } = req.query;

    // Query para obtener reportes
    let query = supabase
      .from('capacitacion_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // Retornar array vacío si la tabla no existe aún
      return res.status(200).json({
        reports: [],
        total: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Enriquecer con información de disponibilidad
    const enriched = (reports || []).map(r => ({
      session_id: r.session_id,
      employee_id: r.employee_id,
      user_name: r.user_name || 'Unknown',
      created_at: r.created_at,
      pdf_url: r.pdf_url || null,
      pdf_filename: r.pdf_filename || null,
      audio_url: r.audio_url || null,
      audio_filename: r.audio_filename || null,
      transcript: r.transcript || null,
      has_pdf: !!r.pdf_url,
      has_audio: !!r.audio_url,
      has_transcript: !!r.transcript
    }));

    return res.status(200).json({
      reports: enriched,
      total: enriched.length,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Error en /api/sessions/reports:', e.message);
    return res.status(200).json({
      reports: [],
      total: 0,
      error: e.message,
      timestamp: new Date().toISOString()
    });
  }
}