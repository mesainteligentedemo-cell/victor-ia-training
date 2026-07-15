# E2E Tests - Victor IA Training Platform

Script Playwright completo que valida el flujo de capacitación Coach VÍCTOR, emails enviados y datos en Tracker.

## 📋 Qué Valida

### 1. **Flujo de Capacitación** ✅
- Generación de sesión única (sessionId)
- Completación de módulo (Fundamentos)
- Video visto (simulado)
- Quiz completado con puntuación 100%
- Datos del usuario capturados

### 2. **Verificación de Emails** 📧
- ✓ Email llega a `mesainteligentedemo@gmail.com`
- ✓ Email llega a `chrisoria16@gmail.com`
- ✓ Email llega a `eldudemateos@gmail.com`
- ✓ Asunto contiene: "Sesión", "Pablo Solar", "completado"
- ✓ Body contiene: nombre usuario, cédula, módulo, puntuación, neurotransmisores
- ✓ PDF adjunto (reporte de sesión)
- ✓ Entregado en < 5 segundos

### 3. **Verificación de Tracker (Supabase)** 📊
- ✓ POST a `https://tracker.victor-ia.xyz/api/v1/capacitacion/registro` exitoso (200 OK)
- ✓ Datos en tabla `tracker_results`:
  - `sessionId` = único
  - `user` = "Pablo Solar"
  - `module` = "modulo_f"
  - `quizScore` = 100
  - `status` = "completado"
  - `neurociencia.oxitocina` = 90
  - `neurociencia.amigdala` = 90
- ✓ 150+ campos capturados correctamente
- ✓ Timestamp ISO 8601
- ✓ Creado dentro de timeout

### 4. **Verificación de Webhooks** 🔗
- ✓ POST webhook recibido (webhook.site)
- ✓ Datos correctos en payload
- ✓ Método HTTP es POST
- ✓ Entregado en < 10 segundos

---

## 🚀 Cómo Correr

### Paso 1: Instalar Dependencias

```bash
cd C:\Users\inbou\victor-ia-training
npm install
```

Esto instala:
- `@playwright/test` - Browser automation
- `@supabase/supabase-js` - Acceso a Supabase
- `axios` - HTTP requests
- `dotenv` - Variables de entorno

### Paso 2: Configurar Servicios Locales (Opcional para prueba completa)

#### A. Mailhog (Captura de emails)

```bash
# Opción 1: Docker (recomendado)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Opción 2: Instalar Mailhog
# Descargar: https://github.com/mailhog/MailHog/releases
# Ejecutar: ./MailHog
```

Mailhog UI estará en: http://localhost:8025

#### B. Variables de Entorno (`.env`)

Copiar `.env.example` a `.env` y reemplazar con tus valores:

```bash
cp .env.example .env
```

Editar `.env`:

```bash
# URLs
APP_URL=http://localhost:3000
TRACKER_URL=https://tracker.victor-ia.xyz
TRACKER_API_URL=https://tracker.victor-ia.xyz/api/v1

# Supabase (IMPORTANTE)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Emails
EMAIL_RECIPIENTS=mesainteligentedemo@gmail.com,chrisoria16@gmail.com,eldudemateos@gmail.com

# Webhook (opcional)
WEBHOOK_TEST_URL=https://webhook.site/your-unique-id
```

### Paso 3: Ejecutar Tests

```bash
# Run completo (headless - sin interfaz visual)
npm test

# Run con interfaz visual
npm run test:headed

# Run en modo debug (pausa en cada paso)
npm run test:debug

# Run un archivo específico
npm run test:single

# Run en modo watch (re-ejecuta al cambiar archivos)
npm run test:watch
```

---

## 📊 Interpretar Resultados

### Console Output

```
✓ Session ID: session_1720862400123_abc123def
✓ Usuario: Pablo Solar
✓ Módulo: Fundamentos
✓ Puntuación quiz: 100%

✓ Destinatarios: mesainteligentedemo@gmail.com, chrisoria16@gmail.com, eldudemateos@gmail.com
✓ Todos los emails entregados exitosamente
✓ Asunto correcto
✓ PDF encontrado como adjunto

✓ Registro encontrado en Supabase
✓ Todos los campos requeridos presentes
✓ Todos los valores correctos
✓ Timestamp reciente

✓ Webhook recibido
✓ Todos los datos correctos
```

### Reportes Generados

Después de correr los tests:

1. **HTML Report** (Visual)
   ```bash
   npm run test:report
   # Abre: C:\Users\inbou\victor-ia-training\playwright-report\index.html
   ```

2. **JSON Results**
   ```bash
   cat test-results.json
   ```

3. **JUnit XML** (Para CI/CD)
   ```bash
   cat junit-results.xml
   ```

---

## 🔧 Troubleshooting

### ❌ Mailhog No Conecta

```
Error: connect ECONNREFUSED 127.0.0.1:8025
```

**Solución:**
```bash
# Verificar que Mailhog está corriendo
docker ps | grep mailhog

# Si no está, iniciar:
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Esperar 2-3 segundos
# Verificar en: http://localhost:8025
```

### ❌ Supabase No Conecta

```
Error: "Could not connect to Supabase"
```

**Solución:**
1. Verificar `.env` tiene `SUPABASE_URL` y `SUPABASE_ANON_KEY`
2. Verificar URL es correcto: `https://xxx.supabase.co`
3. Verificar API key es válido
4. Si es test DEMO, usar `test:skip()` en tests de Supabase

### ❌ Tests Se Congela

```
Timeout after 30000 ms
```

**Solución:**
```bash
# Aumentar timeout en playwright.config.js
timeout: 120 * 1000  // 120 seconds

# O correr en modo debug
npm run test:debug
```

### ❌ No Se Crea Archivo de Reportes

**Solución:**
```bash
# Crear carpeta manualmente
mkdir -p playwright-report

# Limpiar tests anteriores
rm -rf test-results.json junit-results.xml

# Correr de nuevo
npm test
```

---

## 📁 Estructura del Proyecto

```
C:\Users\inbou\victor-ia-training\
├── tests/
│   ├── test-e2e-playwright.spec.js    # Tests principales (este archivo)
│   ├── global-setup.js                 # Setup antes de tests
│   └── global-teardown.js              # Cleanup después de tests
│
├── helpers/
│   ├── test-constants.js               # Datos de prueba y configuración
│   ├── email-helper.js                 # Funciones para verificar emails
│   ├── supabase-helper.js              # Acceso a BD Supabase
│   └── webhook-helper.js               # Captura de webhooks (webhook.site)
│
├── playwright.config.js                # Configuración de Playwright
├── package.json                        # Dependencias
├── .env.example                        # Template de variables de entorno
├── .env                                # Variables locales (crear del .example)
└── README_E2E_TESTS.md                # Este archivo
```

---

## 🎯 Casos de Uso

### Caso 1: Testing Local (Sin Servicios Reales)

```bash
# Los tests usan datos simulados
# Mailhog/Supabase pueden estar offline
npm test
# Resultado: Tests de flujo PASS, emails/tracker SKIP con warning
```

### Caso 2: Testing Completo (Con Mailhog)

```bash
# 1. Iniciar Mailhog
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# 2. Configurar .env con URLs reales
# TRACKER_URL=https://tracker.victor-ia.xyz

# 3. Correr tests
npm test

# 4. Ver reportes
npm run test:report
```

### Caso 3: Testing en CI/CD (GitHub Actions / Jenkins)

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mailhog:
        image: mailhog/mailhog:latest
        ports:
          - 1025:1025
          - 8025:8025
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Notas Importantes

### 1. **Simulación vs. Real**

El test actual SIMULA el flujo. Para hacer testing REAL:

```javascript
// Antes (simulado):
testContext.sessionId = `session_${Date.now()}...`;

// Después (real):
// 1. Abrir sitio real en navegador
// 2. Completar video
// 3. Completar quiz
// 4. Verificar webhook/email
```

### 2. **Credenciales Seguras**

NUNCA pushear `.env` a Git con credenciales reales:

```bash
echo .env >> .gitignore
git add .gitignore
```

### 3. **Supabase - Tabla tracker_results**

Si no existe la tabla, crearla:

```sql
CREATE TABLE tracker_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessionId TEXT UNIQUE NOT NULL,
  user TEXT NOT NULL,
  module TEXT NOT NULL,
  quizScore INT,
  status TEXT,
  neurociencia JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
  -- ... 150+ campos más
);

CREATE INDEX idx_tracker_user ON tracker_results(user);
CREATE INDEX idx_tracker_session ON tracker_results(sessionId);
```

### 4. **Mailhog - Cleanup**

Por defecto, Mailhog limpia emails al reiniciar:

```bash
# Ver UI
open http://localhost:8025

# Limpiar manualmente en tests
await emailHelper.clearAllEmails();
```

---

## 🚦 Status Badges

```markdown
<!-- Para README.md del proyecto -->
![Playwright Tests](https://img.shields.io/badge/Playwright-blue?logo=playwright)
![Node.js](https://img.shields.io/badge/Node%2018+-green?logo=node.js)
![Supabase](https://img.shields.io/badge/Supabase-green?logo=supabase)
![Mailhog](https://img.shields.io/badge/Mailhog-orange?logo=mail)
```

---

## 📞 Soporte

Si tienes problemas:

1. **Check logs**: `npm test` muestra todos los detalles
2. **Debug mode**: `npm run test:debug` pausa en cada step
3. **Report**: Abrir `playwright-report/index.html`
4. **Mailhog UI**: http://localhost:8025 (ver emails capturados)
5. **Webhook.site**: https://webhook.site/ (ver POSTs recibidos)

---

## ✅ Checklist Antes de Deploy

- [ ] `.env` configurado con credenciales reales
- [ ] Supabase tabla `tracker_results` existe
- [ ] Mailhog o similar para capturar emails
- [ ] Webhook URL válida (webhook.site o propio)
- [ ] Tests pasan en local: `npm test`
- [ ] Reporte HTML genera sin errores
- [ ] No hay credenciales en `.env` publicadas

---

**Última actualización:** 2026-07-13

**Versión del script:** 1.0.0