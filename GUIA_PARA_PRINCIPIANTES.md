# 🎓 GUÍA COMPLETA PARA PRINCIPIANTES
## (Sin jerga técnica — solo clics y copiar-pegar)

---

# ¿QUÉ VAMOS A HACER?

Imagina que tenemos un **agente Víctor** (un robot de IA que entrena a vendedores). Ahora queremos que sea **más seguro** — que solo la gente de VTC pueda acceder, no cualquiera.

Para eso necesitamos 4 cosas:

1. **Una caja de guardar información** (Base de Datos) — en Supabase
2. **Un portero que verifica quién entra** (Endpoint) — en Vercel
3. **Actualizar el chat** — en el sitio web
4. **Configurar mejor el agente** — en ElevenLabs

**Tiempo total:** 60-90 minutos (pero es muy fácil, solo clics)

---

# 🟦 PASO 1: LA CAJA DE GUARDAR INFORMACIÓN (Supabase)

## ¿Qué es Supabase?
Es como un **archivo digital en la nube** donde guardamos quién accedió, cuándo, y con qué token.

## Pasos:

### 1A: Abre el navegador (Chrome, Firefox, Edge)

**Escribe en la barra de direcciones:**
```
https://supabase.com/dashboard
```

Presiona **ENTER** ↩️

**Resultado esperado:** Una página web con un logo (ballena azul) y un campo que dice "Sign in"

---

### 1B: Loguéate (entra a tu cuenta)

**Busca tu email y contraseña de Supabase:**
- Click en el campo de email
- Escribe tu email
- Click en el campo de contraseña
- Escribe tu contraseña
- Click en botón azul "Sign in"

**Resultado esperado:** Ves tu **proyecto VTC** en la lista

---

### 1C: Entra al proyecto VTC

**Busca en la pantalla "victor-ia" o "VTC"**
- Haz click en ese nombre
- Espera 2-3 segundos

**Resultado esperado:** Una pantalla con muchas opciones en el lado izquierdo (menú)

---

### 1D: Abre SQL Editor

**En el menú izquierdo, busca:**
```
SQL Editor
```
(Puede estar bajo un icono que parece "<>")

- Click en "SQL Editor"
- Espera

**Resultado esperado:** Ves una caja blanca grande (como un editor de texto)

---

### 1E: COPIA el SQL

**Abre este archivo en tu computadora:**
```
C:\Users\inbou\victor-ia-training\supabase-schema.sql
```

**¿Cómo abrir?**
1. Click derecho en el archivo
2. "Abrir con" → "Bloc de notas" o "Visual Studio Code"
3. Se abre el archivo

**Ahora copia TODO:**
- Click en el archivo (para que esté activo)
- Presiona **Ctrl + A** (selecciona todo)
- Presiona **Ctrl + C** (copia)

---

### 1F: PEGA el SQL en Supabase

**En la caja blanca de Supabase:**
1. Click en la caja (para que esté activa)
2. Presiona **Ctrl + V** (pega)

**Resultado esperado:** Ves líneas de código SQL en la caja

---

### 1G: EJECUTA (corre el código)

**En la parte superior derecha de la caja, busca el botón azul grande que dice:**
```
RUN
```

- Click en **RUN**
- Espera 10-20 segundos

**Resultado esperado:** 
- Ves un mensaje verde que dice "Success" o "6 tables created"
- O ves el código se vuelve gris (significa que ya corrió)

**✅ FASE 1 COMPLETADA**

---

# 🟩 PASO 2: EL PORTERO QUE VERIFICA (Vercel)

## ¿Qué es Vercel?
Es donde vive tu sitio web. Ahí vamos a agregar un "portero" que genera un pase de entrada.

## Pasos:

### 2A: Abre GitHub Desktop o línea de comandos

**¿Tienes GitHub Desktop instalado?**

**SI → Opción A (Fácil):**
1. Abre GitHub Desktop
2. Click en "Current Repository" (arriba a la izquierda)
3. Busca "victor-ia-training" en la lista
4. Click en ese proyecto

**NO → Opción B (Terminal):**
1. Abre "Símbolo del sistema" (busca en Windows: "cmd")
2. Escribe esto y presiona ENTER:
```
cd C:\Users\inbou\victor-ia-training
```

---

### 2B: COPIA el archivo `signed-url.js`

**En tu computadora, busca este archivo:**
```
C:\Users\inbou\victor-ia-training\api\signed-url.js
```

**¿Cómo verificar que está ahí?**
1. Abre el explorador de archivos (carpeta en la barra de tareas)
2. Escribe en la barra de direcciones:
```
C:\Users\inbou\victor-ia-training
```
3. Presiona ENTER
4. Busca una carpeta llamada **api**
5. Abre esa carpeta
6. Dentro debe estar el archivo **signed-url.js**

**Si no está:** Créalo (muy fácil).
1. Click derecho en la carpeta **api**
2. "Nuevo" → "Archivo de texto"
3. Cópialo (selecciona todo el contenido abajo y pega)

---

### 2C: Verificar que está en Vercel

**Abre tu navegador:**
```
https://vercel.com/dashboards/projects/victor-ia-training
```

**¿Qué ves?**
1. En el lado izquierdo, busca "Deployments"
2. Click en "Deployments"
3. Espera

**Resultado esperado:** Ves una lista de deployments (despliegues). El último debe tener un **verde "Ready"**

---

### 2D: Git commit (guardar cambios)

**En línea de comandos (o GitHub Desktop):**

**Si usas GitHub Desktop:**
1. En la ventana, busca abajo a la izquierda
2. Escribe en el campo de "Summary":
```
feat: add signed-url endpoint for auth
```
3. Click en botón azul "Commit to main"
4. Click en "Push origin"

**Si usas línea de comandos (cmd):**
```
cd C:\Users\inbou\victor-ia-training
git add api/signed-url.js
git commit -m "feat: add signed-url endpoint for auth"
git push origin main
```

**Resultado esperado:**
- Vercel automáticamente hace deploy (ves en https://vercel.com/dashboards... un nuevo deployment)
- Espera 2-3 minutos

**✅ FASE 2 COMPLETADA**

---

# 🟨 PASO 3: ACTUALIZAR EL CHAT (Widget)

## ¿Qué vamos a hacer?
Cambiar el código del chat para que pida un "pase" (token) antes de conectar.

## Pasos:

### 3A: Abre el archivo `index.html`

**En tu computadora:**
```
C:\Users\inbou\victor-ia-training\frontend\public\index.html
```

**¿Cómo abrir?**
1. Click derecho en el archivo
2. "Abrir con" → "Visual Studio Code" o "Bloc de notas"

**Resultado esperado:** Ves un archivo ENORME con código (no te asustes)

---

### 3B: Busca la función `startCourse`

**En el editor (Bloc de notas o VS Code):**
1. Presiona **Ctrl + F** (abre búsqueda)
2. Escribe:
```
function startCourse
```
3. Presiona ENTER

**Resultado esperado:** La línea se resalta en amarillo

---

### 3C: Reemplaza esa función

**Necesitas encontrar TODO lo que dice `startCourse` hasta el siguiente `function`**

**Es complicado manual. Mejor opción:**

Abre este archivo:
```
C:\Users\inbou\victor-ia-training\WIDGET_OPCION_B_SNIPPET.js
```

- Selecciona TODO (Ctrl + A)
- Copia (Ctrl + C)

Vuelve a `index.html`
- Busca `function startCourse(name, emp, dep, textOnly = false) {`
- Selecciona desde ese `{` hasta el siguiente `}`
- Pega (Ctrl + V)

**⚠️ Si no confías en hacerlo solo, avísame y lo hago yo**

---

### 3D: Guardar

**En el editor:**
- Presiona **Ctrl + S** (guardar)
- Ves que el título cambia (ya no tiene puntito)

---

### 3E: Git commit (subir cambios)

**En línea de comandos:**
```
cd C:\Users\inbou\victor-ia-training
git add frontend/public/index.html
git commit -m "feat: add signed-url token in widget"
git push origin main
```

**Resultado esperado:** Vercel hace otro deploy automático (espera 2-3 min)

**✅ FASE 3 COMPLETADA**

---

# 🟪 PASO 4: CONFIGURAR ELEVENLABS (El agente)

## ¿Qué vamos a hacer?
Cambiar el "cerebro" del agente Víctor para que:
1. Sea más seguro
2. Hable mejor
3. Tenga más conocimiento
4. Funcione con los 8 personajes

## Pasos (10 pasos):

### 4.1: Abre ElevenLabs

**En tu navegador:**
```
https://elevenlabs.io/app/conversational-ai
```

**¿Qué ves?**
1. Logo de ElevenLabs (arriba a la izquierda)
2. Botón "Sign in" (si no estás logueado)

**Si necesitas loguear:**
- Email: (tu email de ElevenLabs)
- Password: (tu contraseña)
- Click "Sign in"

**Resultado esperado:** Ves en el panel izquierdo "VICTOR-IA" o "agent_9501k3vkt6svekjs6y0qe5xzcek1"

---

### 4.2: Entra al agente VICTOR

**En el lado izquierdo, busca:**
```
VICTOR-IA
```

**Click en ese nombre**

**Resultado esperado:** Se abre el agente, ves muchas opciones

---

### 4.3: Abre Settings

**En la parte superior derecha, busca:**
```
Settings
```

**Click en "Settings"**

**Resultado esperado:** Ves un panel con muchas opciones (Audio, Knowledge Base, Security, etc.)

---

### 4.4: REEMPLAZAR PROMPT (Paso crucial)

**En el panel de Settings, busca:**
```
System Prompt
```

(Puede estar en la pestaña "General" o "Configuration")

**Haz click:**
1. Ves una caja GRANDE de texto (el prompt actual)
2. Click en esa caja (para seleccionar)
3. Presiona **Ctrl + A** (selecciona todo el texto actual)
4. Presiona **Delete** (borra todo)

**Ahora copia el NUEVO prompt:**

Abre este archivo:
```
C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md
```

- Selecciona TODO (Ctrl + A)
- Copia (Ctrl + C)

**Vuelve a ElevenLabs:**
- Click en la caja de prompt (vacía ahora)
- Pega (Ctrl + V)

**Ves el texto nuevo**

**Ahora busca el botón azul:**
```
Save Changes
```

**Click en "Save Changes"**

**Espera a que se guarde (ves un mensaje de éxito)**

---

### 4.5: CAMBIAR VOZ

**Aún en Settings, busca:**
```
Primary Voice
```

o 

```
Voice Configuration
```

**Haz click en el dropdown (menú desplegable) que dice la voz actual**

Ejemplo:
```
Current Voice: Victor (generated)
```

**Se abre una lista. Busca:**
```
Enrique M. Nieto
```

**Click en "Enrique M. Nieto"**

**Ves que cambia**

**Ajusta los números (Stability, Boost, etc.):**
- Stability: `0.45`
- Similarity Boost: `0.75`
- Speed: `1.05`

**Click en "Save Changes"**

---

### 4.6: ACTIVAR RAG (Knowledge Base)

**En Settings, busca:**
```
Knowledge Base
```

o

```
RAG
```

**Click en "RAG" o "Knowledge Base"**

**Busca un toggle (interruptor) que diga:**
```
RAG Enabled
```

**Haz click en el toggle para poner ON (debe verse azul)**

**Ajusta:**
- Embedding Model: `e5_mistral_7b_instruct`
- Max Documents Length: `300000`
- Max Chunks: `20`

**Click en "Save Changes"**

---

### 4.7: SUBIR KNOWLEDGE BASE (El contenido grande)

**Aún en Settings, busca:**
```
Knowledge Base
```

o

```
Documents
```

**Click en "Knowledge Base" o "Documents"**

**Ves una lista de documentos (puede estar vacía o con algunos)**

**Busca el botón:**
```
+ Add Document
```

o

```
Upload Document
```

**Click en ese botón**

**Se abre un selector de archivos. Busca:**
```
C:\Users\inbou\victor-ia-training\ELEVENLABS_KNOWLEDGE_BASE_CONSOLIDADA.md
```

**Click en ese archivo**

**Click en "Open" o "Aceptar"**

**Espera a que suba (ve un porcentaje, ej: 50%)**

**Cuando termine, ves el archivo en la lista con status "Indexed" (verde)**

---

### 4.8: CREAR TOOLS (Porteros)

**En Settings, busca:**
```
Tools
```

**Click en "Tools"**

**Ves una lista de tools actuales**

**Busca el botón:**
```
+ Add Tool
```

**Click**

**Se abre un formulario. Llena así:**

**Para la herramienta 1:**
```
Name: verify_employee
Type: Webhook
URL: https://victor-ia-training.vercel.app/api/verify-employee
Method: POST
Description: Verifies that the user is an authorized VTC employee
```

**Parámetros (busca un campo que dice "Parameters" o "Schema"):**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Employee full name (e.g., Pablo Solar)"
    },
    "employee_id": {
      "type": "string",
      "description": "Employee ID (e.g., VTC-CL-001)"
    }
  },
  "required": ["name", "employee_id"]
}
```

**Click en "Save" o "Create Tool"**

**Repite para la herramienta 2:**
```
Name: consultar_historial
Type: Webhook
URL: https://victor-ia-training.vercel.app/api/history
Method: POST
Description: Query employee's previous sessions to resume where they left off
```

**Parámetros:**
```json
{
  "type": "object",
  "properties": {
    "employee_id": {
      "type": "string",
      "description": "Employee ID (e.g., VTC-CL-001)"
    }
  },
  "required": ["employee_id"]
}
```

**Click en "Save"**

---

### 4.9: HABILITAR AUTENTICACIÓN

**En Settings, busca:**
```
Security
```

o

```
Authentication
```

**Click**

**Busca:**
```
Enable Auth
```

**Toggle ON (azul)**

**Busca:**
```
Allowed Origins
```

**Escribe:**
```
https://victor-ia-training.vercel.app
http://localhost:3000
```

**Click en "Save Changes"**

---

### 4.10: PUBLISH (Publicar)

**En la parte superior, busca:**
```
Status: Draft
```

o

```
Publish
```

**Click en el botón azul para cambiar a "Published"**

**Espera a que aparezca un mensaje "Published ✓"**

---

## ✅ FASE 4 COMPLETADA

**Resultado esperado:** 
- Prompt nuevo cargado ✓
- Voz: Enrique M. Nieto ✓
- RAG activado ✓
- KB indexada (documento verde) ✓
- 2 tools creadas ✓
- Auth habilitado ✓
- Agente Published ✓

---

# 🎉 VERIFICACIÓN FINAL

## ¿Cómo saber que todo funciona?

### Prueba 1: Supabase
1. Abre: https://supabase.com/dashboard
2. Tu proyecto VTC
3. Click en "SQL Editor"
4. Escribe:
```
SELECT * FROM employee_access_log;
```
5. Click en "RUN"
6. **Resultado esperado:** Ves una tabla (vacía o con datos)

### Prueba 2: Vercel
1. Abre: https://victor-ia-training.vercel.app
2. Debe cargar el sitio (ves el chat)
3. **Resultado esperado:** Sin errores

### Prueba 3: ElevenLabs
1. Abre: https://elevenlabs.io/app/conversational-ai
2. Tu agente VICTOR-IA
3. Click en "Test" o "Chat"
4. Escribe:
```
Hola, soy Andrés Mateos, VTC-CL-014
```
5. **Resultado esperado:** 
   - El agente responde
   - Dice: "Bienvenido Andrés Mateos"
   - La voz suena profesional (Enrique)

### Prueba 4: Widget en vivo
1. Abre: https://victor-ia-training.vercel.app
2. Llena el gate (nombre: "Andrés Mateos", ID: "VTC-CL-014", dept: "Closer")
3. Click en "Comenzar capacitación"
4. **Resultado esperado:** Chat conecta, agente responde

---

# ❓ SI ALGO NO FUNCIONA

### Error: "SQL error" en Supabase
**Solución:**
- Verifica que copiaste TODO el archivo `supabase-schema.sql`
- Intenta línea por línea (copy-paste de pequeños fragmentos)

### Error: "404" en /api/signed-url
**Solución:**
- Verifica que el archivo `api/signed-url.js` está en tu proyecto
- Espera 5 minutos (a veces Vercel tarda en redeployar)
- Presiona F5 en Vercel dashboard para refrescar

### Error: "Cannot find startCourse" 
**Solución:**
- Abre `index.html` nuevamente
- Busca `function startCourse`
- Asegúrate de haber reemplazado solo esa función

### Error: "ElevenLabs Save Changes no funciona"
**Solución:**
- Copia MENOS líneas de código
- Intenta en pequeños fragmentos
- O contacta a ElevenLabs support

---

# 📞 RESUMEN ULTRA-RÁPIDO

1. **Supabase:** Copia SQL → Pega en SQL Editor → RUN
2. **Vercel:** Copiar archivo → git push → Deploy automático (espera 3 min)
3. **Widget:** Busca startCourse → Reemplaza → git push
4. **ElevenLabs:** 10 pasos (prompt, voz, RAG, tools, auth, publish)

**Tiempo total:** 60-90 minutos

**Dificultad:** MUY FÁCIL (solo copiar-pegar y clics)

---

# 🎓 EXPLICACIÓN SIMPLE DE QUÉ PASA

**Antes (Opción A):**
- Tú abres el sitio → Chat conecta
- Cualquiera con el código puede copiar el agente → Problema

**Después (Opción B):**
- Tú abres el sitio → Chat pide token → Token firmado → Chat conecta
- Cualquiera que copie el agente sin el token → RECHAZADO 403 → No funciona
- Seguro ✓

---

**¿Listo para empezar?**

Comienza con **PASO 1 (Supabase)** — son solo 5 minutos.

¿Dudas en algún paso? Avísame y te lo explico más.

✅ **TODO ESTÁ LISTO, SOLO TIENES QUE HACER CLICS**
