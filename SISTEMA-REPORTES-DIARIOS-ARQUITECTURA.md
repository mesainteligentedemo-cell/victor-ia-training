# SISTEMA DE REPORTES DIARIOS — ARQUITECTURA COMPLETA

**Objetivo:** Reporte automático a las 11:59 PM con todas las interacciones, transcripciones, gráficos y análisis por usuario.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
ElevenLabs Agent VÍCTOR-IA
        ↓
   (cada interacción)
        ↓
   Webhook Supabase
        ↓
   Base Datos (sessions tabla)
        ↓
   Cron Job (23:59)
        ↓
   Script Python (reporte-generador.py)
        ↓
   ├─ Leer sesiones últimas 24h
   ├─ Agrupar por usuario
   ├─ Generar HTML con gráficos
   ├─ Incluir transcripciones
   ├─ Calcular métricas KPI
   └─ Enviar por email
        ↓
   Email Resend (masivo a gerentes)
        ↓
   Dashboard BI (actualización automática)
```

---

## 📊 CAMPOS A REGISTRAR POR INTERACCIÓN

Cada sesión captura:

```json
{
  "session_id": "uuid",
  "user_id": "vendedor_id",
  "user_name": "Carlos Pérez",
  "user_role": "Closer",
  "timestamp_inicio": "2026-07-10T14:30:00Z",
  "timestamp_fin": "2026-07-10T15:20:00Z",
  "duracion_minutos": 50,
  "
  "disc_profile": "Driver",
  "disc_confidence": 0.92,
  
  "transcripcion": "full text...",
  "resumen": "brief summary",
  
  "tecnicas_usadas": ["tie-down", "bridge-statement", "silencio-precio"],
  "neurotransmisores": ["oxitocina", "dopamina"],
  
  "objeciones_presentadas": 3,
  "objeciones_resuelta": 2,
  "objecion_ratio": 0.67,
  
  "pasos_pitch_alcanzados": 12,
  "pasos_pitch_total": 19,
  
  "estado_final": "cerrado",
  "monto_cierre": 25000,
  "plan_vendido": "Plan Gold",
  
  "audio_url": "s3://...",
  "transcript_url": "s3://...",
  
  "calidad_score": 8.5,
  "mejoras_detectadas": ["más silencio", "menos rodeos"],
  "fortalezas": ["gran rapport", "manejo de objeciones"]
}
```

---

## 📈 MÉTRICAS KPI POR USUARIO (DIARIAS)

### Métricas Agregadas (últimas 24h):

| Métrica | Definición | Valor Ejemplo |
|---------|-----------|---------------|
| **Total Sesiones** | Número de interacciones | 8 |
| **Duración Total** | Minutos acumulados | 420 min (7h) |
| **Promedio Duración** | Duración por sesión | 52.5 min |
| **DISC Detectado** | Tipo predominante | 60% Driver, 30% Amiable, 10% Analytic |
| **Tasa Objeciones** | Objeciones resueltas / presentadas | 85% (17/20) |
| **Pasos Pitch Promedio** | Promedio de pasos alcanzados | 14.2/19 |
| **Cierre Rate** | Sesiones cerradas / total | 37.5% (3/8) |
| **Monto Total** | Dinero vendido en el día | $75,000 USD |
| **Calidad Promedio** | Score de 0-10 | 8.2/10 |
| **Técnicas Top 3** | Más usadas | Bridge Statement (100%), Tie-Down (87%), TOC (62%) |

### Ranking Vs Pares (Benchmarking):
```
Carlos Pérez    — Cierre: 37.5% (📈 +15% vs piso)
Sandra López    — Cierre: 25% (📉 -10% vs piso)
Juan Martínez   — Cierre: 12.5% (⚠️ -25% vs piso)
Piso Promedio   — Cierre: 22.5%
```

---

## 🎨 ESTRUCTURA DEL REPORTE HTML DIARIO

```
┌─────────────────────────────────────────────────────────┐
│ REPORTE DIARIO — VÍCTOR IA TRAINING                     │
│ 10 de Julio de 2026                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RESUMEN EJECUTIVO                                       │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ 👤 Usuario: Carlos Pérez (ID: 125)                      │
│ 📊 Role: Closer · Experiencia: 3 años                   │
│                                                         │
│ 📈 MÉTRICAS CLAVE (últimas 24h)                        │
│ ├─ Sesiones: 8                                          │
│ ├─ Duración Total: 7h 00m                               │
│ ├─ Cierre Rate: 37.5% (3/8)                             │
│ ├─ Monto Vendido: $75,000                               │
│ ├─ Calidad Promedio: 8.2/10                             │
│ └─ Ranking Piso: 🏆 #1                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ GRÁFICOS                                                │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ [📊 Gráfico 1: Distribución DISC (pie chart)]          │
│ Driver: 60% | Amiable: 30% | Analytic: 10%             │
│                                                         │
│ [📈 Gráfico 2: Evolución Cierre Rate (línea)]          │
│ Ayer: 25% → Hoy: 37.5% → Trend: 📈 +50%                │
│                                                         │
│ [⏱️  Gráfico 3: Duración Sesiones (barras)]            │
│ Sesión 1: 45min | Sesión 2: 60min | ... | Sesión 8: 50m │
│                                                         │
│ [🎯 Gráfico 4: Tecnicas Usadas (horizontal)]           │
│ Bridge Statement: 100% | Tie-Down: 87% | TOC: 62%      │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ DETALLE POR SESIÓN (8 sesiones)                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ SESIÓN 1 — 14:30-15:20 (50 min) — CERRADO ✅           │
│ ├─ Cliente: Marco (CEO, Guadalajara)                   │
│ ├─ DISC: DRIVER (92% confidence)                        │
│ ├─ Pasos Pitch: 15/19                                   │
│ ├─ Objeciones: 2 presentadas, 2 resueltas (100%)       │
│ ├─ Técnicas: Bridge Statement, Silence, TOC            │
│ ├─ Monto: $25,000                                       │
│ ├─ Plan: Gold                                           │
│ ├─ Calidad Score: 9/10                                  │
│ ├─ Transcripción: [COMPLETA ABAJO]                     │
│ └─ Análisis IA: "Excelente rapport, manejo perfecto    │
│                   de objeción de precio. Mejorar:      │
│                   más tiempo en Model Pitch."           │
│                                                         │
│ --- TRANSCRIPCIÓN COMPLETA ---                         │
│ [00:00] Víctor: "Bienvenido Marco, gran placer..."      │
│ [00:15] Marco: "Hola, sí gracias..."                    │
│ ...                                                      │
│ [50:00] Víctor: "Te vemos en 3 meses en Cancún"        │
│                                                         │
│ SESIÓN 2 — 15:45-16:35 (50 min) — PENDIENTE ⏳        │
│ ... (similar)                                            │
│                                                         │
│ ... SESIONES 3-8 ...                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ANÁLISIS DE DESEMPEÑO                                   │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ 🏆 FORTALEZAS:                                          │
│ ✓ Excelente manejo de objeciones (85% resolve rate)    │
│ ✓ Gran rapport con clientes Driver                      │
│ ✓ Uso consistente de técnicas de cierre                │
│ ✓ Duración de sesiones adecuada (promedio 52 min)      │
│                                                         │
│ ⚠️  ÁREAS DE MEJORA:                                     │
│ • Aumentar tiempo en Model Pitch (actualmente 3 min)   │
│ • Practicar más con clientes Amiable                   │
│ • Reducir rodeos en fase de descubrimiento              │
│ • Mejorar silencio post-precio (apuntar 15+ seg)       │
│                                                         │
│ 📊 COMPARACIÓN VS PISO:                                 │
│ Carlos:     37.5% cierre rate (🔝 #1)                   │
│ Piso Avg:   22.5% cierre rate                           │
│ Diferencia: +67% mejor que promedio                     │
│                                                         │
│ 📈 TENDENCIA (últimos 7 días):                          │
│ Día 1: 12.5% | Día 2: 25% | Día 3: 20% | Día 4: 37.5% │
│ Trend: 📈 Mejora consistente (+3% diarios)              │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ RECOMENDACIONES PERSONALIZADAS                          │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ 🎯 PARA GERENTE (de Carlos):                            │
│                                                         │
│ 1. RECONOCIMIENTO: Excelente desempeño hoy (+67% vs    │
│    piso). Mantener momentum.                           │
│                                                         │
│ 2. DESARROLLO: Dedicar 30 min esta semana en entrenamiento │
│    de Amiable profile (actualmente 0/8 sesiones)       │
│                                                         │
│ 3. COACHING: Revisar sesión #6 (PENDIENTE) para        │
│    identificar punto de quiebre.                        │
│                                                         │
│ 4. OPORTUNIDAD: Carlos listo para entrenar a otros     │
│    Closers en manejo de objeciones.                    │
│                                                         │
│ 🎯 PARA CARLOS (auto-coaching):                        │
│                                                         │
│ 1. Keep going! Estás en track para multiplicar          │
│    comisiones este mes.                                │
│                                                         │
│ 2. Foco: Model Pitch. Agregar 2-3 min más para         │
│    activar dopamina en clientes.                       │
│                                                         │
│ 3. Desafío: Cerrar 1 cliente Amiable esta semana       │
│    (entrenamiento personalizado disponible).           │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FOOTER                                                  │
│ ─────────────────────────────────────────────────────── │
│ Reporte generado: 10 Julio 2026 · 23:59 PM             │
│ Sistema: VÍCTOR IA Training v7                          │
│ Email: carlos.perez@vtc.com                             │
│ CC: gerente@vtc.com                                     │
│                                                         │
│ 🔗 Dashboard Live: https://victor-ia-dashboard.vercel  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Opción 1: n8n Workflow (RECOMENDADO)

**Trigger:** Cron Job diario a las 23:59

```
PASO 1: Trigger — Every day at 23:59 PM
  ↓
PASO 2: Query Supabase — Traer sesiones últimas 24h
  SELECT * FROM sessions WHERE date = today
  ↓
PASO 3: Group By User — Agrupar por user_id
  ↓
PASO 4: Para CADA usuario:
  ├─ Calcular métricas KPI
  ├─ Generar gráficos (Chart.js)
  ├─ Compilar transcripciones
  ├─ Renderizar HTML template
  └─ Generar PDF (optional)
  ↓
PASO 5: Enviar email masivo (Resend API)
  To: gerentes@vtc.com
  BCC: usuarios@vtc.com (copia a cada usuario)
  ↓
PASO 6: Actualizar Dashboard BI
  POST /api/daily-report
  (actualiza gráficos históricos)
```

### Opción 2: Python Script (LOCAL)

```python
# reporte-generador.py

import supabase
import json
from datetime import datetime, timedelta
from jinja2 import Template
import weasyprint
import smtplib

def generar_reporte_diario():
    # 1. Traer datos
    hoy = datetime.now()
    hace_24h = hoy - timedelta(hours=24)
    
    sesiones = supabase.table("sessions")\
        .select("*")\
        .gte("timestamp_inicio", hace_24h.isoformat())\
        .execute()
    
    # 2. Agrupar por usuario
    usuarios = {}
    for sesion in sesiones.data:
        user_id = sesion["user_id"]
        if user_id not in usuarios:
            usuarios[user_id] = []
        usuarios[user_id].append(sesion)
    
    # 3. Para cada usuario generar reporte
    reportes = []
    for user_id, sesiones_user in usuarios.items():
        
        # Calcular métricas
        metricas = {
            "total_sesiones": len(sesiones_user),
            "duracion_total": sum([s["duracion_minutos"] for s in sesiones_user]),
            "cierre_rate": len([s for s in sesiones_user if s["estado_final"] == "cerrado"]) / len(sesiones_user),
            "monto_total": sum([s.get("monto_cierre", 0) for s in sesiones_user]),
            "calidad_promedio": sum([s["calidad_score"] for s in sesiones_user]) / len(sesiones_user),
        }
        
        # Generar HTML
        with open("template-reporte.html") as f:
            template = Template(f.read())
        
        html = template.render(
            usuario=sesiones_user[0]["user_name"],
            fecha=hoy.strftime("%d de %B de %Y"),
            metricas=metricas,
            sesiones=sesiones_user,
            graficos=generar_graficos(sesiones_user)
        )
        
        # Guardar HTML
        filename = f"reporte_{user_id}_{hoy.strftime('%Y%m%d')}.html"
        with open(filename, "w") as f:
            f.write(html)
        
        reportes.append({
            "usuario": sesiones_user[0]["user_name"],
            "email": sesiones_user[0]["user_email"],
            "archivo": filename,
            "html": html
        })
    
    # 4. Enviar emails
    for reporte in reportes:
        enviar_email(
            to=reporte["email"],
            cc="gerentes@vtc.com",
            subject=f"Reporte Diario — {reporte['usuario']} — {hoy.strftime('%d/%m')}",
            html=reporte["html"]
        )
    
    return reportes

def generar_graficos(sesiones):
    """Genera gráficos con Chart.js"""
    # ... implementación con datos de sesiones
    pass

def enviar_email(to, cc, subject, html):
    """Envía email vía Resend API"""
    # ... implementación
    pass

if __name__ == "__main__":
    generar_reporte_diario()
```

### Opción 3: Zapier Workflow (SIMPLIFICADO)

Sin código, usando triggers y actions de Zapier.

---

## 📊 BASE DE DATOS (Supabase)

### Tabla: `sessions`

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  user_name VARCHAR NOT NULL,
  user_email VARCHAR,
  user_role VARCHAR,
  
  timestamp_inicio TIMESTAMP,
  timestamp_fin TIMESTAMP,
  duracion_minutos INT,
  
  disc_profile VARCHAR,
  disc_confidence FLOAT,
  
  transcripcion TEXT,
  resumen TEXT,
  
  tecnicas_usadas JSON,
  neurotransmisores JSON,
  
  objeciones_presentadas INT,
  objeciones_resueltas INT,
  
  pasos_pitch_alcanzados INT,
  pasos_pitch_total INT DEFAULT 19,
  
  estado_final VARCHAR, -- cerrado, be-back, pendiente
  monto_cierre DECIMAL,
  plan_vendido VARCHAR,
  
  calidad_score FLOAT,
  mejoras_detectadas JSON,
  fortalezas JSON,
  
  audio_url VARCHAR,
  transcript_url VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_date ON sessions(user_id, created_at);
```

---

## 🚀 WEBHOOK DE ELEVENLABS

### Configurar en ElevenLabs Agent VÍCTOR-IA

Endpoint: `https://api.victor-ia.com/webhook/session-end`

**Body enviado al finalizar sesión:**

```json
{
  "session_id": "uuid",
  "user_id": "125",
  "timestamp_inicio": "2026-07-10T14:30:00Z",
  "timestamp_fin": "2026-07-10T15:20:00Z",
  "transcripcion": "full text",
  "disc_profile": "Driver",
  "estado_final": "cerrado",
  "monto_cierre": 25000,
  "calidad_score": 9,
  "metricas": {...}
}
```

**Receptor en tu servidor:**

```python
@app.post("/webhook/session-end")
def webhook_session_end(data: dict):
    # Guardar en Supabase
    supabase.table("sessions").insert(data).execute()
    return {"status": "ok"}
```

---

## ⏰ PROGRAMACIÓN (CRON)

### Option 1: n8n (Cloud)
```
Simple UI: Set Schedule → Every day → 23:59 PM
```

### Option 2: Linux Cron
```bash
# crontab -e
59 23 * * * /usr/bin/python3 /app/reporte-generador.py
```

### Option 3: Windows Task Scheduler
```
Trigger: Daily at 23:59 PM
Action: python.exe C:\app\reporte-generador.py
```

---

## 📧 EMAIL MASIVO

### Resend API (RECOMENDADO)

```python
from resend import Resend

client = Resend(api_key="re_XXXXX")

email = client.emails.send({
    "from": "reportes@victor-ia.com",
    "to": "carlos.perez@vtc.com",
    "cc": "gerente@vtc.com",
    "subject": "Reporte Diario — Carlos Pérez — 10/07",
    "html": reporte_html,
    "attachments": [
        {
            "filename": f"reporte_{user_id}_{fecha}.pdf",
            "content": pdf_bytes
        }
    ]
})
```

---

## 🎯 ENTREGA FINAL (CHECKLIST)

- [ ] Base de datos Supabase configurada (tabla `sessions`)
- [ ] Webhook de ElevenLabs apuntando a tu servidor
- [ ] Script generador de reportes (Python o n8n)
- [ ] Template HTML del reporte (Chart.js para gráficos)
- [ ] Cron job programado (23:59 PM)
- [ ] Integración Resend API (envío de emails)
- [ ] Dashboard BI actualizado con datos históricos
- [ ] Tests (enviar reporte de prueba)

---

## ✨ RESULT

**Cada día a las 23:59 PM:**

1. ✅ Cada vendedor recibe reporte personal
2. ✅ Cada gerente recibe reportes de su equipo
3. ✅ Admin ve dashboard consolidado
4. ✅ Seguimiento personalizado por usuario
5. ✅ Métricas claras para tomar decisiones

**Archivo:** `reporte_carlos_20260710.html` (~500KB con gráficos)
**Tiempo generación:** ~2-3 segundos
**Entrega:** Exactamente 23:59 PM

---

## 🔗 ARCHIVOS RELACIONADOS

- Template HTML: `REPORTE-DIARIO-TEMPLATE.html` (próximo)
- Script Python: `reporte-generador.py` (próximo)
- n8n Workflow: `reporte-workflow.json` (próximo)
