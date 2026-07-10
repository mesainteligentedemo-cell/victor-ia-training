# CONFIGURACIÓN — SISTEMA DE REPORTES AUTOMÁTICOS DIARIOS

**Objetivo:** Reportes automáticos a las 11:59 PM con interacciones, transcripciones, gráficos y análisis por usuario.

---

## 📋 REQUISITOS PREVIOS

✅ Supabase configurado (tabla `sessions`)  
✅ ElevenLabs Agent VÍCTOR-IA con webhooks activos  
✅ Resend API key (para envío de emails)  
✅ Python 3.8+ instalado (si usas script local)  
✅ n8n cloud o self-hosted (si usas workflow)  

---

## 🔧 PASO 1: CONFIGURAR BASE DE DATOS SUPABASE

### 1.1 Crear tabla `sessions`

Ve a: **Supabase Dashboard → SQL Editor**

Ejecuta:

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  
  tecnicas_usadas JSONB,
  neurotransmisores JSONB,
  
  objeciones_presentadas INT DEFAULT 0,
  objeciones_resueltas INT DEFAULT 0,
  
  pasos_pitch_alcanzados INT DEFAULT 0,
  pasos_pitch_total INT DEFAULT 19,
  
  estado_final VARCHAR DEFAULT 'pendiente',
  monto_cierre DECIMAL,
  plan_vendido VARCHAR,
  
  calidad_score FLOAT DEFAULT 0,
  mejoras_detectadas JSONB,
  fortalezas JSONB,
  
  audio_url VARCHAR,
  transcript_url VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_date ON sessions(user_id, created_at);
CREATE INDEX idx_created_at ON sessions(created_at);
CREATE INDEX idx_estado ON sessions(estado_final);
```

### 1.2 Habilitar Row Level Security (Optional pero recomendado)

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Política: Vendedores ven solo sus propias sesiones
CREATE POLICY "Users can view own sessions"
  ON sessions
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Política: Gerentes ven las de su equipo
CREATE POLICY "Managers can view team sessions"
  ON sessions
  FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM users WHERE manager_id = auth.uid()::text
    )
  );
```

---

## 🔗 PASO 2: CONFIGURAR WEBHOOK DE ELEVENLABS

### 2.1 Endpoint HTTP en tu servidor

**Ubicación:** Tu servidor (ej: `api.victor-ia.com/webhook/session-end`)

**Crear archivo:** `webhook-handler.py` o `webhook-handler.js`

#### Opción A: Python (FastAPI)

```python
from fastapi import FastAPI, Request
from supabase import create_client

app = FastAPI()
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.post("/webhook/session-end")
async def webhook_session_end(request: Request):
    """Recibe datos de ElevenLabs al finalizar sesión"""
    
    data = await request.json()
    
    # Validar webhook
    if not validar_webhook(request.headers.get("x-webhook-signature")):
        return {"error": "Invalid signature"}, 401
    
    # Guardar en Supabase
    try:
        response = supabase.table("sessions").insert({
            "user_id": data.get("user_id"),
            "user_name": data.get("user_name"),
            "user_email": data.get("user_email"),
            "user_role": data.get("user_role"),
            "timestamp_inicio": data.get("timestamp_inicio"),
            "timestamp_fin": data.get("timestamp_fin"),
            "duracion_minutos": data.get("duracion_minutos"),
            "disc_profile": data.get("disc_profile"),
            "transcripcion": data.get("transcripcion"),
            "tecnicas_usadas": data.get("tecnicas_usadas"),
            "objeciones_presentadas": data.get("objeciones_presentadas"),
            "objeciones_resueltas": data.get("objeciones_resueltas"),
            "pasos_pitch_alcanzados": data.get("pasos_pitch_alcanzados"),
            "estado_final": data.get("estado_final"),
            "monto_cierre": data.get("monto_cierre"),
            "plan_vendido": data.get("plan_vendido"),
            "calidad_score": data.get("calidad_score"),
            "mejoras_detectadas": data.get("mejoras_detectadas"),
            "fortalezas": data.get("fortalezas")
        }).execute()
        
        return {"status": "ok", "id": response.data[0]["id"]}, 200
    
    except Exception as e:
        return {"error": str(e)}, 500
```

#### Opción B: Node.js (Express)

```javascript
app.post("/webhook/session-end", async (req, res) => {
  const data = req.body;
  
  // Validar firma
  if (!validarWebhook(req.headers["x-webhook-signature"])) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  
  // Guardar en Supabase
  try {
    const { data: result, error } = await supabase
      .from("sessions")
      .insert([{
        user_id: data.user_id,
        user_name: data.user_name,
        user_email: data.user_email,
        transcripcion: data.transcripcion,
        // ... resto de campos
      }]);
    
    if (error) throw error;
    
    return res.json({ status: "ok", id: result[0].id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### 2.2 Configurar Webhook en ElevenLabs

1. Ve a: **ElevenLabs → Agent VÍCTOR-IA → Settings**
2. Busca: **Webhooks** o **Integrations**
3. Agrega nuevo webhook:
   - **URL:** `https://api.victor-ia.com/webhook/session-end`
   - **Evento:** Session ended
   - **Método:** POST
   - **Auth:** Bearer token (genera uno)
4. Guarda

**Nota:** Cada sesión enviará automáticamente al final:

```json
{
  "session_id": "uuid",
  "user_id": "125",
  "user_name": "Carlos Pérez",
  "timestamp_inicio": "2026-07-10T14:30:00Z",
  "timestamp_fin": "2026-07-10T15:20:00Z",
  "duracion_minutos": 50,
  "disc_profile": "Driver",
  "transcripcion": "full transcript...",
  "estado_final": "cerrado",
  "monto_cierre": 25000,
  "calidad_score": 9
}
```

---

## 📧 PASO 3: CONFIGURAR RESEND API

### 3.1 Obtener API Key

1. Ve a: https://resend.com
2. Crea cuenta o inicia sesión
3. Ve a **Settings → API Keys**
4. Copia tu key (ej: `re_XXXXX`)

### 3.2 Configurar variables de entorno

**Archivo:** `.env` (en raíz de tu proyecto)

```env
RESEND_API_KEY=re_XXXXX
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGc...
EMAIL_FROM=reportes@victor-ia.com
GERENTES_EMAIL=gerente1@vtc.com,gerente2@vtc.com
```

---

## ⏰ PASO 4: PROGRAMAR CRON JOB (Ejecutar a las 23:59 PM)

### OPCIÓN A: n8n Workflow (RECOMENDADO - Cloud)

**Ventajas:** No requiere servidor · UI visual · fácil de monitorear

**Pasos:**

1. Ve a: https://n8n.cloud
2. Crea nuevo workflow
3. Agrega nodo **Cron**: `0 23 * * *` (23:59 PM UTC)
4. Agrega nodo **HTTP Request** → GET a tu endpoint
5. Agrega nodo **Function** → ejecuta script generador

**Workflow JSON:**

```json
{
  "nodes": [
    {
      "name": "Trigger - 23:59 PM",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "cronExpression": "0 23 * * *"
      }
    },
    {
      "name": "Execute Report Generator",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.victor-ia.com/generate-reports",
        "authentication": "bearerToken",
        "options": {},
        "requestFormat": "json"
      },
      "credentials": {
        "httpHeaderAuth": "bearer_token_id"
      }
    },
    {
      "name": "Notify on Error",
      "type": "n8n-nodes-base.sendEmail",
      "typeVersion": 2,
      "position": [650, 300],
      "parameters": {
        "to": "admin@victor-ia.com",
        "subject": "Reporte Diario - Error en generación",
        "text": "Error al generar reportes: {{$node[\"Execute Report Generator\"].json.error}}"
      }
    }
  ]
}
```

### OPCIÓN B: Linux Cron (Self-hosted)

1. SSH a tu servidor
2. Edita crontab:

```bash
crontab -e
```

3. Agrega línea:

```bash
59 23 * * * /usr/bin/python3 /app/reporte-generador.py >> /var/log/victor-reportes.log 2>&1
```

(Ejecuta a las 23:59 cada día)

4. Verifica:

```bash
crontab -l
```

### OPCIÓN C: Windows Task Scheduler

1. **Iniciar → Task Scheduler**
2. **Action → Create Basic Task**
3. **Nombre:** "VÍCTOR Reporte Diario"
4. **Trigger:** Diario a las 23:59
5. **Action:**
   - **Program:** `C:\Python311\python.exe`
   - **Arguments:** `C:\app\reporte-generador.py`
6. **Save**

---

## 📊 PASO 5: INSTALAR DEPENDENCIAS PYTHON

```bash
pip install -r requirements.txt
```

**Archivo:** `requirements.txt`

```
supabase==1.0.3
python-dotenv==1.0.0
jinja2==3.1.2
requests==2.31.0
python-dateutil==2.8.2
```

---

## 🧪 PASO 6: TESTEAR SISTEMA

### Test 1: Verificar conexión Supabase

```bash
python3 -c "
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
result = supabase.table('sessions').select('*').limit(1).execute()
print(f'✓ Conexión OK. {len(result.data)} sesiones encontradas.')
"
```

### Test 2: Generar reporte de prueba

```bash
python3 reporte-generador.py
```

Verifica que:
- ✓ Se crean archivos HTML en `/app/reportes/`
- ✓ Se envían emails exitosamente
- ✓ No hay errores en los logs

### Test 3: Verificar webhook

Desde curl/Postman, simula una sesión:

```bash
curl -X POST http://api.victor-ia.com/webhook/session-end \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "125",
    "user_name": "Test User",
    "user_email": "test@vtc.com",
    "user_role": "Closer",
    "timestamp_inicio": "2026-07-10T14:30:00Z",
    "timestamp_fin": "2026-07-10T15:20:00Z",
    "duracion_minutos": 50,
    "disc_profile": "Driver",
    "transcripcion": "Sample transcription",
    "estado_final": "cerrado",
    "monto_cierre": 25000,
    "calidad_score": 8.5
  }'
```

Verifica en Supabase que se insertó correctamente.

---

## 📈 PASO 7: INTEGRACIÓN CON DASHBOARD BI

Después de generar reportes, actualiza el dashboard:

```python
# En reporte-generador.py, agregar al final:

def actualizar_dashboard_bi(usuarios_metricas, ranking):
    """Actualizar métricas en dashboard"""
    
    # Agregar nueva fila por usuario al sheet de Google Sheets
    import gspread
    
    gc = gspread.service_account(filename='google-creds.json')
    sh = gc.open("VÍCTOR IA — Dashboard BI")
    ws = sh.worksheet("Daily Metrics")
    
    for user_id, metricas in usuarios_metricas.items():
        ws.append_row([
            datetime.now().strftime("%Y-%m-%d"),
            metricas.get("user_name"),
            metricas.get("total_sesiones"),
            metricas.get("cierre_rate"),
            metricas.get("monto_total"),
            metricas.get("calidad_promedio")
        ])
```

---

## 🔒 PASO 8: SEGURIDAD

### Validar webhooks de ElevenLabs

```python
import hmac
import hashlib

WEBHOOK_SECRET = os.getenv("ELEVENLABS_WEBHOOK_SECRET")

def validar_webhook(signature):
    """Validar que webhook viene de ElevenLabs"""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)
```

### Encriptar datos sensibles

```python
# Guardar transcripciones en S3 (no en Supabase)
import boto3

s3 = boto3.client('s3')

def guardar_transcripcion_s3(user_id, transcripcion):
    key = f"transcripciones/{user_id}/{datetime.now().isoformat()}.txt"
    s3.put_object(
        Bucket="victor-ia-transcripts",
        Key=key,
        Body=transcripcion.encode(),
        ServerSideEncryption="AES256"
    )
    return f"s3://victor-ia-transcripts/{key}"
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Tabla `sessions` creada en Supabase
- [ ] Webhook configurado en ElevenLabs
- [ ] Resend API key obtenida
- [ ] Variables de entorno configuradas
- [ ] Cron job programado (23:59 PM)
- [ ] Script Python instalado con dependencias
- [ ] Test 1: Conexión Supabase OK
- [ ] Test 2: Reporte generado correctamente
- [ ] Test 3: Webhook recibiendo datos
- [ ] Emails llegando a gerentes
- [ ] Dashboard actualizado automáticamente
- [ ] Logs monitoreados (alertas en errores)

---

## 🚀 RESULTADO FINAL

**Cada día a las 23:59 PM:**

1. ✅ Script se ejecuta automáticamente
2. ✅ Traer sesiones de últimas 24h
3. ✅ Calcular métricas por usuario
4. ✅ Generar HTML con gráficos
5. ✅ Enviar email a vendedor + cc gerentes
6. ✅ Actualizar dashboard BI
7. ✅ Guardar archivos HTML localmente

**Email recibido contiene:**
- 📊 Resumen ejecutivo (KPIs)
- 📈 Gráficos interactivos (DISC, trend, duración, técnicas)
- 📋 Detalle de cada sesión con transcripción
- 🎯 Análisis de fortalezas y mejoras
- 💡 Recomendaciones personalizadas
- 🏆 Ranking vs compañeros

**Tamaño:** ~500KB (HTML + gráficos)  
**Generación:** ~2-3 segundos  
**Entrega:** Exactamente 23:59 PM  

---

## 📞 SOPORTE & TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| Webhook no recibe datos | Verificar URL en ElevenLabs · Validar firewall |
| Reportes no se envían | Verificar Resend API key · Check spam folder |
| Base datos lenta | Agregar índices · Archivar sesiones viejas |
| Cron no ejecuta | Verificar permisos · Check crontab logs |
| Gráficos no cargan | Validar JSON en template · Check Chart.js |

---

## 📚 ARCHIVOS RELACIONADOS

- `SISTEMA-REPORTES-DIARIOS-ARQUITECTURA.md` — Arquitectura completa
- `REPORTE-DIARIO-TEMPLATE.html` — Template HTML con gráficos
- `reporte-generador.py` — Script Python (main)
- `webhook-handler.py` — Webhook endpoint

---

**Status:** ✅ Sistema 100% documentado y listo para implementar
