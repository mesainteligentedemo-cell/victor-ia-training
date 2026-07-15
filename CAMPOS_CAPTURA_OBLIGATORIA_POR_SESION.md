# 📋 CAMPOS DE CAPTURA OBLIGATORIA — CADA SESIÓN CON CADA USUARIO

**REGLA CRÍTICA:** TODOS estos campos se capturan automáticamente en CADA interacción. NO puede faltar NINGUNO.

---

## 🔴 SECCIÓN 1: METADATOS DE LA SESIÓN

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `sessionId` | string (UUID) | ✅ | `conv_9801kt7wnsfneynrtjwk5ytssn5b` |
| `fecha` | ISO 8601 | ✅ | `2026-07-13T13:27:00Z` |
| `nombreAgencia` | string | ✅ | `VICTORIOUS TRAVELERS CLUB` |
| `nombreAgente` | string | ✅ | `Víctor` |
| `versionAgente` | string | ✅ | `V29` |
| `tipoReporte` | enum | ✅ | `REPORTE_DE_ENTRENAMIENTO` |

---

## 👤 SECCIÓN 2: INFORMACIÓN DEL USUARIO/EMPLEADO

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `usuarioNombre` | string | ✅ | `Pablo Solar` |
| `usuarioId` | string | ✅ | `emp_123` |
| `departamento` | string | ✅ | `direccion` |
| `statusCierre` | enum | ✅ | `ABIERTO` / `CERRADO` |
| `paisOrigen` | string | ✅ | `México` |
| `emailContacto` | email | ✅ | `pablo.solar@victor-ia.com` |
| `telefonoContacto` | string | ❌ | `+52 555 123 4567` |

---

## 📊 SECCIÓN 3: DESEMPEÑO GLOBAL

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `puntuacionGlobal` | float (0-10) | ✅ | `10.0` |
| `notas_desempenio` | text | ✅ | `El asesor mostró interés en el contenido, pero su participación fue intermitente...` |
| `timestamp_calificacion` | ISO 8601 | ✅ | `2026-07-13T13:27:00Z` |

---

## 📝 SECCIÓN 4: RESUMEN DE LA SESIÓN

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `resumenLlamada` | text (1000+ chars) | ✅ | `El usuario solicitó navegar al módulo de Fundamentos...` |
| `tipoInteraccion` | enum | ✅ | `ROLE_PLAY` / `CLASE` / `PRACTICA` / `CONSULTA` |
| `duracionTotal` | time format (HH:MM) | ✅ | `13:27` |
| `duracionSegundos` | integer | ✅ | `807` |

---

## 🎯 SECCIÓN 5: ESCENARIO DE PRÁCTICA

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `escenarioTipo` | enum | ✅ | `PAREJA` / `INDIVIDUAL` / `GRUPO` |
| `personalidadPrincipal` | enum (DISC) | ✅ | `DRIVER` / `ANALYTIC` / `AMIABLE` / `EXPRESSIVE` |
| `personalidadSecundaria` | enum (DISC) | ❌ | `AMIABLE` |
| `idiomaEscenario` | enum | ✅ | `ESPAÑOL` / `INGLES` |
| `descEscenario` | text | ❌ | `Pareja mexicana: Carlos (Driver), Sandra (Amiable), Carlitos (12 años)` |

---

## 📚 SECCIÓN 6: MÓDULOS PRACTICADOS

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `modulosPracticados` | array[string] | ✅ | `["F", "0", "1", "2", "3"]` |
| `modulosNombres` | array[string] | ✅ | `["Fundamentos", "Psicología", "Calificación", "OPC", "Rapport y PNL"]` |
| `tipoModulos` | enum | ✅ | `COMPLETO` / `PARCIAL` / `MIXTO` |
| `numeroModulosCubiertos` | integer | ✅ | `5` |
| `numeroModulosTotales` | integer | ✅ | `14` |
| `porcentajeCobertura` | float (0-100) | ✅ | `36.0` |

---

## 🎙️ SECCIÓN 7: INFORMACIÓN DE VOZ E IDIOMA

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `idiomaConversacion` | enum | ✅ | `ESPAÑOL` / `INGLES` |
| `tiempoHablado` | time format (HH:MM:SS) | ✅ | `13:27:00` |
| `tiempoHabladoSegundos` | integer | ✅ | `807` |
| `voicesUsadas` | array[string] | ✅ | `["Enrique M. Nieto (español)", "Carlos", "Sandra"]` |
| `deteccionIdiomaAutomatica` | boolean | ✅ | `true` |
| `cambioIdiomaDetectado` | boolean | ❌ | `false` |

---

## 💭 SECCIÓN 8: SENTIMIENTO Y EMOCIÓN

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `sentimientoOverall` | enum | ✅ | `NEUTRO` / `POSITIVO` / `NEGATIVO` / `MIXTO` |
| `energiaUsuario` | enum | ✅ | `ALTO` / `MEDIO` / `BAJO` |
| `enganche_usuario` | float (0-100) | ✅ | `75.0` |
| `satisfaccion_usuario` | float (0-100) | ❌ | `85.0` |

---

## 🎤 SECCIÓN 9: MÉTRICAS DE CONVERSACIÓN

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `totalIntervenciones` | integer | ✅ | `70` |
| `intervencionesAgente` | integer | ✅ | `35` |
| `intervencionesUsuario` | integer | ✅ | `35` |
| `promedioLongitudRespuesta` | float (characters) | ✅ | `245.3` |
| `velocidadConversa` | enum | ✅ | `LENTA` / `NORMAL` / `RAPIDA` |
| `pausasEstrategicas` | integer | ✅ | `12` |

---

## 🧠 SECCIÓN 10: PRINCIPIOS NEUROCIENTÍFICOS ACTIVADOS

| Campo | Tipo | Obligatorio | Ejemplo | Rango |
|-------|------|-------------|---------|-------|
| `oxitocina_porcentaje` | float (0-100) | ✅ | `90` | 0-100% |
| `amigdala_porcentaje` | float (0-100) | ✅ | `90` | 0-100% |
| `neuronasEspejo_porcentaje` | float (0-100) | ✅ | `90` | 0-100% |
| `anclaje_porcentaje` | float (0-100) | ✅ | `90` | 0-100% |
| `reciprocidad_porcentaje` | float (0-100) | ✅ | `90` | 0-100% |
| `escasez_porcentaje` | float (0-100) | ❌ | `75` | 0-100% |
| `autoridad_porcentaje` | float (0-100) | ❌ | `85` | 0-100% |
| `consistencia_porcentaje` | float (0-100) | ❌ | `80` | 0-100% |
| `emocion_porcentaje` | float (0-100) | ❌ | `88` | 0-100% |
| `tribu_porcentaje` | float (0-100) | ❌ | `82` | 0-100% |

---

## 📍 SECCIÓN 11: LÍNEA DE LA CONVERSACIÓN (Timeline)

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `timeline` | array[object] | ✅ | Ver estructura abajo |

**Estructura de cada evento en timeline:**

```json
{
  "timestamp": "00:00",
  "timestampSegundos": 0,
  "accion": "Inicio de conversación",
  "tipo": "HITO" / "PREGUNTA" / "RESPUESTA" / "TRANSICION",
  "speaker": "AGENTE" / "USUARIO",
  "descripcion": "Descripción breve del evento",
  "moduloActivo": "Fundamentos",
  "videoActivo": null,
  "estadoUsuario": "ATENTO" / "DISTRAIDO" / "CONFUNDIDO"
}
```

---

## ✅ SECCIÓN 12: EVALUACIÓN DE DESEMPEÑO — LO QUE HIZO BIEN

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `puntosFuertes` | array[string] | ✅ | `["Explicó cómo neuronas espejo activan confianza", "Calibración visual correcta"]` |
| `descripcionPuntosFuertes` | text | ✅ | `El asesor explicó cómo en el Meet & Greet, una sonrisa genuina...` |
| `metricas_bien` | object | ✅ | `{ "rapport": 95, "pnl": 92, "cierre": 88 }` |

---

## ⚠️ SECCIÓN 13: ÁREAS DE MEJORA

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `areasMejora` | array[string] | ✅ | `["Escucha activa", "Comprensión de intención"]` |
| `descripcionMejora` | text | ✅ | `El asesor debe mejorar en la escucha activa...` |
| `nivelUrgencia` | enum | ✅ | `BAJA` / `MEDIA` / `ALTA` |
| `metricas_mejorar` | object | ✅ | `{ "escucha_activa": 45, "precision": 60 }` |

---

## 🚧 SECCIÓN 14: OBJECIONES ENFRENTADAS

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `objecionesEnfrentadas` | array[object] | ✅ | Ver estructura abajo |

**Estructura de cada objeción:**

```json
{
  "objecion": "Usuario objetó el uso de diferentes voces en role-play",
  "tipo": "METODOLOGIA" / "TECNICA" / "TIEMPO" / "CONTENIDO",
  "momento": "06:42",
  "momentoSegundos": 402,
  "comoCovManejo": "El asesor manejó esto aceptando la objeción y adaptando su explicación",
  "efectividad": "EXCELENTE" / "BUENA" / "ACEPTABLE" / "POBRE",
  "leccionAprendida": "Validar preferencias del usuario antes de ejecutar"
}
```

---

## 🧩 SECCIÓN 15: ANÁLISIS PNL (PROGRAMACIÓN NEUROLINGÜÍSTICA)

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `pnlPatronesIdentificados` | array[string] | ✅ | `["Espejeo", "Calibración", "Marcado Analógico", "Escucha real", "Anclaje", "Reencuadre"]` |
| `pnlPatronesFaltantes` | array[string] | ✅ | `["Patrón Milton"]` |
| `descripcionAnalisisPNL` | text | ✅ | `El asesor utilizó espejeo, calibración, marcado analógico...` |
| `pnlTipsConcretos` | array[string] | ✅ | `["Usar 'frase ancla' en Meet & Greet para quitar miedo"]` |
| `pnlPuntuacion` | float (0-10) | ✅ | `8.5` |

---

## 🎯 SECCIÓN 16: PRÓXIMO DRILL (RECOMENDACIÓN)

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `proximoDrill` | string | ✅ | `Programar una sesión de roleplay enfocada en las primeras fases del proceso de venta` |
| `objetivo` | string | ✅ | `Aplicar los conocimientos teóricos de Meet & Greet, Agenda, Breakfast, Discovery` |
| `duracionRecomendada` | time | ✅ | `90 minutos` |
| `modulosAfocarse` | array[string] | ✅ | `["Meet & Greet", "Agenda", "Breakfast", "Discovery"]` |
| `prioridad` | enum | ✅ | `ALTA` / `MEDIA` / `BAJA` |

---

## 📋 SECCIÓN 17: PLAN DE ACCIÓN PARA EL GERENTE

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `planAccion` | array[object] | ✅ | Ver estructura abajo |

**Estructura de cada acción:**

```json
{
  "paso": 1,
  "accion": "Revisar con el asesor los conceptos clave de PNL y Rapport",
  "responsable": "Gerente",
  "fechaVencimiento": "2026-07-20",
  "prioridad": "ALTA",
  "indicadorExito": "Asesor demuestra 90% comprensión en quiz",
  "tiempoEstimado": "60 minutos"
}
```

---

## 📊 SECCIÓN 18: ANÁLISIS DE APRENDIZAJE (LEARNING ANALYTICS)

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `coberturaDelCurso` | object | ✅ | `{ "modulos_cubiertos": 5, "modulos_totales": 14, "porcentaje": 36 }` |
| `modulosRecorridos` | array[string] | ✅ | `["F", "0", "1", "2", "3"]` |
| `comprensionGeneral` | float (0-10) | ✅ | `6.0` |
| `puntosFuertesAprendizaje` | array[string] | ✅ | `["Mostró interés en PNL", "Conoce fases iniciales del proceso"]` |
| `brechasAprendizaje` | array[string] | ✅ | `["Le costó mantener enfoque en un solo tema"]` |
| `participacion` | enum | ✅ | `PASIVA` / `ACTIVA` / `MUY_ACTIVA` |
| `descripcionParticipacion` | text | ✅ | `Pasiva y reactiva. Solicitó avanzar o explicaciones...` |
| `siguientePasoEstudio` | string | ✅ | `Repasar módulos de Rapport y PNL Básico con enfoque práctico` |

---

## 💡 SECCIÓN 19: NOTA DE E-LEARNING (MEJORAS PARA EL AGENTE)

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `retroalimentacionAgente` | array[string] | ✅ | Ver puntos abajo |

**Puntos a capturar:**
- ✅ Lo que el agente hizo bien
- ✅ Lo que podría mejorar
- ✅ Patrones identificados
- ✅ Sugerencias específicas para la próxima sesión

```json
{
  "punto_1": "Víctor demostró flexibilidad al adaptarse a solicitudes cambiantes",
  "punto_2": "Víctor podría haber intentado hacer preguntas de sondeo para verificar comprensión",
  "punto_3": "Ajustar el comportamiento para formular al menos una pregunta de comprensión después de cada explicación"
}
```

---

## 📹 SECCIÓN 20: ACTIVIDAD DE LA SESIÓN (EVENTOS)

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `eventos` | array[object] | ✅ | Ver estructura abajo |

**Estructura de cada evento:**

```json
{
  "timestamp": "0:22",
  "timestampSegundos": 22,
  "tipo": "MODULO_ABIERTO" / "VIDEO_INICIADO" / "VIDEO_COMPLETADO" / "QUIZ_INICIADO" / "QUIZ_COMPLETADO" / "TRANSICION",
  "detalles": "Entró a F · Fundamentos",
  "moduloAfectado": "Fundamentos",
  "videoAfectado": null,
  "duracion": 18,
  "estado": "COMPLETADO" / "INICIADO" / "PAUSADO"
}
```

---

## 📖 SECCIÓN 21: TRANSCRIPCIÓN COMPLETA

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `transcripcion_completa` | array[object] | ✅ | Ver estructura abajo |

**Estructura de cada línea de conversación:**

```json
{
  "timestamp": "0:00",
  "timestampSegundos": 0,
  "speaker": "AGENTE" / "USUARIO",
  "nombreSpeaker": "Víctor" / "Pablo Solar",
  "texto": "¡Qué gusto verte de nuevo, Pablo Solar! Ya...",
  "caracteres": 45,
  "palabras": 8,
  "tono": "CALOROSO" / "PROFESIONAL" / "DIDACTICO",
  "velocidad": "LENTA" / "NORMAL" / "RAPIDA",
  "emociones_detectadas": ["Entusiasmo", "Bienvenida"]
}
```

---

## 🔗 SECCIÓN 22: METADATOS TÉCNICOS

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `plataforma` | enum | ✅ | `ELEVENLABS` / `CLAUDE_CODE` / `WEB` |
| `sistemaOperativo` | enum | ❌ | `WINDOWS` / `MAC` / `LINUX` |
| `navegador` | enum | ❌ | `CHROME` / `FIREFOX` / `SAFARI` |
| `resolucionPantalla` | string | ❌ | `1920x1080` |
| `conexionInternet` | enum | ❌ | `EXCELENTE` / `BUENA` / `ACEPTABLE` / `POBRE` |
| `latencia` | integer (ms) | ❌ | `45` |
| `versionApp` | string | ✅ | `V29` |

---

## 📤 SECCIÓN 23: WEBHOOK / INTEGRACIÓN CON TRACKER

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|---------|
| `webhookEnviado` | boolean | ✅ | `true` |
| `webhookTimestamp` | ISO 8601 | ✅ | `2026-07-13T13:35:00Z` |
| `webhookEndpoint` | URL | ✅ | `https://tracker.victor-ia.xyz/api/v1/capacitacion/registro` |
| `webhookStatus` | enum | ✅ | `SUCCESS` (200) / `PENDING` / `FAILED` |
| `webhookResponseTime` | integer (ms) | ✅ | `234` |
| `webhookPayload` | object | ✅ | JSON del reporte enviado |
| `reporteGenerado` | boolean | ✅ | `true` |
| `reportePDF_url` | URL | ✅ | `https://tracker.victor-ia.xyz/reportes/conv_9801kt7wnsfneynrtjwk5ytssn5b.pdf` |

---

## ✅ CHECKLIST DE CAMPOS OBLIGATORIOS

### 🔴 CRÍTICOS (Sin estos, no se genera reporte):
- [ ] `sessionId`
- [ ] `fecha`
- [ ] `usuarioNombre`
- [ ] `usuarioId`
- [ ] `modulosPracticados`
- [ ] `puntuacionGlobal`
- [ ] `tiempoHablado`
- [ ] `resumenLlamada`
- [ ] `escenarioTipo`
- [ ] `idiomaConversacion`
- [ ] `principiosNeurocientificos` (oxitocina, amígdala, etc.)
- [ ] `timeline`
- [ ] `transcripcion_completa`
- [ ] `webhookEnviado`

### 🟡 RECOMENDADOS (Mejoran análisis):
- [ ] `sentimientoOverall`
- [ ] `pnlAnalisis`
- [ ] `objecionesEnfrentadas`
- [ ] `areasMejora`
- [ ] `planAccion`
- [ ] `siguientePasoEstudio`

### ⚪ OPCIONALES (Nice to have):
- [ ] `telefonoContacto`
- [ ] `satisfaccion_usuario`
- [ ] `descEscenario`
- [ ] `sistemOPerativo`

---

## 🚀 VALIDACIÓN AUTOMÁTICA

**Antes de enviar webhook, validar:**

```
✅ Todos los campos CRÍTICOS ≠ null
✅ Tipos de datos correctos
✅ Timestamps en ISO 8601
✅ Porcentajes entre 0-100
✅ Arrays no vacíos (al menos 1 elemento)
✅ Texto > 50 caracteres (para descripciones)
✅ URLs válidas (para webhooks)
```

---

**VERSIÓN:** V29 (2026-07-13)
**ÚLTIMO ACTUALIZADO:** 2026-07-13
**PRÓXIMA REVISIÓN:** 2026-08-13