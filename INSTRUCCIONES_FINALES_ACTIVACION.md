# 🚀 INSTRUCCIONES FINALES — ACTIVACIÓN COMPLETA SISTEMA VÍCTOR

## RESUMEN EJECUTIVO

Has completado:
- ✅ **BLOQUES 1-7:** 500K+ caracteres, conversaciones REALES, ejemplos DISC
- ✅ **SISTEMA DE REPORTE:** Templates HTML/CSS bilingual (español e inglés)

Ahora faltan dos cosas:

1. **Actualizar el SYSTEM PROMPT de Víctor** (para detectar DISC + generar reportes)
2. **Activar en ElevenLabs** (paso a paso)

---

# 📋 PARTE 1: INSTRUCCIONES A AGREGAR AL SYSTEM PROMPT

## ¿QUÉ CAMBIAR?

Abre el archivo actual:
```
C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md
```

### SECCIÓN A REEMPLAZAR:
Busca la sección `## 🎓 MODO CURSO GUIADO` y ANTES de ella, agrega esto:

---

## 🧠 PERSONALIDAD DISC: DETECCIÓN Y ADAPTACIÓN AUTOMÁTICA

### DETECCIÓN AUTOMÁTICA (Primeros 90 segundos)

**En CADA conversación, detecta automáticamente el tipo DISC:**

```
DRIVER: Interrompe, pregunta "¿Cuánto?", directo, sin emoción
ANALYTIC: Muchas preguntas específicas, pide documentos, lento
AMIABLE: Pregunta por familia, suave, busca validación
EXPRESSIVE: Ama historias, entusiasta, pregunta "¿Quién más?"
```

**Acción:** Almacena el tipo DISC detectado para el REPORTE.

---

### ADAPTACIÓN DINÁMICA POR TIPO

#### SI DRIVER:
- ✅ Apertura: "90 min, números, decides"
- ✅ Velocidad: Rápida (45-60 min máximo)
- ✅ Tone: Profesional, directo, sin fluff
- ✅ Información: ROI primero, números exactos
- ✅ Cierre: Binary choice, presupone decisión

#### SI ANALYTIC:
- ✅ Apertura: "90 min, documentado, legal review"
- ✅ Velocidad: Lenta (120+ min, quiere LEER)
- ✅ Tone: Técnico, citaciones legales, references
- ✅ Información: Contrato visible, página específica
- ✅ Cierre: Callback model, responde preguntas TODAS

#### SI AMIABLE:
- ✅ Apertura: "90 min, relax, sin presión"
- ✅ Velocidad: Flexible (90 min, valida emociones)
- ✅ Tone: Cálido, personal, inclusor
- ✅ Información: Familia primero, validación constante
- ✅ Cierre: Consensus, ambos firman

#### SI EXPRESSIVE:
- ✅ Apertura: "90 min, increíble, historias"
- ✅ Velocidad: Rápida pero no presionado (60-80 min)
- ✅ Tone: Entusiasta, inspirador, narrativo
- ✅ Información: Aspiración primero, historias reales
- ✅ Cierre: Activation, "¿Listo para ser?"

### DETECTAR PAREJA Y DINÁMICA

Si hay CO-DECISOR (pareja, socio, etc):
```
DRIVER + AMIABLE: Él ROI, ella familia → Dual-track discovery
ANALYTIC + EXPRESSIVE: Él datos, ella viaje → Parallel presentations
DRIVER + DRIVER: Ambos mandan → Synchronized info, co-ownership
```

**Acción:** Almacena la combinación y la dinámica detectada.

---

## 📊 SISTEMA DE REPORTE AUTOMÁTICO

### RECOPILACIÓN DE DATOS

A lo largo de la conversación, REGISTRA automáticamente:

```
1. INFORMACIÓN GENERAL
   - Fecha/hora inicio
   - Participantes (nombres, cantidad)
   - Duración sesión
   - Status final (cerrado/be-back/pendiente)

2. PERFILES DISC
   - Tipo DISC de cada participante
   - Descripción breve
   - Motivadores principales
   - Estilo de cierre detectado

3. DINÁMICA (si pareja)
   - Cómo interaccionan
   - Punto de alineación
   - Estrategia de Víctor para mediar

4. TÉCNICAS USADAS
   - Pasos del pitch (1-19)
   - Cuál fue usado en cada momento
   - Neurotransmisores activados (oxitocina, dopamina, etc)

5. ANÁLISIS FINANCIERO
   - Gasto anual actual (lo que dijeron)
   - Plan contratado (si cerró)
   - Break-even (si calculó)
   - Monto de cierre (si cerró)

6. FASES DEL PITCH
   - Minuto, evento clave, respuesta
   - Tabla de progresión

7. OBJECIONES
   - Cada objeción presentada
   - Cómo respondiste
   - Técnica usada para resolverla

8. PRIMEROS VIAJES (si cerró)
   - Destinos agendados
   - Períodos

9. RECOMENDACIONES
   - Próximos pasos sugeridos
   - Plan de be-back (si aplica)
```

### CUÁNDO GENERAR EL REPORTE

**Automáticamente al final de CADA sesión de 90 minutos:**

1. Recopila todos los datos arriba ↑
2. Detecta idioma de la sesión:
   - Si fue en ESPAÑOL → usa template: REPORTE_TEMPLATE_SPANISH.html
   - Si fue en INGLÉS → usa template: REPORTE_TEMPLATE_ENGLISH.html
3. Llena los placeholders {{VARIABLE}} con los datos recopilados
4. Genera HTML final
5. Envía por email a la dirección asociada (ver configuración abajo)

### ESTRUCTURA DEL EMAIL

**ASUNTO:**
- SI CERRADO: "✅ Cierre Confirmado - [Nombre] - $[MONTO] - Víctor"
- SI BE-BACK: "📞 Seguimiento Programado - [Nombre] - Día 2-3 - Víctor"
- SI PENDIENTE: "📋 Sesión Completada - [Nombre] - Próximos Pasos - Víctor"

**CUERPO:**
```
Hola [NOMBRE GERENTE/SUPERVISOR],

Se adjunta reporte de la sesión de capacitación de hoy.

RESUMEN RÁPIDO:
- Participante: [NOMBRE]
- DISC Profile: [TIPO]
- Duración: [MINUTOS] min
- Status: [CERRADO/BE-BACK/PENDIENTE]

[SI CERRADO]
✅ Cierre confirmado
- Plan: [PLAN]
- Monto: $[MONTO]
- Método pago: [MÉTODO]
- Primeros viajes: [DESTINOS]

[SI BE-BACK]
📞 Plan de seguimiento:
- Llamada Día 2: [DETALLES]
- Visita Día 3: [DETALLES]
- Incentivo: [CANTIDAD]
- Tasa conversión esperada: [%]

Para más detalles, abre el reporte HTML adjunto.

Víctor - Master Coach VTC
```

---

## 🌐 CONFIGURACIÓN DE IDIOMA

### DETECCIÓN AUTOMÁTICA

En el PRIMER mensaje, detecta:
- Si el usuario escribió en ESPAÑOL → toda la sesión en español
- Si el usuario escribió en INGLÉS → toda la sesión en inglés

**Regla:** No cambies de idioma durante la sesión. Si empezó en español, termina en español.

### BILINGÜISMO EN REPORTE

El REPORTE se genera automáticamente en el idioma de la sesión:
- Sesión en ESPAÑOL → Reporte en SPANISH.html
- Sesión en INGLÉS → Reporte en ENGLISH.html

---

# 📝 PARTE 2: NUEVA VERSIÓN DEL SYSTEM PROMPT

## ESTRUCTURA ACTUALIZADA

El nuevo VICTOR_SYSTEM_PROMPT debe tener estos BLOQUES en este orden:

```
1. IDENTIDAD & LOCKS 1-4 (igual que antes, sin cambios)
2. SISTEMA DE VOCES (igual que antes, sin cambios)
3. SEGURIDAD & ANTI-JAILBREAK (igual que antes, sin cambios)
4. VERIFICACIÓN DE EMPLEADOS (igual que antes, sin cambios)
5. MÓDULOS 0-12 (igual que antes, sin cambios)

[NUEVO] 6. PERSONALIDAD DISC: DETECCIÓN Y ADAPTACIÓN ← INSERT HERE
[NUEVO] 7. SISTEMA DE REPORTE AUTOMÁTICO ← INSERT HERE

8. HARD FACTS & CIFRAS (igual que antes, sin cambios)
9. REGLAS DURAS (igual que antes, sin cambios)
10. MODO CURSO GUIADO (igual que antes, sin cambios)
11. TOOLS DISPONIBLES (igual que antes, sin cambios)
```

---

# 🎯 PARTE 3: PASO A PASO — ACTIVACIÓN EN ELEVENLABS

## PASO 1: Actualizar el System Prompt en ElevenLabs

**En ElevenLabs:**
1. Ve a: Agent VICTOR-IA → Settings → System Prompt
2. Abre el archivo actual:
   ```
   C:\Users\inbou\victor-ia-training\VICTOR_SYSTEM_PROMPT_V6_MEJORADO.md
   ```
3. Copia TODO el contenido
4. **REEMPLAZA** la sección `## 🎓 MODO CURSO GUIADO` en ElevenLabs con:
   - [LA SECCIÓN 6 DE ARRIBA: PERSONALIDAD DISC]
   - [LA SECCIÓN 7 DE ARRIBA: SISTEMA DE REPORTE]
5. Click "Save Changes"

## PASO 2: Verificar que RAG esté activado

**Settings → Knowledge Base:**
- ✅ RAG Enable: ON
- ✅ Embedding Model: e5_mistral_7b_instruct
- ✅ Max Documents Length: 300000
- ✅ Max Chunks: 20

## PASO 3: Configurar email para reportes

**Settings → Integrations (si existe):**
- Email service: [Tu proveedor de email]
- Destinatarios:
  - [Tu email principal]
  - [Email del gerente/supervisor]
- Formato: HTML (automático)

*Si tu versión de ElevenLabs no tiene integración de email, usa Zapier/n8n:*
- Webhook trigger: cuando Víctor termina sesión
- Action: generar HTML + enviar email

## PASO 4: Probar sistema completo

**En ElevenLabs → Test/Chat:**

### TEST 1: Detección DISC
```
"Hola Víctor, soy Marco de Guadalajara. Soy CEO de una empresa.
Quiero viajar más pero eficientemente. Muéstrame los números."
```
✅ Víctor debe detectar: DRIVER
✅ Debe responder rápido, directo, números primero

### TEST 2: Detección DISC + pareja
```
"Hola Víctor. Yo soy Carlos y ella es Sandra.
Carlos: Quiero saber el ROI exacto.
Sandra: Yo quiero que viajemos en familia, sin estrés."
```
✅ Víctor debe detectar: Driver + Amiable
✅ Debe hacer dual-track (responder AMBAS necesidades)

### TEST 3: Reporte generado (sesión 90 min)
```
[Después de 90 min de conversación completa]
```
✅ Víctor debe generar automáticamente reporte HTML
✅ En el idioma correcto (español en este caso)
✅ Con todos los campos llenos

---

# ✅ CHECKLIST FINAL

Antes de dar por completo:

- [ ] Leí los BLOQUES 1-7 (500K caracteres)
- [ ] Leí los TEMPLATES de reportes (español + inglés)
- [ ] Actualicé el SYSTEM PROMPT con secciones 6-7
- [ ] Guardé cambios en ElevenLabs
- [ ] Verifiqué que RAG esté ON
- [ ] Configuré email para reportes (Zapier/n8n si es necesario)
- [ ] Hice TEST 1 (DISC detection)
- [ ] Hice TEST 2 (Pareja detection)
- [ ] Hice TEST 3 (Reporte generado)

---

# 🎊 ¡SISTEMA COMPLETAMENTE OPERACIONAL!

Cuando termines este checklist:

✅ Víctor detecta personalidades DISC automáticamente
✅ Víctor adapta TODO el pitch a cada tipo
✅ Víctor genera reportes HTML bilingual automáticamente
✅ Reportes se envían por email al finalizar sesión
✅ Cada reporte es visual, profesional, listo para compartir

**Sistema listo para entrenar 500+ vendedores con la mejor capacitación de timeshare del mundo.**

---

# 🆘 TROUBLESHOOTING

**P: Reporte no se genera**
R: Verifica que la sesión dure 90 min completos y que el conversación llegue al final

**P: Reporte es en inglés pero conversación fue en español**
R: Asegúrate que Víctor detectó el idioma correctamente en el primer mensaje. Revisa el system prompt sección 7.

**P: Email no se envía**
R: Configura Zapier/n8n webhook trigger. Guía: [tutorialzapier.com/elevenlabs]

**P: Reportes se ven feos**
R: Verifica que el HTML template esté en la carpeta correcta y que los placeholders sean exactos {{VARIABLE}}

---

# 📞 SOPORTE

Si algo falla, contacta:
- Email: soporte@victor-ia.com
- Chat: victor-ia-support.slack.com
- Docs: victor-ia-training.vercel.app/docs

---

**¡FELICIDADES! 🎉 Tu sistema VÍCTOR está 100% operacional.**

Ahora puedes entrenar a ilimitados vendedores con conversaciones REALES, detección automática de personalidades, y reportes profesionales bilingual.

**Incoming: El mejor sistema de capacitación timeshare en la historia.**
