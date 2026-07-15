# Instrucciones de activación — Coach Víctor

## ⚠️ CORRECCIÓN CRÍTICA ANTES DE EMPEZAR

El Agent ID indicado como "correcto" (`agent_9501k3vkt6svekjs6y0qe5xzcek1`) **ya NO es el que usa el sitio en vivo**. Verificación hecha directamente sobre el código:

- `frontend/public/index.html` (la carpeta que Vercel realmente publica — `outputDirectory: "frontend/public"` en `vercel.json`) tiene: `const AGENT = 'agent_2201kxes45mbfmsvpn8k7b9z3fnm';`
- `api/signed-url.js`, `api/verify-employee.js` y `api/elevenlabs-chat.js` usan el mismo `agent_2201kxes45mbfmsvpn8k7b9z3fnm` como fallback (`process.env.ELEVENLABS_AGENT_ID || 'agent_2201kxes45mbfmsvpn8k7b9z3fnm'`)
- No existe la variable `ELEVENLABS_AGENT_ID` en Vercel (confirmado con `vercel env ls`), así que **no hay override** — el sitio usa `agent_2201kxes45mbfmsvpn8k7b9z3fnm` sí o sí.
- El propio historial de git lo confirma — commit de esta madrugada (2026-07-15, autor `mesainteligentedemo@gmail.com`):
  > `fix(vtc-training): switch to new agent ID, wire voice roster + language detection, kill fabricated report content`
  > *"agent ID now `agent_2201kxes45mbfmsvpn8k7b9z3fnm` (env-overridable via ELEVENLABS_AGENT_ID for easy rollback **if the new agent isn't fully configured on ElevenLabs' side yet**)"*

Esa última frase probablemente explica por qué se pidió este system prompt + KB: el agente nuevo (`agent_2201kxes45mbfmsvpn8k7b9z3fnm`) puede estar vacío o con prompt genérico en el dashboard de ElevenLabs todavía.

`agent_9501k3vkt6svekjs6y0qe5xzcek1` sigue existiendo y sigue siendo real — es el agente **"Víctor" de `vtc-capacitacion-deploy.vercel.app`**, un sitio hermano distinto con su propio pipeline de reportes (n8n → `eldudemateos@gmail.com`, webhook `elevenlabs-postcall`). Ese webhook y ese agente **no se tocan** — siguen siendo correctos para ESE otro sitio.

**→ Para victor-ia-training.vercel.app, edita `agent_2201kxes45mbfmsvpn8k7b9z3fnm`, no el 9501k...**

Si prefieres mantener el rollback tal como está documentado en el commit (por si el agente nuevo no está listo), avísame y regreso el fallback a `agent_9501k3vkt6svekjs6y0qe5xzcek1` en el código en vez de tocar ElevenLabs — pero mientras el código diga `2201k...`, es ahí donde debe vivir este system prompt.

---

## PASOS EXACTOS

1. Ir a **https://elevenlabs.io/app/agents**
2. Buscar el agente **`agent_2201kxes45mbfmsvpn8k7b9z3fnm`** (confirmar el ID en la URL del agente, no solo el nombre visible)
3. Click **Edit**
4. Campo **"System Prompt"** → borrar todo el contenido actual → pegar íntegro el contenido de [`COACH_VICTOR_SYSTEM_PROMPT.md`](C:\Users\inbou\victor-ia-training\COACH_VICTOR_SYSTEM_PROMPT.md) (sin el título `# COACH VÍCTOR — SYSTEM PROMPT (copiar...)` de la primera línea — esa línea es solo una nota mía, empieza a copiar desde "Eres **Víctor**...")
5. Campo **"Knowledge Base"** → sube [`COACH_VICTOR_KNOWLEDGE_BASE.md`](C:\Users\inbou\victor-ia-training\COACH_VICTOR_KNOWLEDGE_BASE.md) como documento (opción recomendada — ElevenLabs indexa el .md y hace RAG), o pega el contenido directo si el campo es de texto plano
6. **Guardar**
7. Probar en **https://victor-ia-training.vercel.app/** — el chat/voz debe responder como Víctor, con el nuevo enfoque de 19 módulos + 6 competencias + DISC + neurociencia

---

## VERIFICACIÓN

| Punto | Estado | Nota |
|---|---|---|
| Agent ID correcto en la página | ⚠️ Corregido | Es `agent_2201kxes45mbfmsvpn8k7b9z3fnm`, no `agent_9501k...` (ver arriba) |
| Widget de ElevenLabs carga sin errores | Pendiente de tu prueba en vivo | No se tocó código de frontend en esta tarea |
| Sin cambios visuales | ✅ Cumplido | Solo se crearon 3 archivos de texto nuevos; cero líneas de frontend/backend tocadas |
| Chat funciona inmediatamente | Pendiente de tu prueba tras pegar el prompt en ElevenLabs | Tarea de plataforma, no de código |
| Webhook `elevenlabs-postcall` (n8n) | No aplica a este sitio | Ese webhook pertenece a `vtc-capacitacion-deploy.vercel.app` / `agent_9501k...`. `victor-ia-training` usa su propio pipeline (`api/email-report.js` + `api/generate-report.js`, con `ELEVENLABS_WEBHOOK_SECRET` ya configurado en Vercel pero sin consumidor activo detectado en el código actual) |

## Nota sobre el acceso restringido a 3 usuarios

El system prompt entregado mantiene la validación de acceso (Pablo Solar / Andrés Mateos / Christian Soria) que ya existía en las versiones previas (V32/V33) y en `api/verify-employee.js`, como defensa adicional a nivel de agente. Si ahora quieres abrir el acceso a más personas, dímelo y edito solo esa sección — no requiere tocar código, solo el texto del system prompt.

## Nota sobre por qué el prompt final es distinto a las versiones V6-V33 que ya existen en la carpeta

Las últimas versiones (V29-V33) fueron simplificándose a propósito — sin corchetes, sin emojis, sin tools — para resolver un bug real (ElevenLabs leía en voz alta las etiquetas `[Excited]` etc.) y estaban centradas en los **19 pasos del pitch de venta** (Meet & Greet → No Comes at a Price). Esta versión nueva conserva esa lección (cero corchetes/emojis sigue siendo regla dura) pero cambia el eje: ahora el curriculum son los **19 MÓDULOS de entrenamiento** (F, 0, 1, 2, 2A, 3-12, LVC, M, D, P — el temario completo de `entrenador-timeshare`/MENTOR), con evaluación de 6 competencias, DISC y neurociencia explícitos, tal como se pidió en esta tarea. Los 19 pasos del pitch siguen documentados dentro de la Knowledge Base (tabla de neurociencia), pero ya no son el eje central del system prompt.