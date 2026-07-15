# N8N FIXES CHECKLIST — COACH VÍCTOR × TRACKER × EMAILS
**Fecha:** 2026-07-13  
**Estado:** 🔴 CRÍTICOS (2) | 🟠 ALTOS (1) | 🟡 MEDIANOS (2)

---

## 🔴 CRÍTICO #1: Cambiar Credenciales Expuestas (30 min)

### PASO 1: Regenerar ElevenLabs API Key
1. Abre: https://elevenlabs.io/app/api-keys
2. Haz click en "Create a new API key"
3. Copia la **nueva** key (empieza con `sk_...`)
4. Guarda en: Vercel (NO en CLAUDE.md)

**VERIFICACIÓN:** Nueva key funciona
```bash
curl -H "xi-api-key: [NUEVA_KEY]" https://api.elevenlabs.io/v1/voices
# Debe retornar JSON con voces, NO 401
```

---

### PASO 2: Regenerar Telegram Bot Token
1. Abre Telegram
2. Busca: `@BotFather`
3. Escribe: `/mybots`
4. Selecciona tu bot: `Victor IA Coach`
5. Opción: "API Token"
6. Click "Regenerate token"
7. Copia nuevo token
8. Guarda en: Vercel .env

**VERIFICACIÓN:** Token funciona
```bash
curl -X POST https://api.telegram.org/bot[NUEVO_TOKEN]/getMe
# Debe retornar JSON con "ok": true
```

---

### PASO 3: Cambiar SMTP Hostinger
1. Panel Hostinger: https://panel.hostinger.com/
2. Email → Email Accounts
3. Busca: Cuenta que usas para reportes (ej: noreply@victor-ia.com)
4. Click en ⚙️ → "Edit Password"
5. Genera nueva contraseña (12+ caracteres)
6. Copia contraseña
7. Guarda en: Vercel .env como `SMTP_PASSWORD`

**VERIFICACIÓN:** SMTP funciona
```bash
# En n8n: Settings → Credentials → Edit "Gmail Hostinger"
# Test connection (debe pasar)
```

---

### PASO 4: Actualizar Credenciales en Vercel
1. Abre: https://vercel.com
2. Proyecto: `victor-ia-tracker`
3. Settings → Environment Variables
4. Actualiza:
   - `ELEVENLABS_API_KEY` = [NUEVA_KEY]
   - `TELEGRAM_BOT_TOKEN` = [NUEVO_TOKEN]
   - `SMTP_PASSWORD` = [NUEVA_PASSWORD]
5. Click "Save and Deploy"

**VERIFICACIÓN:** Variables cargadas en vivo
```bash
# Acceder a https://vtc-capacitacion-deploy.vercel.app/api/health
# Debe retornar: { "status": "ok" }
```

---

### PASO 5: Actualizar Credenciales en N8N
1. Abre: https://n8n.srv1013903.hstgr.cloud/
2. Click ⚙️ → Credentials
3. Busca: "Gmail Hostinger" (SMTP)
4. Click Edit
5. Actualiza:
   - **SMTP Host:** `smtp.hostinger.com`
   - **SMTP Port:** `465`
   - **SMTP User:** `noreply@victor-ia.com`
   - **SMTP Password:** [NUEVA_PASSWORD de arriba]
   - **From Email:** `noreply@victor-ia.com`
6. Click "Save"

**VERIFICACIÓN:** Credencial funciona
```
Click "Test connection" en N8N
Debe retornar ✅ sin errores
```

---

### PASO 6: Limpiar CLAUDE.md (YA HECHO ✅)
✅ Credenciales removidas de CLAUDE.md  
✅ Ahora apunta a Vercel .env

---

## 🔴 CRÍTICO #2: Agregar CC a Emails (2 min)

### UBICACIÓN
**N8N Workflow:** `Victor IA — ElevenLabs Post-Call`  
**Workflow ID:** `qE8qzVlqybRA8yvg`  
**Nodo:** `Email SMTP`

### PROBLEMA ACTUAL
Email va SOLO a:
```
To: eldudemateos@gmail.com
```

### DEBE SER
```
To: eldudemateos@gmail.com
CC: chrisoria16@gmail.com,mesainteligentedemo@gmail.com
```

### PASOS PARA ARREGLARLO
1. Abre: https://n8n.srv1013903.hstgr.cloud/
2. Busca workflow: "Victor IA — ElevenLabs Post-Call"
3. Abre el workflow (click en el nombre)
4. Busca el nodo: "Email SMTP" (segunda mitad del canvas)
5. Click en el nodo para editar
6. Desplázate down hasta campo: "CC"
7. Actual: [vacío]
8. Nuevo:
```
chrisoria16@gmail.com,mesainteligentedemo@gmail.com
```
9. Click "Save"
10. Click "Save" (arriba a la derecha del workflow)

### VERIFICACIÓN
- Próximo email que se envíe debe llegar a los 3 destinatarios:
  - ✅ eldudemateos@gmail.com (To)
  - ✅ chrisoria16@gmail.com (CC)
  - ✅ mesainteligentedemo@gmail.com (CC)

---

## 🟠 ALTO: Webhook /agenda-booking 404 (15 min)

### PROBLEMA
```
POST https://n8n.srv1013903.hstgr.cloud/webhook/agenda-booking
→ Response: 404 Not Found
```

### CAUSA
Workflow importado pero credenciales NO reconectadas (usan keys viejas)

### SOLUCIÓN
1. Abre: https://n8n.srv1013903.hstgr.cloud/
2. Busca workflow: "Agenda Booking Handler"
3. Abre (click en nombre)
4. Busca nodo: "Email SMTP"
5. Haz click
6. En el lado derecho, busca campo "Credentials"
7. Dropdown: Selecciona "Gmail Hostinger" (la que actualizaste arriba)
8. Si no aparece, click "✛ Create new credential" y configura con datos de Vercel .env
9. Click "Save"
10. Busca nodo: "Telegram Send"
11. Haz click
12. En el lado derecho, busca "Telegram Bot Token"
13. Actualiza con: [NUEVO_TOKEN regenerado arriba]
14. Click "Save"
15. En la parte superior, toggle: Workflow debe estar ACTIVO (switch azul en ON)
16. Click "Save" (arriba)

### VERIFICACIÓN
```bash
curl -X POST https://n8n.srv1013903.hstgr.cloud/webhook/agenda-booking \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Test User",
    "email":"test@example.com",
    "fecha_cita":"2026-07-15T14:00:00Z"
  }'

# Esperado: HTTP 200 OK
# No esperado: HTTP 404 / 401 / 500
```

---

## 🟡 MEDIO: Reportes Diarios (3-4 horas total)

### Estado Actual
❌ NO están corriendo  
❌ Webhook `session-end` NO existe en ElevenLabs  
❌ Cron job NO existe en N8N

### Qué Se Necesita
1. **Webhook en ElevenLabs** → cuando sesión termina
2. **Cron en N8N** → 23:59 UTC diariamente
3. **Script Python** → genera reporte
4. **Email automático** → a los 3 destinatarios

### PASO A PASO (LUEGO, no hoy)

#### PASO 1: Crear Webhook en ElevenLabs (5 min)
1. Abre: https://app.elevenlabs.io/
2. Settings → Webhooks
3. Click "Add new webhook"
4. Configurar:
   - **URL:** `https://n8n.srv1013903.hstgr.cloud/webhook/session-end`
   - **Event:** `conversation.completed`
   - **Agent:** `agent_5701kr0h5gg6eetb69tv6c5hwfj1` (Coach VÍCTOR)
5. Click "Create"

#### PASO 2: Crear Cron en N8N (20 min)
1. Abre: https://n8n.srv1013903.hstgr.cloud/
2. Click "➕ New workflow"
3. Nombre: "Daily Reporte VÍCTOR — 23:59 UTC"
4. Primer nodo: "Cron"
   - Expression: `0 23 * * *` (23:59 UTC diariamente)
5. Segundo nodo: "HTTP Request"
   - URL: `POST https://vtc-capacitacion-deploy.vercel.app/api/report-batch`
   - Body:
   ```json
   {
     "date": "2026-07-13",
     "output_format": "email",
     "recipients": ["eldudemateos@gmail.com", "chrisoria16@gmail.com", "mesainteligentedemo@gmail.com"]
   }
   ```
6. Tercer nodo: "Email SMTP"
   - Template: HTML con resultados
   - To: `eldudemateos@gmail.com`
   - CC: `chrisoria16@gmail.com,mesainteligentedemo@gmail.com`
7. Click "Save"
8. Toggle Workflow a ON (azul)

#### PASO 3: Verificar Scrip Python (5 min)
- Archivo debe existir: `~/.claude/reporte-generador.py`
- Si NO existe, crear con contenido de: `SISTEMA-REPORTES-DIARIOS-ARQUITECTURA.md`

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Hoy (30 min total — CRÍTICOS)
- [ ] Cambiar ElevenLabs API key
- [ ] Regenerar Telegram token
- [ ] Cambiar SMTP Hostinger
- [ ] Actualizar Vercel .env
- [ ] Actualizar N8N credentials
- [ ] Agregar CC a emails (2 min)
- [ ] Arreglar webhook /agenda-booking

### Esta semana (3-4 horas — MEDIANOS)
- [ ] Crear webhook `session-end` en ElevenLabs
- [ ] Crear cron job 23:59 UTC en N8N
- [ ] Verificar script reporte-generador.py
- [ ] Testear primer reporte diario

---

## 📞 SOPORTE RÁPIDO

| Problema | Solución |
|----------|----------|
| "N8N dice credencial inválida" | Verifica que Vercel .env tiene la **nueva** key (no vieja) |
| "Email no llega a CC" | Verifica que campo CC en nodo Email SMTP tiene ambos correos separados por coma |
| "Webhook /agenda-booking sigue 404" | Verifica que workflow está ACTIVO (toggle azul en ON) |
| "SMTP conexión rechazada" | Verifica puerto 465 (no 587) + usuario/password correctos en N8N |
| "Telegram no envía" | Verifica que bot token sea el **nuevo** (regenerado hoy) |

---

## 📊 VALIDACIÓN FINAL

Cuando termines TODO, verifica:

```bash
# 1. ElevenLabs key funciona
curl -H "xi-api-key: [KEY]" https://api.elevenlabs.io/v1/voices

# 2. Telegram token funciona
curl -X POST https://api.telegram.org/bot[TOKEN]/getMe

# 3. SMTP funciona (desde N8N Settings → Credentials)
# Click "Test connection" → debe pasar ✅

# 4. Webhook /agenda-booking funciona
curl -X POST https://n8n.srv1013903.hstgr.cloud/webhook/agenda-booking \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","fecha_cita":"2026-07-15T14:00:00Z"}'
# Esperado: 200 OK

# 5. Email con CC funciona
# Completar sesión en Coach VÍCTOR → Email debe llegar a 3 destinatarios
```

---

**SIGUIENTE:** Cuando termines estos fixes, avísame para hacer los MEDIANOS (reportes diarios).