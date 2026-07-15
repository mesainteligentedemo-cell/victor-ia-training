# ✅ VALIDACIÓN FINAL — COACH VÍCTOR 100% FUNCIONAL

**Fecha:** 2026-07-13  
**Estado:** LISTO PARA PRODUCCIÓN  
**Próxima acción:** Ejecutar validación después de terminar QUICK-FIX-15MINUTOS

---

## 📋 CHECKLIST PRE-VALIDACIÓN

Antes de empezar, verifica que completaste TODAS las tareas:

- [ ] ✅ TAREA 1: Nueva ElevenLabs API Key en Vercel
- [ ] ✅ TAREA 2: Nueva SMTP Password en Vercel (Hostinger)
- [ ] ✅ TAREA 3: CC agregado en N8N Email SMTP (CRÍTICA)
- [ ] ✅ TAREA 4: Nuevo Telegram Token en Vercel (opcional)
- [ ] ✅ TAREA 5: N8N Credentials actualizadas con NUEVA password

---

## 🔍 VALIDACIÓN PASO-A-PASO

### PASO 1: Verificar Vercel Environment Variables (1 min)

```bash
# URL: https://vercel.com
# Proyecto: victor-ia-tracker
# Settings → Environment Variables
```

**Debe tener:**
- ✅ `ELEVENLABS_API_KEY` = sk_... (NUEVA)
- ✅ `SMTP_PASSWORD` = [NUEVA_PASSWORD] (Hostinger)
- ✅ `TELEGRAM_BOT_TOKEN` = [NUEVO_TOKEN] (opcional)

**Verificación automática:**
```bash
curl https://victor-ia-tracker.vercel.app/api/health
# Esperado: { "status": "ok" }
```

---

### PASO 2: Verificar ElevenLabs API Key (1 min)

```bash
curl -X GET \
  -H "xi-api-key: [NUEVA_KEY_DE_VERCEL]" \
  https://api.elevenlabs.io/v1/voices

# Esperado:
# HTTP 200
# {
#   "voices": [
#     { "voice_id": "...", "name": "..." },
#     ...
#   ]
# }
```

---

### PASO 3: Verificar N8N Credentials (2 min)

**Ubicación:**
1. Abre: https://n8n.srv1013903.hstgr.cloud
2. Click ⚙️ → **Credentials**
3. Busca: "Gmail Hostinger"

**Verifica:**
- ✅ SMTP Host: `smtp.hostinger.com`
- ✅ SMTP Port: `465`
- ✅ SMTP User: `noreply@victor-ia.com`
- ✅ SMTP Password: [NUEVA de Hostinger]
- ✅ From Email: `noreply@victor-ia.com`

**Prueba:**
Click "Test connection" → Esperado: ✅ Connection successful

---

### PASO 4: Verificar N8N Workflow CC (1 min)

**Ubicación:**
1. Abre: https://n8n.srv1013903.hstgr.cloud
2. Busca workflow: "Victor IA — ElevenLabs Post-Call"
3. Click para abrir

**Verifica:**
- ✅ Workflow está ACTIVO (toggle azul ON)
- ✅ Nodo "Email SMTP" tiene campo **CC** con:
  ```
  chrisoria16@gmail.com,mesainteligentedemo@gmail.com
  ```

**Test:**
Click "Execute workflow" → Esperado: ✅ Sin errores

---

### PASO 5: Sistema Prompt en ElevenLabs (2 min)

**Ubicación:**
1. Abre: https://app.elevenlabs.io
2. Agentes → Selecciona "Coach VÍCTOR"
3. Settings → System Prompt

**Verifica:**
- ✅ System Prompt contiene: Version 30 (identifica línea 1)
- ✅ Email template está presente
- ✅ Webhook tracker está configurado
- ✅ localStorage protocol está presente

**Copiar el contenido completo de:**
`C:\Users\inbou\victor-ia-training\SYSTEM_PROMPT_V30_FINAL_COMPLETE.md`

---

### PASO 6: Knowledge Bases en ElevenLabs (5 min)

**Ubicación:**
1. Abre: https://app.elevenlabs.io
2. Agentes → Selecciona "Coach VÍCTOR"
3. Knowledge Base → Add KB

**Verifica que existen 7 KBs:**
- ✅ KB_BLOQUE_1_FUNDAMENTOS_COMPLETO.md
- ✅ KB_BLOQUE_2_TOUR_PRESENTACION_COMPLETO.md
- ✅ KB_BLOQUE_3_OBJECIONES_COMPLETO.md
- ✅ KB_BLOQUE_4_INGLES_COMPLETO.md
- ✅ KB_BLOQUE_5_NACIONALIDADES_LEGAL_COMPLETO.md
- ✅ KB_BLOQUE_6_DISC_COMPLETO.md
- ✅ KB_BLOQUE_7_COMBINACIONES_PAREJA_COMPLETO.md

**Copiar cada KB de:**
`C:\Users\inbou\victor-ia-training\KB-files-ULTRA-COMPLETOS\`

---

### PASO 7: Test End-to-End (Email) (5 min)

**Objetivo:** Verificar que un email llega a los 3 destinatarios

**Pasos:**
1. Abre Coach VÍCTOR en ElevenLabs
2. Inicia sesión como: **Pablo Solar** (usuario 1)
3. Completa un módulo (cualquiera, puede ser simulado)
4. Cuando el sistema detecte "módulo completado", enviará email automático

**Verificación:**
Espera 30-60 segundos. Luego chequea inbox de:
- ✅ mesainteligentedemo@gmail.com — Email debe estar en **Inbox** (To)
- ✅ chrisoria16@gmail.com — Email debe estar en **Inbox** (CC)
- ✅ eldudemateos@gmail.com — Email debe estar en **Inbox** (CC)

**Email debe contener:**
- ✅ Asunto: "Sesión [usuario] — Bloque [N] completado | VTC Coach"
- ✅ HTML profesional con logo VTC
- ✅ Tabla: Resumen sesión (usuario, módulo, puntuación)
- ✅ PDF adjunto: Reporte detallado

---

### PASO 8: Test End-to-End (Tracker) (5 min)

**Objetivo:** Verificar que datos llegan a tracker.victor-ia.xyz

**Pasos:**
1. Completa otra sesión en Coach VÍCTOR (o la misma)
2. Espera 10-30 segundos
3. Abre: https://tracker.victor-ia.xyz
4. Busca la sesión recent más nueva (sorting por fecha DESC)

**Verificación:**
- ✅ SessionId presente
- ✅ Usuario correcto: "Pablo Solar" (o quien hayas usado)
- ✅ Módulo correcto: "Fundamentos" (o el que completaste)
- ✅ Puntuación quiz: 100% (o la que obtuviste)
- ✅ Timestamp reciente (hace menos de 5 minutos)
- ✅ 150+ campos capturados:
  - userId, sessionId, userName, userEmail
  - moduleId, moduleName, blockId, blockName
  - quizScore, quizAnswers[], videosWatched[], timeSpent
  - neuroscienceMetrics (oxitocina, amígdala, etc.)
  - sentiment, energy, performanceRating
  - (y 100+ más)

**Payload esperado:**
```json
{
  "sessionId": "session_1783963462978_...",
  "userId": "user_123",
  "userName": "Pablo Solar",
  "userEmail": "mesainteligentedemo@gmail.com",
  "moduleId": "modulo_f",
  "moduleName": "Fundamentos",
  "blockId": "bloque_1",
  "blockName": "Bloque 1: Fundamentos",
  "quizScore": 100,
  "timestamp": "2026-07-13T17:24:41.676Z",
  "status": "completado",
  ... (140+ campos más)
}
```

---

## 📊 RESUMEN DE VALIDACIÓN

| Componente | Status | Verificación |
|-----------|--------|--------------|
| **Vercel Env Variables** | ✅ | API Key, SMTP, Telegram nuevos |
| **ElevenLabs API Key** | ✅ | curl test retorna 200 + voices |
| **N8N Credentials** | ✅ | SMTP "Test connection" pasa |
| **N8N Workflow** | ✅ | CC field tiene ambos emails |
| **System Prompt V30** | ✅ | Copiado a ElevenLabs Settings |
| **7 Knowledge Bases** | ✅ | Todos copiados a ElevenLabs KB |
| **Email → 3 destinatarios** | ✅ | Inbox verifica To + CC |
| **Tracker recibe 150+ campos** | ✅ | SessionId + 150+ fields presentes |

---

## ✅ VALIDACIÓN COMPLETADA

Cuando TODOS los checks estén ✅, el sistema está **100% funcional en producción**.

**Resultado esperado:**
- Sistema Prompt V30 operando en ElevenLabs Coach VÍCTOR ✅
- 7 Knowledge Bases completos (16 módulos, 4 simulaciones) ✅
- Emails automáticos llegando a 3 destinatarios ✅
- Tracker recibiendo 150+ campos por sesión ✅
- Webhooks funcionando sin errores ✅
- N8N automation corriendo sin problemas ✅

---

**SIGUIENTE:** Cuando completes TODO, escribe "Listo ✅" y haré validación final en paralelo.