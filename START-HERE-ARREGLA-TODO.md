# 🚀 ARREGLA TODO EN 15 MINUTOS

## ⚠️ ESTADO ACTUAL
```
✅ System Prompt V30 — LISTO (credenciales removidas)
✅ 7 Knowledge Bases — LISTO (16 módulos, 4 simulaciones)
✅ Emails automáticos — LISTO (configurados)
✅ Tracker webhook — LISTO (150+ campos)
✅ N8N workflow — LISTO (activo)
⏳ Credenciales — REQUIERE REGENERACIÓN (15 min)
```

---

## 🎯 TAREAS (en orden)

### 1️⃣ Regenerar ElevenLabs API Key (3 min)
```
https://elevenlabs.io/app/api-keys
→ Create new API key
→ Copia la key (sk_...)
→ Vercel: victor-ia-tracker → Environment Variables
→ ELEVENLABS_API_KEY = [NUEVA_KEY]
→ Save and Deploy
```

### 2️⃣ Cambiar SMTP Hostinger (2 min)
```
https://panel.hostinger.com
→ Email → Email Accounts
→ noreply@victor-ia.com → Edit Password
→ Genera NUEVA password (12+ caracteres)
→ Vercel: SMTP_PASSWORD = [NUEVA_PASSWORD]
→ Save and Deploy
```

### 3️⃣ Agregar CC en N8N ⭐ MÁS IMPORTANTE (2 min)
```
https://n8n.srv1013903.hstgr.cloud
→ Busca "Victor IA — ElevenLabs Post-Call"
→ Nodo "Email SMTP"
→ Campo CC = chrisoria16@gmail.com,mesainteligentedemo@gmail.com
→ Save (nodo)
→ Save (workflow)
```

### 4️⃣ Regenerar Telegram Token (2 min) — OPCIONAL
```
Telegram → @BotFather → /mybots → Victor IA Coach
→ API Token → Regenerate
→ Vercel: TELEGRAM_BOT_TOKEN = [NUEVO_TOKEN]
```

### 5️⃣ Actualizar N8N Credentials (1 min)
```
https://n8n.srv1013903.hstgr.cloud
→ ⚙️ → Credentials
→ "Gmail Hostinger" → Edit
→ SMTP Password = [NUEVA de Hostinger]
→ Test connection (debe pasar ✅)
```

---

## ✅ VALIDACIÓN RÁPIDA (5 min después)

**Verifica estos 4 things:**

1️⃣ ElevenLabs key funciona:
```bash
curl -H "xi-api-key: [NUEVA_KEY]" https://api.elevenlabs.io/v1/voices
# Esperado: 200 OK + JSON
```

2️⃣ SMTP funciona:
En N8N: Settings → Credentials → Gmail Hostinger → Test connection (✅)

3️⃣ Email llega a 3 destinatarios:
Completa sesión → Inbox de:
- mesainteligentedemo@gmail.com (To)
- chrisoria16@gmail.com (CC)
- eldudemateos@gmail.com (CC)

4️⃣ Tracker recibe datos:
https://tracker.victor-ia.xyz → Busca sesión más reciente → Verifica 150+ campos

---

## 📁 ARCHIVOS QUE NECESITAS COPIAR A ELEVENLABS

### System Prompt V30
**Ruta:** `C:\Users\inbou\victor-ia-training\SYSTEM_PROMPT_V30_FINAL_COMPLETE.md`
**Destino:** ElevenLabs → Coach VÍCTOR → Settings → System Prompt
**Acción:** Copy todo el contenido y pega

### 7 Knowledge Bases
**Carpeta:** `C:\Users\inbou\victor-ia-training\KB-files-ULTRA-COMPLETOS\`
**Destino:** ElevenLabs → Coach VÍCTOR → Knowledge Base → Add KB (x7)
**Archivos:**
1. KB_BLOQUE_1_FUNDAMENTOS_COMPLETO.md
2. KB_BLOQUE_2_TOUR_PRESENTACION_COMPLETO.md
3. KB_BLOQUE_3_OBJECIONES_COMPLETO.md
4. KB_BLOQUE_4_INGLES_COMPLETO.md
5. KB_BLOQUE_5_NACIONALIDADES_LEGAL_COMPLETO.md
6. KB_BLOQUE_6_DISC_COMPLETO.md
7. KB_BLOQUE_7_COMBINACIONES_PAREJA_COMPLETO.md

---

## 🔒 SEGURIDAD

✅ Credenciales movidas a Vercel .env (encrypted)  
✅ Contraseñas removidas de archivos de código  
✅ System Prompt limpio (sin API keys)  
✅ CLAUDE.md limpio (sin credenciales)  

---

## ⏱️ CRONOGRAMA

```
0 min:   Empieza QUICK-FIX-15MINUTOS.md
3 min:   ✅ TAREA 1 (ElevenLabs API Key)
5 min:   ✅ TAREA 2 (SMTP Hostinger)
7 min:   ✅ TAREA 3 (Agregar CC en N8N) ⭐
9 min:   ✅ TAREA 4 (Telegram Token)
10 min:  ✅ TAREA 5 (N8N Credentials)
15 min:  ✅ Validación rápida
---
= 15 MINUTOS TOTALES
```

---

## 📞 SI ALGO FALLA

**N8N dice "credencial inválida"**
→ Verifica que NUEVA key está en Vercel, no en N8N directo

**Email no llega a CC**
→ Verifica que CC field tiene: `chrisoria16@gmail.com,mesainteligentedemo@gmail.com` (con coma)

**SMTP rechaza conexión**
→ Puerto 465 (NO 587) + NUEVA password de Hostinger

**ElevenLabs API 401**
→ Usa la NUEVA key, no la vieja de CLAUDE.md

---

## 🎯 CUANDO TERMINES TODO

Escribe aquí: **"Listo ✅"**

Y haré validación final en paralelo.

---

**PRÓXIMO:** Lee `QUICK-FIX-15MINUTOS.md` para pasos detallados
