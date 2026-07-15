# ✅ Verificación Checklist - Victor IA E2E Tests

Antes de correr los tests, completar este checklist para asegurar que todo está configurado correctamente.

---

## 🔧 Configuración del Proyecto

- [ ] Carpeta existe: `C:\Users\inbou\victor-ia-training\`
- [ ] Archivo `package.json` existe
- [ ] Archivo `playwright.config.js` existe
- [ ] Carpeta `tests/` existe con `test-e2e-playwright.spec.js`
- [ ] Carpeta `helpers/` existe con 4 archivos:
  - [ ] `email-helper.js`
  - [ ] `supabase-helper.js`
  - [ ] `webhook-helper.js`
  - [ ] `test-constants.js`

---

## 📦 Dependencias Node.js

- [ ] Node.js v18+ instalado
  ```bash
  node --version  # Debe ser v18.x o superior
  ```

- [ ] npm v9+ instalado
  ```bash
  npm --version   # Debe ser v9.x o superior
  ```

- [ ] Dependencias instaladas
  ```bash
  cd C:\Users\inbou\victor-ia-training
  npm install    # SIN ERRORES
  ```

- [ ] Verificar módulos en `node_modules/`:
  - [ ] `@playwright/test`
  - [ ] `@supabase/supabase-js`
  - [ ] `axios`
  - [ ] `dotenv`

---

## 🔐 Variables de Entorno

- [ ] Archivo `.env` existe (copiar desde `.env.example`)
  ```bash
  copy .env.example .env
  ```

- [ ] `.env` tiene valores configurados (NO usan defaults):

  **URLs:**
  - [ ] `APP_URL` = tu URL (no está vacío)
  - [ ] `TRACKER_URL` = `https://tracker.victor-ia.xyz`
  - [ ] `TRACKER_API_URL` = `https://tracker.victor-ia.xyz/api/v1`

  **Supabase (CRÍTICO):**
  - [ ] `SUPABASE_URL` = URL real de tu proyecto (https://xxx.supabase.co)
  - [ ] `SUPABASE_ANON_KEY` = API key real (no vacío)

  **Emails:**
  - [ ] `EMAIL_RECIPIENTS` = 3 emails separados por coma

  **Timeouts:**
  - [ ] `EMAIL_TIMEOUT` = 5000 (o mayor)
  - [ ] `API_TIMEOUT` = 10000 (o mayor)
  - [ ] `PAGE_LOAD_TIMEOUT` = 30000 (o mayor)

- [ ] Archivo `.env` NO ESTÁ en Git
  ```bash
  git status | grep ".env"  # Debe estar VACÍO
  ```

---

## 📧 Mailhog (Para capturar emails)

### Opción A: Docker (Recomendado)

- [ ] Docker Desktop instalado y corriendo
  ```bash
  docker --version
  docker ps  # Debe mostrar containers corriendo
  ```

- [ ] Mailhog iniciado
  ```bash
  docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
  docker ps | grep mailhog  # Debe aparecer en lista
  ```

- [ ] Mailhog accesible
  ```bash
  # Abrir navegador: http://localhost:8025
  # Debe mostrar UI de Mailhog
  ```

### Opción B: Binario Standalone

- [ ] Mailhog binario descargado
  - Descargar: https://github.com/mailhog/MailHog/releases
  - Guardar en: `C:\Program Files\MailHog\`

- [ ] Mailhog ejecutándose
  ```bash
  MailHog.exe
  # Debe mostrar: "listening on 0.0.0.0:1025 and 0.0.0.0:8025"
  ```

- [ ] Verificar puertos (no en uso)
  ```bash
  netstat -ano | findstr :1025  # Debe estar vacío (o mostrar MailHog)
  netstat -ano | findstr :8025  # Debe estar vacío (o mostrar MailHog)
  ```

### Opción C: Servicio de Email Real (Resend, SendGrid, etc.)

- [ ] Cuenta en servicio de email configurada
- [ ] API key en `.env`
- [ ] Helpers actualizados para usar servicio real

---

## 💾 Supabase

- [ ] Cuenta en Supabase creada
  - URL: https://supabase.com/

- [ ] Proyecto Supabase creado
  - [ ] Project ID
  - [ ] API URL (formato: `https://xxx.supabase.co`)
  - [ ] Anon Key (acceso público)

- [ ] Tabla `tracker_results` existe
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
  );
  ```

- [ ] Índices creados
  ```sql
  CREATE INDEX idx_tracker_user ON tracker_results(user);
  CREATE INDEX idx_tracker_session ON tracker_results(sessionId);
  ```

- [ ] RLS (Row Level Security) configurado
  - [ ] DISABLE RLS (para testing) O
  - [ ] Policies configuradas correctamente

- [ ] Conexión funciona
  ```bash
  npm run test:single  # Debe conectar sin errores
  ```

---

## 🔗 Webhooks (webhook.site)

- [ ] Cuenta en webhook.site (opcional - es gratuita)
  - URL: https://webhook.site/

- [ ] URL única generada (si se usa)
  - [ ] Formato: `https://webhook.site/[uuid]`
  - [ ] Guardada en `.env` como `WEBHOOK_TEST_URL`

- [ ] URL es accesible (publicamente)
  ```bash
  curl https://webhook.site/[tu-uuid]
  # Debe retornar datos de tu webhook
  ```

---

## 📂 Estructura de Archivos

Verificar que la estructura sea correcta:

```
✓ C:\Users\inbou\victor-ia-training\
  ✓ tests/
    ✓ test-e2e-playwright.spec.js
    ✓ global-setup.js
    ✓ global-teardown.js
  ✓ helpers/
    ✓ email-helper.js
    ✓ supabase-helper.js
    ✓ webhook-helper.js
    ✓ test-constants.js
  ✓ playwright.config.js
  ✓ package.json
  ✓ .env
  ✓ .env.example
  ✓ .gitignore
  ✓ run-tests.bat
  ✓ setup.js
  ✓ README_E2E_TESTS.md
  ✓ QUICK_START.md
  ✓ TEST_SUMMARY.md
  ✓ VERIFICATION_CHECKLIST.md (este archivo)
```

---

## 🧪 Pre-Test Verification

Ejecutar estas verificaciones antes de `npm test`:

### 1. Playwright está instalado
```bash
npx playwright --version
# Debe mostrar: Playwright 1.46.0 (o similar)
```

### 2. Supabase está configurado
```bash
cd C:\Users\inbou\victor-ia-training
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
# Debe mostrar tu URL de Supabase (no vacío)
```

### 3. Mailhog está accesible
```bash
curl http://localhost:8025/api/v2/messages
# Debe retornar JSON con estructura de Mailhog
```

### 4. Webhook.site está accesible (si se usa)
```bash
curl https://webhook.site/[tu-uuid]
# Debe retornar JSON con estructura
```

---

## ✅ Verificación Final

- [ ] Todos los checks anteriores PASARON
- [ ] No hay errores en console
- [ ] Archivo `.env` tiene valores reales (no defaults)
- [ ] `.env` NO está en Git (está en `.gitignore`)
- [ ] Mailhog corriendo o servicio de email configurado
- [ ] Supabase tabla existe y es accesible
- [ ] `npm install` completó sin errores
- [ ] `node_modules/@playwright/test` existe

---

## 🚀 Estás Listo!

Si todos los checks PASARON, puedes correr:

```bash
npm test
```

Esperado en ~60 segundos:
```
14 passed, 0 failed ✅
```

---

## 🆘 Si Algo Falla

1. **Revisar errores específicos**
   ```bash
   npm test 2>&1 | head -50  # Primeras 50 líneas
   ```

2. **Activar debug mode**
   ```bash
   npm run test:debug
   ```

3. **Verificar individual services**
   - Mailhog: http://localhost:8025
   - Supabase: https://app.supabase.com/
   - webhook.site: https://webhook.site/

4. **Leer documentación**
   - `README_E2E_TESTS.md` - Documentación completa
   - `QUICK_START.md` - Setup rápido
   - `TEST_SUMMARY.md` - Resumen ejecutivo

5. **Contactar soporte**
   - Revisar troubleshooting en `README_E2E_TESTS.md`
   - Abrir issue en GitHub (si aplica)

---

## 📝 Notas

- Este checklist es una GUÍA, no es obligatorio completar 100%
- Algunos items son OPCIONALES (e.g., webhook.site)
- Para testing DEMO local, algunos items pueden skipearse
- Para testing PRODUCCIÓN, TODOS los items deben completarse

---

**Estado: LISTO PARA TESTS**

Fecha de completación: _____________  
Por: _____________  
Observaciones: _________________________

---

**Última actualización:** 2026-07-13