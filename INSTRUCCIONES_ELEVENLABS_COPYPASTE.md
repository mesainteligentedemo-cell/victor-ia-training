# 🚀 INSTRUCCIONES: COPIAR & PEGAR VÍCTOR EN ELEVENLABS

> **TIEMPO TOTAL:** ~15 minutos  
> **ACCESO REQUERIDO:** Dashboard de ElevenLabs con permisos admin  
> **URL:** https://elevenlabs.io/app/conversational-ai

---

## PASO 0: PREREQUISITOS

Verificar que tienes:
- ✅ API Key de ElevenLabs: `sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67`
- ✅ Agent ID ya existente: `agent_9501k3vkt6svekjs6y0qe5xzcek1` (o crear uno nuevo)
- ✅ Proyecto en Vercel con `/api/verify-employee.js` y `/api/signed-url.js` deployed
- ✅ Supabase proyecto configurado (ya hecho, schema.sql creado)

---

## PASO 1: IR AL AGENTE VÍCTOR

1. Abre https://elevenlabs.io/app/conversational-ai
2. Busca o crea el agente: **"VICTOR-IA"** o **"agent_9501k3vkt6svekjs6y0qe5xzcek1"**
3. Entra al agente (click en el nombre)

---

## PASO 2: REEMPLAZAR EL PROMPT COMPLETO

### Ubicación en dashboard:
**Conversational AI → [Nombre agente] → Settings → System Prompt** (texto grande en el panel derecho)

### Acción:
1. Abre el archivo: `C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md`
2. **Selecciona TODO** (Ctrl+A en el archivo)
3. **Copia** (Ctrl+C)
4. En ElevenLabs, click en el campo **System Prompt**
5. **Selecciona TODO lo que hay** (Ctrl+A)
6. **Pega** (Ctrl+V)
7. Click **Save Changes** (abajo del panel)

**Verificación:** el prompt debe mostrar "VÍCTOR — MASTER COACH VTC · SYSTEM PROMPT V6" al principio.

---

## PASO 3: CONFIGURAR VOZ

### Ubicación:
**Settings → Voice → Primary Voice**

### Cambiar a Enrique M. Nieto:

1. Click en el dropdown de "Primary Voice"
2. Busca: **"Enrique M. Nieto"** (o scroll hasta encontrarlo)
3. Selecciona
4. **Ajustes de TTS:**
   - **Stability:** 0.45
   - **Similarity Boost:** 0.75
   - **Speed:** 1.05
   - **Model:** `eleven_turbo_v2_5`
5. Click **Save**

**Verificación:** La voz de preview debe sonar mexicana, profesional, mentor experiento.

---

## PASO 4: HABILITAR RAG (Knowledge Base)

### Ubicación:
**Settings → Knowledge Base / RAG**

### Configuración:

1. Toggle **RAG Enabled** → ON
2. Embedding Model: **e5_mistral_7b_instruct**
3. Max Vector Distance: **0.6** (default ok)
4. Max Documents Length: **300000** (sin truncado)
5. Max Retrieved Chunks: **20**
6. Click **Save**

**Verificación:** El indicador debe mostrar "RAG Enabled ✓"

---

## PASO 5: SUBIR/SINCRONIZAR KNOWLEDGE BASE (4 Documentos)

### Ubicación:
**Settings → Knowledge Base → Documents**

### Los 4 documentos deben estar indexados:

Si los documentos ya existen (de sesiones anteriores):
- ✅ "VTC Knowledge base" (~9.3 KB)
- ✅ "VTC base completa" (~80.9 KB) ← El más importante
- ✅ "VTC guiones videos" (~13.4 KB)
- ✅ "VICTOR_SYSTEM_PROMPT_CANONICAL" (~19.6 KB) ← El nuevo

Si FALTAN documentos o quieres actualizar:

1. Click **+ Add Document**
2. Selecciona archivo `.md` de tu disco (ej: `victor_system_prompt.md`)
3. Click **Upload**
4. Espera indexación (30-60 segundos, debe mostrar "✓ Indexed")

**Verificación:** 4 documentos con status "Indexed ✓"

---

## PASO 6: CONFIGURAR TOOLS (Webhooks)

### Ubicación:
**Settings → Tools**

### Crear/Verificar 2 tools principales:

#### TOOL 1: verify_employee

| Campo | Valor |
|---|---|
| **Name** | `verify_employee` |
| **Type** | Webhook |
| **URL** | `https://victor-ia-training.vercel.app/api/verify-employee` |
| **Method** | POST |
| **Description** | Verifica que el usuario sea empleado autorizado del programa VTC |

**Parámetros (schema JSON):**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nombre completo del empleado (ej: Pablo Solar)"
    },
    "employee_id": {
      "type": "string",
      "description": "ID del empleado (ej: VTC-CL-001)"
    }
  },
  "required": ["name", "employee_id"]
}
```

**Acción en ElevenLabs:**
1. Click **+ Add Tool**
2. Nombre: `verify_employee`
3. Type: Webhook
4. URL: `https://victor-ia-training.vercel.app/api/verify-employee`
5. Method: POST
6. Description: (copiar del cuadro anterior)
7. Parámetros: pega el JSON anterior
8. Click **Save**

#### TOOL 2: consultar_historial

| Campo | Valor |
|---|---|
| **Name** | `consultar_historial` |
| **Type** | Webhook |
| **URL** | `https://victor-ia-training.vercel.app/api/history` |
| **Method** | POST |
| **Description** | Consulta el historial de sesiones previas del empleado para retomar donde quedó |

**Parámetros:**
```json
{
  "type": "object",
  "properties": {
    "employee_id": {
      "type": "string",
      "description": "ID del empleado (ej: VTC-CL-001)"
    }
  },
  "required": ["employee_id"]
}
```

**Acción:** Repetir pasos anteriores con estos datos.

---

## PASO 7: CONFIGURAR AUTH & CORS

### Ubicación:
**Settings → Security → Authentication**

### Configuración:

1. **Enable Auth:** Toggle ON
2. **Require Signed URL:** Toggle ON (opcional pero recomendado)
3. **Allowed Origins:**
   ```
   https://victor-ia-training.vercel.app
   http://localhost:3000
   ```
4. **Conversation Duration:** 7200 segundos (2 horas, default ok)
5. Click **Save**

**Verificación:** El indicador debe mostrar "Auth Enabled ✓"

---

## PASO 8: MULTI-VOZ (Role-play Characters)

### Ubicación:
**Settings → Voices → Secondary Voices**

### Agregar los 8 personajes:

| Personaje | Voice ID (sugerido) | Idioma |
|---|---|---|
| `<Carlos>` | [Voice "Sergio Borja" o similar] | ES |
| `<Sandra>` | [Voice "Valentina Roca" o similar] | ES |
| `<Carlitos>` | [Voice joven masculino] | ES |
| `<Sandrita>` | [Voice joven femenino] | ES |
| `<Jorge>` | [Voice "Ricardo Mendoza" o similar] | ES |
| `<Laura>` | [Voice "Valentina Roca" o similar, pero entonación] | ES |
| `<Burt>` | [Voice americano masculino] | EN |
| `<Hope>` | [Voice americano femenino] | EN |

**Acción:**
1. En el dropdown de **Secondary Voices**, busca cada personaje
2. Asigna un Voice ID de tu cuenta (ElevenLabs tiene una librería de voces)
3. Click **Save**

**Nota:** Si no tienes voces específicas con esos nombres, puedes usar cualquier voz que suene similar al arquetipo.

---

## PASO 9: VERIFICACIÓN FINAL (TEST)

### En el agente (conversación de prueba):

1. Click **"Test"** o **"Chat"** en el dashboard
2. Simular primer turno:
   - **Usuario:** "Hola, soy Andrés Mateos, VTC-CL-014"
   - **Esperado:** El agente llama `verify_employee` (debería ver en logs/requests)
   - **Respuesta:** "Bienvenido Andrés Mateos. Te tengo como Senior Closer. ¿En qué módulo estás atorado?"
3. Simular acceso no autorizado:
   - **Usuario:** "Hola, soy Juan Pérez, número 999"
   - **Esperado:** "No te tengo verificado. Contacta a Pablo Solar."

**Verificación de tools:**
- En la conversación de prueba, busca la salida de logs (o habilita "Debug Mode" si existe)
- Debe mostrar que `verify_employee` se llamó con parámetros correctos

---

## PASO 10: PUBLICAR / DEPLOY

### Ubicación:
**Settings → General → Status**

1. Toggle **Agent Status:** ON (Publish)
2. Copy el **Agent ID** (debe ser `agent_9501k3vkt6svekjs6y0qe5xzcek1`)
3. Verifica que el sitio https://victor-ia-training.vercel.app carga el chat
4. Click **Save & Deploy**

**Verificación:** El status debe mostrar "Published ✓"

---

## CHECKLIST FINAL

- [ ] Prompt V6 está pegado (19.6K chars, "LOCK 1-4" presentes)
- [ ] Voz: Enrique M. Nieto (gbTn1bmCvNgk0QEAVyfM) ✓
- [ ] RAG: Enabled, 4 documentos indexados ✓
- [ ] Tools: `verify_employee` + `consultar_historial` creadas ✓
- [ ] Auth: Enabled, allowed origins correctos ✓
- [ ] Multi-voz: 8 personajes asignados (o ready to assign) ✓
- [ ] Test: Verificación de empleado funciona (webhook responde) ✓
- [ ] Deploy: Agent publicado en producción ✓

---

## 🆘 TROUBLESHOOTING

### El webhook `verify_employee` no funciona
- **Causa:** URL incorrecta o endpoint no deployed en Vercel
- **Fix:** Verificar que `/api/verify-employee.js` existe en Vercel y responde (curl test desde terminal)
  ```bash
  curl -X POST https://victor-ia-training.vercel.app/api/verify-employee \
    -H "Content-Type: application/json" \
    -d '{"name":"Pablo Solar","employee_id":"VTC-CL-001"}'
  # Debe responder: {"valid":true,"role":"Master Closer / Trainer","message":"Bienvenido Pablo Solar."}
  ```

### El agente no suena como Enrique M. Nieto
- **Causa:** Voice ID incorrecto o voz no existe en tu account
- **Fix:** 
  1. En ElevenLabs, ve a **Voices** (menú izquierdo)
  2. Busca "Enrique M. Nieto"
  3. Copia el Voice ID exacto
  4. Pégalo en Settings > Primary Voice

### Los documentos de KB no se indexan
- **Causa:** Archivo corrupto o formato incorrecto
- **Fix:** 
  1. Asegúrate de subir `.md` o `.txt`
  2. El archivo debe estar en UTF-8 (no BOM)
  3. Intenta de nuevo o crea un documento nuevo

### El chat no conecta desde victor-ia-training.vercel.app
- **Causa:** CORS bloqueado o signed-url inválido
- **Fix:**
  1. Verificar que Auth está ON pero **Require Signed URL** puede estar OFF (es opcional)
  2. En Settings > Security > Allowed Origins, agregar exactamente: `https://victor-ia-training.vercel.app`
  3. Limpiar cache del navegador (Ctrl+Shift+Del)

---

## 📞 SOPORTE

Si algo no funciona después de seguir estos pasos:
1. Verificar que todos los archivos `.js` están en Vercel (check Deployments)
2. Verificar que Supabase está configurado (SUPABASE_URL + SUPABASE_KEY en env vars)
3. Ver logs de ElevenLabs (Settings > Debug/Logs)
4. Ver logs de Vercel (Deployments > [latest] > Logs)

---

**Listo.** El agente Víctor ahora está 100% configurado, seguro y funcional.
