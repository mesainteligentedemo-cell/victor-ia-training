# 📂 RUTAS Y URLs — TODOS LOS ARCHIVOS

## 📋 ARCHIVOS PRINCIPALES (Opción B)

### 1️⃣ PUNTO DE ENTRADA
**Archivo:** `00_INICIO_AQUI.md`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\00_INICIO_AQUI.md`  
**Propósito:** Resumen ejecutivo y checklist  
**Acción:** LEE PRIMERO (5 min)

---

### 2️⃣ INSTRUCCIONES COPY-PASTE ELEVENLABS
**Archivo:** `INSTRUCCIONES_ELEVENLABS_COPYPASTE.md`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\INSTRUCCIONES_ELEVENLABS_COPYPASTE.md`  
**Propósito:** Step-by-step para configurar agente (10 pasos exactos)  
**Acción:** LEER Y SEGUIR (45 min)  
**Contiene:**
- Cómo reemplazar el prompt
- Cómo cambiar voz
- Cómo activar RAG
- Cómo crear tools
- Cómo habilitar auth
- Testing & troubleshooting

---

### 3️⃣ PROMPT PARA ELEVENLABS (COPIAR COMPLETO)
**Archivo:** `VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md`  
**Propósito:** System prompt consolidado (19.6K chars)  
**Acción:** COPIAR TODO Y PEGAR EN ELEVENLABS (Settings → System Prompt)  
**Contiene:**
- LOCK 1-4 (identidad, voces, seguridad, verificación)
- 19 módulos del pitch
- 11 principios de neurociencia
- 4 arquetipos DISC
- Hard facts inmutables
- 7 reglas anti-alucinación
- Protocolo curso guiado
- Tools disponibles

---

### 4️⃣ BASE DE CONOCIMIENTO PARA ELEVENLABS
**Archivo:** `ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md` ← NUEVO (verás abajo)  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md`  
**Propósito:** KB para RAG (documentos de contenido extenso)  
**Acción:** SUBIR A ELEVENLABS (Knowledge Base → Add Document)  
**Tamaño:** ~85-95K chars (documento único para fácil indexación)  
**Contiene:**
- Los 16 módulos completos (F, 0-12, Proceso, VTC19) con ejemplos
- Guiones de roleplay (familia MX, pareja MX, quiniela, pareja USA)
- Casos de estudio reales
- Transcripts de simulaciones
- Lista completa de objeciones + respuestas

---

### 5️⃣ CONFIGURACIÓN SUPABASE (BD)
**Archivo:** `supabase-schema.sql`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\supabase-schema.sql`  
**Propósito:** Schema completo (6 tablas + RLS + VIEWs)  
**Acción:** COPIAR TODO Y EJECUTAR EN SUPABASE (SQL Editor)  
**Tiempo:** 5 minutos  
**Contiene:**
- employee_access_log (auditoría)
- conversation_tokens (signed-url)
- employee_module_progress (progreso)
- active_sessions (sesiones vivas)
- employee_performance (KPIs)
- roleplay_feedback (simulaciones)
- 3 VIEWs para reportes
- RLS (Row Level Security)

---

### 6️⃣ ENDPOINT AUTENTICACIÓN (Vercel)
**Archivo:** `api/signed-url.js`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\api\signed-url.js`  
**Propósito:** Genera tokens firmados para conectar a ElevenLabs  
**Acción:** COPIAR A TU PROYECTO Y PUSH A VERCEL  
**Tiempo deploy:** ~2 minutos  
**Responde a:** POST `/api/signed-url`  
**Parámetros:** `{ user_id, user_name, employee_id }`  
**Respuesta:** `{ conversation_id, client_secret, signed_url, expires_at }`

---

### 7️⃣ CÓDIGO WIDGET ACTUALIZADO (Opción B)
**Archivo:** `WIDGET_OPCION_B_SNIPPET.js`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\WIDGET_OPCION_B_SNIPPET.js`  
**Propósito:** Función `startCourse()` actualizada  
**Acción:** COPIAR Y REEMPLAZAR EN `frontend/public/index.html`  
**Reemplaza:** Función `startCourse(name, emp, dep, textOnly)`  
**Nuevo:** Llama a `/api/signed-url` antes de `startSession()`

---

### 8️⃣ RESUMEN & CHECKLIST FINAL
**Archivo:** `RESUMEN_FINAL_OPCION_B.md`  
**Ruta absoluta:** `C:\Users\inbou\victor-ia-training\RESUMEN_FINAL_OPCION_B.md`  
**Propósito:** Impacto funcional, checklist, troubleshooting  
**Acción:** LEER DESPUÉS DE IMPLEMENTAR (verificación)

---

## 🔗 ACCESO DIRECTO A ARCHIVOS (Por orden de uso)

### Orden recomendado de lectura/uso:

```
1. Punto de entrada
   └─ 00_INICIO_AQUI.md
      ↓
2. Bases de datos
   └─ supabase-schema.sql (Ejecutar en Supabase)
      ↓
3. Backend
   └─ api/signed-url.js (Copiar a Vercel)
      ↓
4. Frontend
   └─ WIDGET_OPCION_B_SNIPPET.js (Mergear en index.html)
      ↓
5. Agente (ElevenLabs)
   ├─ VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md (System Prompt)
   ├─ ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md (Knowledge Base)
   └─ INSTRUCCIONES_ELEVENLABS_COPYPASTE.md (Step-by-step)
      ↓
6. Verificación
   └─ RESUMEN_FINAL_OPCION_B.md (Checklist)
```

---

## 📋 RESUMEN DE RUTAS

| # | Archivo | Ruta Completa |
|---|---|---|
| 1 | 00_INICIO_AQUI.md | `C:\Users\inbou\victor-ia-training\00_INICIO_AQUI.md` |
| 2 | supabase-schema.sql | `C:\Users\inbou\victor-ia-training\supabase-schema.sql` |
| 3 | api/signed-url.js | `C:\Users\inbou\victor-ia-training\api\signed-url.js` |
| 4 | WIDGET_OPCION_B_SNIPPET.js | `C:\Users\inbou\victor-ia-training\WIDGET_OPCION_B_SNIPPET.js` |
| 5 | VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md | `C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md` |
| 6 | ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md | `C:\Users\inbou\victor-ia-training\ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md` |
| 7 | INSTRUCCIONES_ELEVENLABS_COPYPASTE.md | `C:\Users\inbou\victor-ia-training\INSTRUCCIONES_ELEVENLABS_COPYPASTE.md` |
| 8 | RESUMEN_FINAL_OPCION_B.md | `C:\Users\inbou\victor-ia-training\RESUMEN_FINAL_OPCION_B.md` |

---

## 🌐 URLS EN PRODUCCIÓN

| Sistema | URL |
|---|---|
| **Sitio Víctor** | https://victor-ia-training.vercel.app |
| **ElevenLabs Dashboard** | https://elevenlabs.io/app/conversational-ai |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **Vercel Deployments** | https://vercel.com/dashboards/projects/victor-ia-training |

---

## 📂 ESTRUCTURA COMPLETA DE PROYECTO

```
C:\Users\inbou\victor-ia-training\
├── 00_INICIO_AQUI.md
├── INSTRUCCIONES_ELEVENLABS_COPYPASTE.md
├── VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md
├── ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md ← KB para subir a ElevenLabs
├── RESUMEN_FINAL_OPCION_B.md
├── WIDGET_OPCION_B_SNIPPET.js
├── supabase-schema.sql
├── ARCHIVOS_RUTAS_Y_URLS.md (este archivo)
│
├── api/
│   ├── verify-employee.js (ya existe)
│   └── signed-url.js (NUEVO)
│
├── frontend/
│   └── public/
│       └── index.html (actualizar con WIDGET_OPCION_B_SNIPPET.js)
│
├── scripts/
│   └── sync-prompt-to-elevenlabs.py (ya existe)
│
└── [otros archivos del proyecto...]
```

---

## ✅ QUICK LINKS

**Para Supabase:**
→ Ve a: https://supabase.com/dashboard  
→ SQL Editor  
→ Copia `supabase-schema.sql`  
→ Pega y ejecuta

**Para Vercel:**
→ Ve a: https://vercel.com/dashboards/projects/victor-ia-training  
→ Deployments  
→ Espera que se sincronice

**Para ElevenLabs:**
→ Ve a: https://elevenlabs.io/app/conversational-ai  
→ Agent "VICTOR-IA"  
→ Settings → System Prompt  
→ Copia `VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md`  
→ Pega
