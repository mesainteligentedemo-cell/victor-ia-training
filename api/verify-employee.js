// POST /api/verify-employee
// Body: { name, employee_id, department }
// Returns: { authorized, valid, role, department, session_token, expires_at, message }
//
// Verificación REAL de empleados VTC — no spoofeable desde el cliente ni el prompt.
// El roster vive en el servidor. Solo estos 3 empleados de Dirección están autorizados.
//
// V8: además emite un session_token (JWT HS256 firmado con crypto nativo, exp 8h) y
// lo persiste best-effort en Supabase `active_sessions` para reanudar sesión sin re-auth.

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// LISTA EXACTA DE EMPLEADOS AUTORIZADOS — no editar sin autorización de Dirección.
const ROSTER = [
  { name: "Pablo Solar",     employee_id: "1234567", department: "Dirección", role: "Master Closer / Trainer" },
  { name: "Christian Soria", employee_id: "123456",  department: "Dirección", role: "Closer" },
  { name: "Andrés Mateos",   employee_id: "12345",   department: "Dirección", role: "Senior Closer" }
];

// Secreto de firma. En producción define SESSION_SECRET en Vercel env.
const SESSION_SECRET = process.env.SESSION_SECRET || 'vtc-victor-ia-session-secret-2026-change-me';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 horas

// Normaliza acentos y mayúsculas para comparar nombres/departamentos
function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// --- JWT HS256 sin dependencias (usa crypto nativo de Node) ---
function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function signSession(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = b64url(crypto.createHmac('sha256', SESSION_SECRET).update(data).digest());
  return `${data}.${sig}`;
}

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
  // CORS — permite llamadas desde el widget/tool de ElevenLabs y el frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ authorized: false, valid: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name, employee_id, department } = body || {};

  if (!name || !employee_id) {
    return res.status(400).json({
      authorized: false,
      valid: false,
      message: "Faltan datos: nombre y número de empleado son requeridos."
    });
  }

  const idInput = String(employee_id).trim();

  // Autorización por nombre + número de empleado (identificador único y estable).
  // El departamento NO se usa para autorizar: su texto depende del idioma del
  // formulario (ES envía "Dirección", EN envía "Leadership"), así que compararlo
  // contra el roster rompería el acceso en inglés. Se conserva solo para el log.
  const match = ROSTER.find(e =>
    normalize(e.name) === normalize(name) &&
    e.employee_id === idInput
  );

  const supabase = getSupabase();

  // Log de auditoría en Supabase (best-effort, nunca bloquea la respuesta)
  if (supabase) {
    try {
      await supabase.from("employee_access_log").insert({
        name,
        employee_id: idInput,
        department: department || null,
        timestamp: new Date().toISOString(),
        verified: Boolean(match)
      });
    } catch (e) {
      console.error("Supabase log failed:", e.message);
    }
  }

  if (!match) {
    return res.status(403).json({
      authorized: false,
      valid: false,
      message: "Acceso denegado. Usuario no autorizado."
    });
  }

  // --- Emitir session_token (JWT HS256, exp 8h) ---
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + SESSION_TTL_SECONDS;
  const sessionUuid = (crypto.randomUUID && crypto.randomUUID()) ||
    crypto.randomBytes(16).toString('hex');
  const session_token = signSession({
    sub: match.employee_id,
    name: match.name,
    department: match.department,
    role: match.role,
    sid: sessionUuid,
    iat: nowSec,
    exp: expSec
  });
  const expires_at = new Date(expSec * 1000).toISOString();

  // Persistir sesión activa (best-effort; columnas según supabase-schema.sql)
  if (supabase) {
    try {
      await supabase.from("active_sessions").insert({
        employee_id: match.employee_id,
        conversation_id: `sess_${sessionUuid}`,
        agent_id: process.env.ELEVENLABS_AGENT_ID || 'agent_2201kxes45mbfmsvpn8k7b9z3fnm',
        session_start: new Date(nowSec * 1000).toISOString(),
        last_activity: new Date(nowSec * 1000).toISOString(),
        metadata: {
          department: match.department,
          role: match.role,
          session_token,
          session_id: sessionUuid,
          expires_at
        }
      });
    } catch (e) {
      console.error("Supabase active_sessions insert failed:", e.message);
    }
  }

  return res.status(200).json({
    authorized: true,
    valid: true,
    role: match.role,
    department: match.department,
    session_token,
    expires_at,
    message: `Acceso autorizado. Bienvenido ${match.name}.`
  });
}