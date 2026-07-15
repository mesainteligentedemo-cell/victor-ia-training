# ✅ CHECKLIST RÁPIDA — COPIA Y PEGA

**Copia este checklist y marca conforme avances**

---

## 🔴 TAREAS CRÍTICAS (15 min)

### Tarea 1: ElevenLabs API Key (3 min)
```
□ Abre https://elevenlabs.io/app/api-keys
□ Click "Create a new API key"
□ Copia la NUEVA key (sk_...)
□ Abre https://vercel.com
□ Proyecto: victor-ia-tracker
□ Settings → Environment Variables
□ Variable: ELEVENLABS_API_KEY = [NUEVA_KEY]
□ Click "Save and Deploy"
```

### Tarea 2: SMTP Hostinger (2 min)
```
□ Abre https://panel.hostinger.com
□ Email → Email Accounts
□ noreply@victor-ia.com → ⚙️ → Edit Password
□ Genera NUEVA password (guarda en notas)
□ Abre https://vercel.com
□ Proyecto: victor-ia-tracker
□ Settings → Environment Variables
□ Variable: SMTP_PASSWORD = [NUEVA_PASSWORD]
□ Click "Save and Deploy"
```

### Tarea 3: Agregar CC en N8N ⭐ (2 min)
```
□ Abre https://n8n.srv1013903.hstgr.cloud
□ Busca workflow: "Victor IA — ElevenLabs Post-Call"
□ Click en el nombre
□ Busca nodo: "Email SMTP"
□ Click en el nodo
□ Desplázate al campo: CC
□ Escribe: chrisoria16@gmail.com,mesainteligentedemo@gmail.com
□ Click "Save" (en el nodo)
□ Click "Save" (arriba a la derecha del workflow)
```

### Tarea 4: Telegram Token (2 min) — OPCIONAL
```
□ Abre Telegram
□ Busca: @BotFather
□ Escribe: /mybots
□ Selecciona: Victor IA Coach
□ Opción: API Token
□ Click "Regenerate token"
□ Copia NUEVO token
□ Vercel → Environment Variables
□ Variable: TELEGRAM_BOT_TOKEN = [NUEVO_TOKEN]
□ Click "Save and Deploy"
```

### Tarea 5: N8N Credentials (1 min)
```
□ Abre https://n8n.srv1013903.hstgr.cloud
□ Click ⚙️ → Credentials
□ Busca: "Gmail Hostinger"
□ Click "Edit"
□ SMTP Password = [NUEVA de Hostinger]
□ Click "Save"
□ Click "Test connection"
□ ✅ Esperado: "Connection successful"
```

---

## ✅ VALIDACIÓN RÁPIDA (después de Tareas 1-5)

```
□ Vercel variables guardadas (refresh la página)
□ ElevenLabs API key funciona:
  curl -H "xi-api-key: [NUEVA_KEY]" https://api.elevenlabs.io/v1/voices
  ✅ Esperado: JSON con voces (200 OK)

□ SMTP funciona (en N8N):
  Settings → Credentials → Gmail Hostinger → Test connection
  ✅ Esperado: "Connection successful"

□ N8N workflow está ACTIVO:
  Abre "Victor IA — ElevenLabs Post-Call"
  ✅ Toggle azul en ON

□ CC field está correcto:
  Email SMTP nodo → CC = chrisoria16@gmail.com,mesainteligentedemo@gmail.com
  ✅ Correcto
```

---

## 📋 COPIAS A ELEVENLABS (después de Tareas 1-5)

```
□ Abre https://app.elevenlabs.io
□ Agentes → Selecciona "Coach VÍCTOR"
□ Settings → System Prompt

□ Copia contenido COMPLETO de:
  C:\Users\inbou\victor-ia-training\SYSTEM_PROMPT_V30_FINAL_COMPLETE.md
  
□ Pega en ElevenLabs System Prompt
□ Click "Save"

---

□ Abre https://app.elevenlabs.io
□ Agentes → "Coach VÍCTOR"
□ Knowledge Base → Add KB

REPITE 7 VECES para cada archivo:

□ Copia contenido de: KB_BLOQUE_1_FUNDAMENTOS_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"

□ Copia contenido de: KB_BLOQUE_2_TOUR_PRESENTACION_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"

□ Copia contenido de: KB_BLOQUE_3_OBJECIONES_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"

□ Copia contenido de: KB_BLOQUE_4_INGLES_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"

□ Copia contenido de: KB_BLOQUE_5_NACIONALIDADES_LEGAL_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"

□ Copia contenido de: KB_BLOQUE_6_DISC_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"

□ Copia contenido de: KB_BLOQUE_7_COMBINACIONES_PAREJA_COMPLETO.md
  □ Pega en ElevenLabs
  □ Click "Save"
```

---

## 🧪 TEST FINAL (después de Copias)

```
□ Abre Coach VÍCTOR en ElevenLabs
□ Inicia sesión: Pablo Solar
□ Completa 1 módulo (puede ser simulado)
□ Espera 30 segundos
□ Verifica inbox de:
  □ mesainteligentedemo@gmail.com (debe tener email en Inbox)
  □ chrisoria16@gmail.com (debe tener email en Inbox)
  □ eldudemateos@gmail.com (debe tener email en Inbox)

□ Email debe tener:
  □ Asunto: "Sesión [usuario] — Bloque [N] completado | VTC Coach"
  □ HTML profesional con colores
  □ Tabla con resumen
  □ PDF adjunto

□ Verifica tracker:
  □ Abre https://tracker.victor-ia.xyz
  □ Busca sesión más reciente
  □ Verifica que tiene 150+ campos
  □ Verifica que sessionId es correcto
  □ Verifica que timestamp es reciente (<5 min)
```

---

## 📊 VALIDACIÓN COMPLETA

```
DESPUÉS DE TODO, VERIFICA:

Checklist Seguridad:
□ ✅ Credenciales nuevas en Vercel
□ ✅ Contraseñas viejas NO en CLAUDE.md
□ ✅ System Prompt limpio (sin API keys)
□ ✅ Credentials regeneradas

Checklist Funcionalidad:
□ ✅ ElevenLabs API key funciona (curl 200 OK)
□ ✅ SMTP funciona (Test connection pasa)
□ ✅ N8N workflow activo (toggle azul)
□ ✅ Email llega a 3 destinatarios (<5 seg)
□ ✅ Tracker recibe 150+ campos

Checklist ElevenLabs:
□ ✅ System Prompt V30 copiado
□ ✅ 7 Knowledge Bases copiados
□ ✅ Coach VÍCTOR está ACTIVO

Checklist Tests:
□ ✅ Sesión completada sin errores
□ ✅ Email HTML profesional
□ ✅ PDF adjunto presente
□ ✅ Tracker datos completos
```

---

## 🎯 CUANDO TERMINES TODO

Escribe aquí:

**"Listo ✅"**

---

## ⏱️ TIMING

- Tareas 1-5: **15 minutos**
- Copias a ElevenLabs: **10 minutos**
- Test final: **10 minutos**
- **= 35 minutos totales**

✅ **SISTEMA 100% FUNCIONAL EN PRODUCCIÓN**

---

**NOTA:** Si algo no funciona, chequea QUICK-FIX-15MINUTOS.md para más detalles