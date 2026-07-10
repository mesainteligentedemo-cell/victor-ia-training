// POST /api/verify-employee
// Body: { name, employee_id }
// Returns: { valid: boolean, role?: string, message?: string, error?: string }
//
// Verificación REAL de empleados VTC — no spoofeable desde el prompt.
// El roster vive en el servidor; el agente ElevenLabs solo recibe valid/role.

import { createClient } from '@supabase/supabase-js';

const ROSTER = [
  { id: "VTC-CL-001", name: "Pablo Solar", role: "Master Closer / Trainer" },
  { id: "VTC-CL-014", name: "Andrés Mateos", role: "Senior Closer" },
  { id: "VTC-CL-023", name: "Christian Soria", role: "Closer" }
];

// Normaliza acentos y mayúsculas para comparar nombres ("andres mateos" == "Andrés Mateos")
function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
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
  // CORS — permite llamadas desde el widget/tool de ElevenLabs
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name, employee_id } = body || {};

  if (!name || !employee_id) {
    return res.status(400).json({ valid: false, error: "Falta name o employee_id" });
  }

  // Búsqueda exacta (case/accent-insensitive) en el roster del servidor
  const idInput = String(employee_id).trim().toUpperCase();
  const match = ROSTER.find(
    e => normalize(e.name) === normalize(name) &&
         (e.id === idInput || e.id.endsWith(idInput) || e.id.includes(idInput))
  );

  // Log de auditoría en Supabase (best-effort, nunca bloquea la respuesta)
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("employee_access_log").insert({
        name,
        employee_id: idInput,
        timestamp: new Date().toISOString(),
        verified: Boolean(match)
      });
    } catch (e) {
      console.error("Supabase log failed:", e.message);
    }
  }

  if (!match) {
    return res.status(403).json({
      valid: false,
      error: "Empleado no encontrado. Contacta a Pablo Solar."
    });
  }

  return res.status(200).json({
    valid: true,
    role: match.role,
    message: `Bienvenido ${match.name}.`
  });
}