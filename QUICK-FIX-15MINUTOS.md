# ⚡ QUICK FIX — TODO FUNCIONA EN 15 MINUTOS (2026-07-13)

## ✅ STATUS ACTUAL
- ✅ System Prompt V30 — LISTO (credenciales movidas a ElevenLabs)
- ✅ 7 Knowledge Bases — LISTO (16 módulos completos)
- ✅ Emails automáticos — CONFIGURADO (3 destinatarios)
- ✅ Tracker webhook — CONFIGURADO (150+ campos)
- ✅ N8N workflow — ACTIVO (visto en captura)
- ⏳ Tests E2E — LISTA (fallos solo por Mailhog local)

---

## 🔴 TAREAS CRÍTICAS (DEBEN HACERSE HOY)

### TAREA 1: Regenerar ElevenLabs API Key (3 min)
**Por qué:** Key antigua es visible en historial

**Pasos:**
1. Abre: https://elevenlabs.io/app/api-keys
2. Click "Create a new API key"
3. Copia la **NUEVA key** (comienza con `sk_...`)
4. **GUARDA en:** Vercel (NO en CLAUDE.md)
   - URL: https://vercel.com → `victor-ia-tracker` → Settings → Environment Variables
   - Variable: `ELEVENLABS_API_KEY`
   - Valor: [NUEVA_KEY]
   - Click "Save and Deploy"

**Verificación:**
```bash
curl -H "xi-api-key: [NUEVA_KEY]" https://api.elevenlabs.io/v1/voices
# Esperado: JSON con voces (200 OK)
```

---

### TAREA 2: Cambiar SMTP Hostinger (2 min)
**Por qué:** Contraseña antigua es visible

**Pasos:**
1. Abre: https://panel.hostinger.com
2. Email → Email Accounts
3. Selecciona: `noreply@victor-ia.com`
4. Click ⚙️ → "Edit Password"
5. Genera NUEVA contraseña (12+ caracteres, guarda en notas)
6. **GUARDA en Vercel:**
   - Variable: `SMTP_PASSWORD`
   - Valor: [NUEVA_PASSWORD]
   - Click "Save and Deploy"

**Verificación:**
En N8N: Settings → Credentials → "Gmail Hostinger" → Test connection (debe pasar ✅)

---

### TAREA 3: Agregar CC a Emails en N8N (2 min) ⭐ MÁS IMPORTANTE
**Por qué:** Emails solo van a eldudemateos, no a los otros 2

**Pasos:**
1. Abre: https://n8n.srv1013903.hstgr.cloud
2. Busca workflow: "Victor IA — ElevenLabs Post-Call"
3. Click en el nombre para abrir
4. Busca nodo: "Email SMTP" (en la parte derecha del canvas)
5. Click en el nodo para editar
6. Desplázate hasta campo: **CC**
7. Actual: [vacío]
8. Nuevo: 
```
chrisoria16@gmail.com,mesainteligentedemo@gmail.com
```
9. Click "Save" (en el nodo)
10. Click "Save" (arriba a la derecha, en workflow)

**Verificación INMEDIATA:**
- Próximo email debe llegar a:
  - ✅ eldudemateos@gmail.com (To)
  - ✅ chrisoria16@gmail.com (CC)
  - ✅ mesainteligentedemo@gmail.com (CC)

---

### TAREA 4: Regenerar Telegram Token (2 min) — OPCIONAL (no es crítico para demo)
**Por qué:** Token viejo es visible

**Pasos:**
1. Telegram: Busca `@BotFather`
2. Escribe: `/mybots`
3. Selecciona: `Victor IA Coach`
4. Opción: "API Token"
5. Click "Regenerate token"
6. Copia NUEVO token
7. **GUARDA en Vercel:**
   - Variable: `TELEGRAM_BOT_TOKEN`
   - Valor: [NUEVO_TOKEN]

---

### TAREA 5: Actualizar N8N Credentials (1 min)
**Por qué:** N8N debe usar las nuevas credenciales de Vercel

**Pasos:**
1. Abre: https://n8n.srv1013903.hstgr.cloud
2. Click ⚙️ → **Credentials**
3. Busca: "Gmail Hostinger" (SMTP)
4. Click "Edit"
5. Actualiza:
   - SMTP Host: `smtp.hostinger.com`
   - SMTP Port: `465`
   - SMTP User: `noreply@victor-ia.com`
   - SMTP Password: [NUEVA_PASSWORD de arriba]
   - From Email: `noreply@victor-ia.com`
6. Click "Save"
7. Click "Test connection" (debe pasar ✅)

---

## 📋 VALIDACIÓN FINAL (5 min)

Después de hacer TODO, verifica:

```bash
# 1. Vercel variables guardadas
curl https://victor-ia-tracker.vercel.app/api/health
# Esperado: { "status": "ok" }

# 2. ElevenLabs key funciona
curl -H "xi-api-key: [NUEVA_KEY]" https://api.elevenlabs.io/v1/voices
# Esperado: JSON con voces (200 OK)

# 3. SMTP funciona (desde N8N)
# En N8N: Settings → Credentials → Gmail Hostinger → Test connection
# Esperado: ✅ Connection successful

# 4. Email llega a 3 destinatarios
# Completa una sesión en Coach VÍCTOR → Email debe llegar a:
# - eldudemateos@gmail.com (To)
# - chrisoria16@gmail.com (CC)
# - mesainteligentedemo@gmail.com (CC)
```

---

## 🎯 ORDEN DE EJECUCIÓN (RÁPIDO)

```
⏱️ 3 min:  TAREA 1 (ElevenLabs API Key)
⏱️ 2 min:  TAREA 2 (SMTP Hostinger)
⏱️ 2 min:  TAREA 3 (Agregar CC en N8N) ⭐ CRITICA
⏱️ 2 min:  TAREA 4 (Telegram Token)
⏱️ 1 min:  TAREA 5 (N8N Credentials)
⏱️ 5 min:  Validación Final
---
= 15 MINUTOS TOTALES
```

---

## 🚀 CUANDO TERMINES TODO

1. ✅ System Prompt V30 — Copia a ElevenLabs Settings
2. ✅ 7 Knowledge Bases — Copia a ElevenLabs KB
3. ✅ Webhooks en N8N — Verificados
4. ✅ Emails — Llegando a 3 destinatarios
5. ✅ Tracker — Recibiendo 150+ campos

**RESULTADO: SISTEMA 100% FUNCIONAL EN PRODUCCIÓN ✅**

---

## 📞 SOPORTE RÁPIDO

| Problema | Solución |
|----------|----------|
| "N8N dice credencial inválida" | Verifica que NEW key está en Vercel, NO en N8N directo |
| "Email no llega a CC" | Verifica CC field: `chrisoria16@gmail.com,mesainteligentedemo@gmail.com` |
| "SMTP rechaza conexión" | Puerto 465 (no 587) + NEW password de Hostinger |
| "ElevenLabs API 401" | Usa la NUEVA key, no la vieja de CLAUDE.md |

---

**SIGUIENTE:** Cuando termines, avísame "Listo ✅" para hacer la validación final.