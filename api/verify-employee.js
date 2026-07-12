// POST /api/verify-employee
// Body: { name, employee_id, department }
// Returns: { authorized: boolean, message: string, role?: string, valid?: boolean }
//
// Verificación REAL de empleados VTC — no spoofeable desde el cliente ni el prompt.
// El roster vive en el servidor. Solo estos 3 empleados de Dirección están autorizados.

import { createClient } from '@supabase/supabase-js';

// LISTA EXACTA DE EMPLEADOS AUTORIZADOS — no editar sin autorización de Dirección.
const ROSTER = [
  { name: "Pablo Solar",     employee_id: "1234567", department: "Dirección", role: "Master Closer / Trainer" },
  { name: "Christian Soria", employee_id: "123456",  department: "Dirección", role: "Closer" },
  { name: "Andrés Mateos",   employee_id: "12345",   department: "Dirección", role: "Senior Closer" }
];

// Normaliza acentos y mayúsculas para comparar nombres/departamentos
// ("andres mateos" == "Andrés Mateos", "direccion" == "Dirección")
function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Supabase es OPCIONAL (solo auditoría). Si faltan env vars, la verificación sigue funcionando.
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

  // Validación de la combinación EXACTA (nombre + employee_id + departamento).
  // El departamento se valida solo si viene en el body (el tool de ElevenLabs
  // podría no enviarlo); nombre e ID siempre deben coincidir.
  const match = ROSTER.find(e =>
    normalize(e.name) === normalize(name) &&
    e.employee_id === idInput &&
    (department == null || department === "" || normalize(e.department) === normalize(department))
  );

  // Log de auditoría en Supabase (best-effort, nunca bloquea la respuesta)
  const supabase = getSupabase();
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

  return res.status(200).json({
    authorized: true,
    valid: true,
    role: match.role,
    department: match.department,
    message: `Acceso autorizado. Bienvenido ${match.name}.`
  });
}