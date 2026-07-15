# 🚀 Quick Start - Victor IA E2E Tests

Pasos rápidos para empezar a usar el script de tests.

## ⚡ 5 Minutos Setup

### 1. Instalar

```bash
cd C:\Users\inbou\victor-ia-training
npm install
```

### 2. Configurar `.env`

```bash
# Copiar template
copy .env.example .env

# Editar .env (reemplazar valores):
# - SUPABASE_URL=https://xxx.supabase.co
# - SUPABASE_ANON_KEY=your-key-here
```

### 3. Mailhog (Opcional - para capturar emails)

```bash
# Windows PowerShell
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Ver UI: http://localhost:8025
```

### 4. Correr Tests

```bash
npm test
```

Done! ✅

---

## 📊 Resultados

Después de correr:

```bash
✓ test-e2e-playwright.spec.js
  ✓ Flujo de Capacitación
    ✓ Completar sesión de capacitación (simulado)
    ✓ Simular API call a Tracker
  ✓ Verificación de Emails
    ✓ Email llegó a todos los destinatarios
    ✓ Email tiene contenido correcto
    ✓ Email tiene PDF adjunto
  ✓ Verificación de Tracker (Supabase)
    ✓ Datos insertados en tabla tracker_results
    ✓ Campos requeridos presentes
    ✓ Valores de campos son correctos
  ✓ Verificación de Webhooks
    ✓ Webhook recibido en tiempo esperado
    ✓ Datos del webhook son correctos
  ✓ Resumen y Reporte
    ✓ Generar reporte de verificaciones

14 passed, 0 failed
```

---

## 🎯 Comandos Comunes

```bash
# Test básico (headless/sin interfaz)
npm test

# Test con interfaz visual (ver navegador en vivo)
npm run test:headed

# Test en modo debug (pausa en cada paso)
npm run test:debug

# Ver reporte HTML de resultados
npm run test:report

# Run solo un archivo de tests
npm run test:single

# Watch mode (re-ejecuta al cambiar código)
npm run test:watch
```

---

## 🔍 Interpretar Salida

### ✅ PASS
```
✓ Email llegó a todos los destinatarios
✓ Timestamp reciente
✓ 150+ campos capturados correctamente
```

### ⚠️ SKIP (Opcional/No configurado)
```
⚠️ Email no encontrado en Mailhog (Mailhog no está corriendo?)
⚠️ Sin datos de Tracker para verificar (skipped)
⚠️ Sin webhook ID configurado (skipped)
```

### ❌ FAIL
```
✗ Email llegó a todos los destinatarios
  Expected: true, Received: false
```

---

## 📈 Estructura de Reportes

Después de `npm test`:

- **HTML Report**: `playwright-report/index.html` (visual, detailed)
- **JSON Results**: `test-results.json` (para CI/CD, parseable)
- **JUnit XML**: `junit-results.xml` (para integración con Jenkins/GitLab)
- **Console Output**: En la terminal

```bash
# Ver reporte HTML
npm run test:report
```

---

## 🐛 Quick Troubleshooting

| Problema | Solución |
|----------|----------|
| `npm install` falla | Actualizar Node.js a v18+ |
| Mailhog no conecta | `docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog` |
| Supabase error | Verificar `.env`: SUPABASE_URL y SUPABASE_ANON_KEY |
| Tests se congelan | Presionar Ctrl+C, correr: `npm run test:debug` |
| Sin reportes HTML | Crear folder: `mkdir playwright-report` |
| Puerto 1025/8025 en uso | Cambiar puerto en helpers/test-constants.js |

---

## 📁 Archivos Importantes

```
tests/
  └── test-e2e-playwright.spec.js  ← Main test file

helpers/
  ├── email-helper.js             ← Email verification
  ├── supabase-helper.js          ← DB queries
  ├── webhook-helper.js           ← Webhook capture
  └── test-constants.js           ← Test data & config

playwright.config.js              ← Playwright config
package.json                      ← Dependencies
.env                             ← Your secrets (don't commit!)
README_E2E_TESTS.md              ← Full documentation
```

---

## 🎯 Qué Puedes Hacer con Este Script

### ✅ Verificar Flujo Completo
```bash
npm test  # Ejecuta todo: flujo, emails, tracker, webhooks
```

### ✅ Testing en CI/CD
```yaml
# GitHub Actions, GitLab CI, Jenkins, etc.
- run: npm test
- uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: playwright-report/
```

### ✅ Debugging
```bash
npm run test:headed    # Ver en navegador vivo
npm run test:debug     # Pausar y ejecutar paso a paso
```

### ✅ Integración con Coach VÍCTOR Real
```javascript
// Reemplazar simulación con requests reales:
// 1. Abrir sitio en navegador
// 2. Completar video
// 3. Hacer quiz
// 4. Capturar webhook/email
```

---

## 📞 Más Info

- Full docs: `README_E2E_TESTS.md`
- Test file: `tests/test-e2e-playwright.spec.js`
- Config: `playwright.config.js`

---

**Última actualización:** 2026-07-13