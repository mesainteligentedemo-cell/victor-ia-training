# FIX — Endpoints /api/sessions-* (404 → 200)

**Fecha:** 2026-07-12
**Estado:** ✅ Resuelto — 9/9 pruebas Playwright pasan
**Deploy productivo:** https://victor-ia-training.vercel.app

---

## Síntoma

3 endpoints retornaban **404**:
- `/api/sessions-active`
- `/api/sessions-history`
- `/api/sessions-reports`

Los otros 6 endpoints (`email-report`, `signed-url`, `test`, etc.) sí funcionaban.

---

## Diagnóstico (causa raíz)

Fueron **dos** problemas encadenados, no la teoría inicial de "sitio estático vs Next.js":

### Problema 1 — El deploy productivo era anterior a los endpoints (causa del 404)
El último deploy de producción correspondía al commit `8309cba` (19:03).
Los 3 endpoints se agregaron en commits posteriores (19:28–19:45) y **nunca se
desplegó de nuevo**. El auto-deploy de GitHub no está activo en este proyecto —
todos los deploys se hacen manualmente por CLI. Por eso las funciones nuevas
jamás se construyeron y Vercel devolvía 404.

Además, el `vercel.json` en working tree (commit `00d8297`, sin desplegar) tenía
`"outputDirectory": "public"` — un directorio **inexistente** (el `index.html`
vive en `frontend/public/`). Desplegarlo tal cual **habría roto el sitio
estático**.

### Problema 2 — Las funciones crasheaban al cargar (causa del 500 tras el 404)
Una vez desplegadas, retornaban **500 FUNCTION_INVOCATION_FAILED**. El código
instanciaba el cliente en el top-level del módulo con nombres de env vars
**equivocados**:

```js
// ❌ ANTES — nombres inexistentes en Vercel + sin guard
const supabase = createClient(
  process.env.SUPABASE_URL || '',   // no existe → ''
  process.env.SUPABASE_KEY || ''    // no existe → ''
);
```

`createClient('', '')` lanza `supabaseUrl is required` al cargar el módulo →
la función crashea antes de ejecutar el handler.

Las env vars que **sí existen** en Vercel (usadas por `email-report.js`) son
`NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

---

## Solución aplicada

Se descartaron las opciones A (Next.js completo), B (Express) y D (mover al
tracker): el stack actual **estático + funciones serverless zero-config ya
funciona** para 6 endpoints. La corrección mínima y correcta fue:

### 1. `vercel.json` — restaurado a la config probada
```json
{
  "version": 2,
  "buildCommand": "echo 'Static build + zero-config API functions'",
  "outputDirectory": "frontend/public",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [{ "source": "/api/(.*)",
    "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }] }]
}
```
- `outputDirectory` corregido a `frontend/public` (donde está el `index.html`).
- Se eliminó el bloque `functions` con `nodejs18.x` (runtime deprecado en 2026);
  Vercel auto-detecta `api/*.js` sin él, como ya lo hacía con los 6 endpoints.

### 2. Los 3 endpoints — env vars correctas + guard
```js
// ✅ DESPUÉS — mismos nombres que email-report.js + guard
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
```
Y en cada handler, si `supabase` es `null`, se responde **200 con estructura
vacía** en lugar de crashear. Fallback doble de nombres → funcionará tanto en
local como en producción, y automáticamente servirá datos reales en cuanto se
carguen credenciales válidas de Supabase.

---

## Verificación

| Check | Resultado |
|---|---|
| `/api/sessions-active` | **200** ✅ |
| `/api/sessions-history?days=30` | **200** ✅ (incluye `stats`) |
| `/api/sessions-reports` | **200** ✅ |
| Homepage `/` | **200** ✅ (no se rompió) |
| `/api/email-report` | **400** ✅ (sigue funcionando) |
| CORS preflight (OPTIONS) | **200** + `Access-Control-Allow-Origin: *` ✅ |
| Load time (todos) | 0.23–0.50 s (< 2 s) ✅ |
| **Playwright E2E** | **9/9 PASS** ✅ |

---

## Nota operativa importante

- **Supabase no está configurado en producción**: las env vars
  `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` existen en Vercel pero
  con **valor vacío**. Por eso los endpoints devuelven arrays vacíos (respuesta
  correcta y sin errores). Al cargar credenciales reales + crear las tablas
  (`active_sessions`, `capacitacion_reports`, ver `supabase-schema.sql`), los
  endpoints servirán datos reales sin cambios de código.
- **Auto-deploy de GitHub inactivo**: recordar desplegar con `npx vercel --prod`
  tras cada cambio, o conectar el repo a Vercel para deploy automático.

## Commit
`86c51d7 — fix(api): restore serverless routing + fix sessions endpoints 404/500`