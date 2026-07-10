# ⚡ INICIO RÁPIDO — ACTIVAR VÍCTOR V7 EN ELEVENLABS

**Tiempo total:** 15 minutos  
**Objetivo:** System Prompt + 7 Knowledge Base Bloques operacionales

---

## 📋 ANTES DE EMPEZAR

Necesitas:
- ✅ Cuenta ElevenLabs activa (login: mesainteligentedemo@gmail.com)
- ✅ Agent VÍCTOR-IA ya creado
- ✅ Acceso a archivos en: `C:\Users\inbou\victor-ia-training\`
- ✅ Navegador (Chrome/Edge/Firefox)

---

## 🎯 PASO 1: ACTUALIZAR SYSTEM PROMPT (2 MINUTOS)

### 1.1 — Abre el archivo local

```
C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V7_COMPLETO.md
```

**Cómo abrir:**
- Clic derecho en archivo
- → "Abrir con"
- → Notepad (o VS Code si tienes)

### 1.2 — Selecciona TODO

```
Ctrl+A  (selecciona todo el contenido)
```

### 1.3 — Copia

```
Ctrl+C  (copia al portapapeles)
```

### 1.4 — Ve a ElevenLabs

1. Abre navegador: **https://elevenlabs.io/**
2. **Login** con: mesainteligentedemo@gmail.com
3. En la barra lateral izquierda, busca: **"Agents"**
4. Haz click en: **"VÍCTOR-IA"**

### 1.5 — Abre Settings

1. Una vez en el agent, busca en la parte **superior derecha**: **⚙️ Settings**
2. Haz click
3. Se abre panel de configuración

### 1.6 — Busca "System Prompt"

En el panel de Settings, desplázate hasta encontrar: **"System Prompt"**

(Puede estar como text box grande o sección separada)

### 1.7 — Borra contenido actual

1. Haz click en la caja de texto del System Prompt
2. Selecciona TODO lo que hay (Ctrl+A)
3. Borra (Delete/Backspace)

### 1.8 — Pega el nuevo Prompt

```
Ctrl+V  (pega todo el contenido que copiaste)
```

**Verás:** El prompt completo aparece (muy largo, normal)

### 1.9 — Guarda

1. Busca botón: **"Save Changes"** o **"Save"** (usualmente abajo-derecha)
2. Haz click
3. Espera a que diga: **"Changes saved"** ✅

---

## 📚 PASO 2: SUBIR KNOWLEDGE BASE — BLOQUES 1-7 (12 MINUTOS)

### Importante: Repetirás este proceso 7 VECES (una por cada bloque)

---

### 🔄 PARA CADA BLOQUE (repite 7 veces):

#### BLOQUE 1: Introducción

**Archivo local:**
```
C:\Users\inbou\victor-ia-training\KB_PREMIUM_BLOQUE_1.md
```

**Nombre en ElevenLabs:**
```
Bloque 1 - Introducción
```

---

### ✏️ INSTRUCCIÓN (para cada bloque):

#### Paso 2.1 — Abre archivo

```
Clic derecho → Abrir con → Notepad
```

#### Paso 2.2 — Selecciona TODO

```
Ctrl+A
```

#### Paso 2.3 — Copia

```
Ctrl+C
```

#### Paso 2.4 — Ve a Knowledge Base en ElevenLabs

1. En ElevenLabs, sigue en **Settings** del agent VÍCTOR-IA
2. Busca: **"Knowledge Base"**
3. Haz click

#### Paso 2.5 — Agrega documento

En la sección Knowledge Base, busca botón: **"+ Add Document"**

Haz click → Se abre ventana de carga

#### Paso 2.6 — Pega contenido

1. En la caja de texto que aparece, pega:
```
Ctrl+V
```

**Verás:** El contenido del bloque aparece en la caja

#### Paso 2.7 — Dale nombre exacto

En campo **"Name"** o **"Document Name"**, escribe:

```
Bloque 1 - Introducción
```

(Ajusta número para cada bloque)

#### Paso 2.8 — Sube/Guarda

Botón: **"Upload"** o **"Save"**

Haz click

#### Paso 2.9 — ESPERA el mensaje

ElevenLabs procesará (2-3 minutos por bloque)

Espera a ver: **"RAG indexing complete"** ✅

**Importante:** No siga al siguiente bloque hasta que vea este mensaje

---

### 📋 LOS 7 BLOQUES (EN ORDEN)

Repite el proceso anterior 7 veces, usando estos datos:

| # | Archivo | Nombre en ElevenLabs |
|---|---------|---------------------|
| 1 | KB_PREMIUM_BLOQUE_1.md | Bloque 1 - Introducción |
| 2 | KB_PREMIUM_BLOQUE_2.md | Bloque 2 - Continuación |
| 3 | KB_PREMIUM_BLOQUE_3.md | Bloque 3 - Cierre |
| 4 | KB_PREMIUM_BLOQUE_4.md | Bloque 4 - Roleplay Inglés |
| 5 | KB_PREMIUM_BLOQUE_5.md | Bloque 5 - Objeciones |
| 6 | KB_PREMIUM_BLOQUE_6.md | Bloque 6 - DISC |
| 7 | KB_PREMIUM_BLOQUE_7.md | Bloque 7 - Parejas |

---

## ⚙️ PASO 3: ACTIVAR RAG (1 MINUTO)

Una vez subidos TODOS los 7 bloques (y todos digan "RAG indexing complete"):

### 3.1 — Ve a Configure RAG

En **Settings → Knowledge Base**, busca sección: **"Configure RAG"**

### 3.2 — Verifica valores

Asegúrate que estén configurados EXACTAMENTE así:

```
☑ RAG Enable:               ON (toggle azul, no gris)
☑ Embedding Model:          e5_mistral_7b_instruct
☑ Max Documents Length:     300000
☑ Max Chunks:               20
```

Si algo está diferente, cámbialo manualmente.

### 3.3 — Guarda

Botón: **"Save Changes"**

Espera a: **"Changes saved"** ✅

---

## 🧪 PASO 4: TESTEAR (30 SEGUNDOS)

### 4.1 — Abre Test Chat

En ElevenLabs, Agent VÍCTOR-IA:
- Busca tab: **"Test"** o **"Chat"**
- Haz click

### 4.2 — Prueba 1: DISC Detection

Escribe exactamente:
```
Hola Víctor, soy Marco de Guadalajara. Soy CEO. 
Quiero viajar más pero eficientemente. 
Muéstrame los números.
```

**Qué debe pasar:**
- ✅ Víctor responde RÁPIDO
- ✅ Números y ROI PRIMERO
- ✅ Directo, sin rodeos (detectó DRIVER)

### 4.3 — Prueba 2: KB Funciona

Escribe:
```
¿Cuáles son los 11 principios de neurociencia?
```

**Qué debe pasar:**
- ✅ Víctor responde los 11 principios exactos
- ✅ Viene de la Knowledge Base (RAG)

---

## ✅ CHECKLIST FINAL

- [ ] System Prompt V7 actualizado en ElevenLabs
- [ ] Bloque 1 subido → "RAG indexing complete"
- [ ] Bloque 2 subido → "RAG indexing complete"
- [ ] Bloque 3 subido → "RAG indexing complete"
- [ ] Bloque 4 subido → "RAG indexing complete"
- [ ] Bloque 5 subido → "RAG indexing complete"
- [ ] Bloque 6 subido → "RAG indexing complete"
- [ ] Bloque 7 subido → "RAG indexing complete"
- [ ] RAG Enable: ON
- [ ] Test 1 (DISC) pasó
- [ ] Test 2 (KB) pasó

Si todos están checkeados: ✅ **VÍCTOR V7 100% OPERACIONAL**

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Problema: "RAG indexing complete" no aparece después de 5 min

**Solución:**
1. Espera 10 minutos total
2. Si sigue sin aparecer, recarga página (F5)
3. Intenta subir el bloque de nuevo

### Problema: Víctor responde pero NO detecta DRIVER

**Solución:**
- Verifica que pegaste TODO el prompt (Ctrl+A antes de pegar)
- Haz click "Save Changes" de nuevo
- Espera 1 minuto
- Intenta test de nuevo

### Problema: "¿11 principios?" y Víctor dice "no sé"

**Solución:**
- Verifica que los 7 bloques digan "RAG indexing complete"
- Verifica que RAG Enable esté ON (toggle azul)
- Espera más (pueden estar indexando aún)

---

## 📞 DESPUÉS DE COMPLETAR

Una vez que TODO esté checkeado ✅:

**Sistema VÍCTOR V7 está 100% listo para:**
- ✅ Entrenar vendedores
- ✅ Detectar DISC automáticamente
- ✅ Generar reportes
- ✅ Roleplay bilingual
- ✅ Análisis de técnicas

**Siguiente:** Sistema de Reportes Automáticos (cuando estés listo)

---

## ⏱️ TIEMPO ESTIMADO

```
Paso 1 (System Prompt):  2 minutos
Paso 2 (7 Bloques KB):   12 minutos (2 min cada uno)
Paso 3 (Activar RAG):    1 minuto
Paso 4 (Testear):        30 segundos
━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                   ~15-16 minutos
```

---

## 🎯 INSTRUCCIONES CLARAS (RESUMEN)

### Para cada bloque KB (repite 7 veces):

```
1. Abre archivo .md local
2. Ctrl+A → Ctrl+C (copia)
3. ElevenLabs → Knowledge Base → "+ Add Document"
4. Pega (Ctrl+V)
5. Nombre exacto ("Bloque X - Nombre")
6. Click "Upload"
7. ESPERA "RAG indexing complete"
8. Sigue con siguiente bloque
```

### Una sola vez después:

```
1. ElevenLabs → Configure RAG
2. Verifica: RAG Enable ON, campos configurados
3. Save Changes
4. Test en chat
5. ✅ LISTO
```

---

## 🚀 ¡VAMOS!

**Abre ahora:**
```
https://elevenlabs.io/
```

**Login y sigue los pasos de arriba.**

**Cuando termines, reporta:** "✅ Completado - VÍCTOR V7 operacional"

Si tienes dudas en cualquier paso, dilo y te ayudo.
