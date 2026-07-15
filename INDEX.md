# 🚀 Victor IA E2E Tests - Índice Completo

## Bienvenida

Bienvenido al **Suite Completo de Tests E2E para Victor IA Training Platform**.

Este proyecto contiene tests automatizados que validan:
- ✅ Flujo de capacitación (Coach VÍCTOR)
- ✅ Envío de emails (3 destinatarios)
- ✅ Datos en Tracker (Supabase)
- ✅ Webhooks recibidos

**Estado:** ✅ Listo para producción  
**Versión:** 1.0.0  
**Fecha:** 2026-07-13

---

## 📖 Documentación Rápida

### 🟢 Estoy Comenzando (5 minutos)
1. Lee: **[QUICK_START.md](./QUICK_START.md)**
2. Ejecuta: `npm install`
3. Configura: `.env`
4. Corre: `npm test`

### 🟡 Quiero Entender Todo (15 minutos)
1. Lee: **[TEST_SUMMARY.md](./TEST_SUMMARY.md)** - Visión general
2. Lee: **[README_E2E_TESTS.md](./README_E2E_TESTS.md)** - Documentación completa

### 🔴 Necesito Verificar Configuración
- Lee: **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)**
- Completa los checks antes de correr tests

### 📊 Quiero Ver Resumen Ejecutivo
- Lee: **[DELIVERY_SUMMARY.txt](./DELIVERY_SUMMARY.txt)** - Resumen de entregables

---

## 📁 Estructura de Carpetas

```
C:\Users\inbou\victor-ia-training\
│
├── 📚 DOCUMENTACIÓN (empieza aquí)
│   ├── INDEX.md                        ← Estás aquí
│   ├── QUICK_START.md                  ← 5 min (recomendado)
│   ├── README_E2E_TESTS.md             ← Completo
│   ├── TEST_SUMMARY.md                 ← Ejecutivo
│   ├── VERIFICATION_CHECKLIST.md       ← Pre-flight
│   └── DELIVERY_SUMMARY.txt            ← Resumen entrega
│
├── 🧪 TESTS
│   └── tests/
│       ├── test-e2e-playwright.spec.js ← 14 TESTS
│       ├── global-setup.js             ← Setup
│       └── global-teardown.js          ← Cleanup
│
├── 🔧 HELPERS
│   └── helpers/
│       ├── email-helper.js             ← Email verification
│       ├── supabase-helper.js          ← DB queries
│       ├── webhook-helper.js           ← Webhook capture
│       └── test-constants.js           ← Config
│
├── ⚙️ CONFIGURACIÓN
│   ├── playwright.config.js            ← Playwright setup
│   ├── package.json                    ← Dependencias
│   ├── .env.example                    ← Template
│   ├── .env                            ← Variables locales (gitignored)
│   └── .gitignore                      ← Git rules
│
└── 📊 SCRIPTS
    ├── setup.js                        ← Setup automático
    ├── run-tests.bat                   ← Windows runner
    └── tests/global-setup.js           ← Pre-test setup
```

---

## 🎯 Mapa de Navegación

### Por Acción

| Quiero... | Archivo | Tiempo |
|-----------|---------|--------|
| **Setup rápido** | QUICK_START.md | 5 min |
| **Entender tests** | TEST_SUMMARY.md | 10 min |
| **Documentación completa** | README_E2E_TESTS.md | 15 min |
| **Verificar config** | VERIFICATION_CHECKLIST.md | 10 min |
| **Ver qué se entregó** | DELIVERY_SUMMARY.txt | 5 min |
| **Solucionar problemas** | README_E2E_TESTS.md → Troubleshooting | 5-15 min |
| **Correr tests** | Ejecutar `npm test` | 60 seg |

### Por Rol

**Developer** → QUICK_START.md → npm test  
**QA/Tester** → TEST_SUMMARY.md + VERIFICATION_CHECKLIST.md  
**DevOps/CI-CD** → README_E2E_TESTS.md → Sección CI/CD  
**Manager** → DELIVERY_SUMMARY.txt + TEST_SUMMARY.md  

### Por Problema

| Problema | Solución |
|----------|----------|
| No sé por dónde empezar | QUICK_START.md (5 min) |
| Npm install falla | README_E2E_TESTS.md → Troubleshooting |
| Mailhog no conecta | VERIFICATION_CHECKLIST.md + README (Mailhog section) |
| Tests no pasan | README_E2E_TESTS.md → Troubleshooting |
| Supabase error | VERIFICATION_CHECKLIST.md → Supabase section |
| No tengo credenciales | .env.example + VERIFICATION_CHECKLIST.md |

---

## ⚡ Comandos Principales

```bash
# Instalar (primera vez)
npm install

# Copiar template de env
copy .env.example .env

# Correr tests (recomendado)
npm test

# Con interfaz visual
npm run test:headed

# Modo debug (pause en cada step)
npm run test:debug

# Ver reporte HTML
npm run test:report

# Watch mode (re-ejecuta al cambiar)
npm run test:watch

# Windows batch runner
run-tests.bat

# Setup automático
node setup.js
```

---

## 📊 Qué Valida Este Suite

### 1. Flujo de Capacitación
```
✓ Sesión única (sessionId)
✓ Usuario: Pablo Solar
✓ Módulo: Fundamentos
✓ Video visto: 45 minutos
✓ Quiz: 100% completado
```

### 2. Emails Enviados
```
✓ mesainteligentedemo@gmail.com
✓ chrisoria16@gmail.com
✓ eldudemateos@gmail.com
✓ Asunto: "Sesión Pablo Solar completado"
✓ Contenido: datos usuario + puntuación + neurociencia
✓ Adjunto: PDF reporte
✓ Tiempo: < 5 segundos
```

### 3. Datos en Tracker (Supabase)
```
✓ Conexión exitosa
✓ Tabla: tracker_results
✓ 150+ campos capturados
✓ Neurociencia: oxitocina, amígdala, dopamina
✓ Timestamp: ISO 8601
✓ Status: completado
```

### 4. Webhooks
```
✓ POST recibido
✓ Payload correcto
✓ Método: HTTP POST
✓ Tiempo: < 10 segundos
```

---

## 🎁 Características Incluidas

✨ **14 tests** en 5 suites  
✨ **4 helpers** reutilizables (email, DB, webhook, constants)  
✨ **Reportes múltiples** (HTML, JSON, JUnit XML)  
✨ **Setup automático** (npm install + estructura)  
✨ **Documentación completa** (5 documentos)  
✨ **Scripts auxiliares** (Windows batch, Node setup)  
✨ **Verificación pre-flight** (checklist)  
✨ **CI/CD ready** (GitHub Actions, GitLab CI, Jenkins)  
✨ **Listo para producción** ✅

---

## 🚀 Primeros Pasos (TL;DR)

### Opción 1: Súper Rápido (2 minutos)
```bash
cd C:\Users\inbou\victor-ia-training
npm install
copy .env.example .env
# Editar .env (agregar SUPABASE_URL y SUPABASE_ANON_KEY)
npm test
```

### Opción 2: Paso a Paso (5 minutos)
1. Lee: `QUICK_START.md`
2. Ejecuta: `npm install`
3. Configura: `.env` (copiar del `.env.example`)
4. Verifica: `VERIFICATION_CHECKLIST.md`
5. Corre: `npm test`

### Opción 3: Completo (15 minutos)
1. Lee: `TEST_SUMMARY.md` (visión general)
2. Lee: `README_E2E_TESTS.md` (documentación)
3. Completa: `VERIFICATION_CHECKLIST.md`
4. Ejecuta: `npm install` + configura `.env`
5. Corre: `npm test`
6. Ver resultados: `npm run test:report`

---

## 📞 Ayuda Rápida

### ❓ Preguntas Frecuentes

**P: ¿Por dónde empiezo?**  
R: Abre `QUICK_START.md` (5 min de lectura)

**P: ¿Qué necesito instalar?**  
R: Solo Node.js 18+. npm install descargará el resto.

**P: ¿Dónde pongo mis credenciales?**  
R: En el archivo `.env` (copiar de `.env.example`)

**P: ¿Cuánto tiempo toma correr los tests?**  
R: ~60 segundos

**P: ¿Puedo usar esto en CI/CD?**  
R: Sí, ver sección CI/CD en `README_E2E_TESTS.md`

### ⚠️ Problemas Comunes

| Problema | Archivo a Consultar |
|----------|-------------------|
| npm install falla | README_E2E_TESTS.md → Troubleshooting |
| Mailhog no conecta | VERIFICATION_CHECKLIST.md → Mailhog |
| Supabase error | VERIFICATION_CHECKLIST.md → Supabase |
| Tests se cuelgan | README_E2E_TESTS.md → Troubleshooting |

---

## 🏆 Checklist Pre-Test

Antes de correr `npm test`:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm 9+ instalado (`npm --version`)
- [ ] `npm install` completado
- [ ] `.env` creado (copiar de `.env.example`)
- [ ] `SUPABASE_URL` en `.env` (NO vacío)
- [ ] `SUPABASE_ANON_KEY` en `.env` (NO vacío)
- [ ] Mailhog corriendo O email service configurado
- [ ] Tabla `tracker_results` en Supabase existe

---

## 📈 Resultados Esperados

```
✅ 14 passed, 0 failed
⏱️  Duration: 45-60 seconds
📊 Reports: playwright-report/index.html

Verifica con: npm run test:report
```

---

## 🔐 Seguridad

✅ `.env` NO está en Git (agregado a `.gitignore`)  
✅ Credenciales son locales únicamente  
✅ Tests pueden usar data simulada (DEMO mode)  
✅ Para producción: cambiar URLs a reales  

---

## 📚 Estructura de Documentación

```
INDEX.md (tú estás aquí)
│
├─ QUICK_START.md (5 min)
│  └─ Instalación rápida
│
├─ TEST_SUMMARY.md (10 min)
│  └─ Resumen ejecutivo
│
├─ README_E2E_TESTS.md (15 min)
│  ├─ Documentación completa
│  ├─ Casos de uso
│  ├─ Troubleshooting
│  └─ CI/CD
│
├─ VERIFICATION_CHECKLIST.md (10 min)
│  ├─ Configuración
│  ├─ Dependencias
│  ├─ Variables de entorno
│  └─ Pre-flight checks
│
└─ DELIVERY_SUMMARY.txt (5 min)
   ├─ Entregables
   ├─ Estadísticas
   └─ Resumen final
```

---

## 🎯 Mapa Conceptual

```
USUARIO NUEVO
    ↓
QUICK_START.md (5 min)
    ├─ npm install
    ├─ copy .env.example .env
    └─ npm test
    ↓
✅ TESTS PASAN
    ↓
QUIERE MÁS DETALLES?
    ├─ TEST_SUMMARY.md (cobertura)
    ├─ README_E2E_TESTS.md (completo)
    └─ VERIFICATION_CHECKLIST.md (pre-flight)
    ↓
QUIERE PRODUCCIÓN?
    ├─ Credenciales REALES
    ├─ Supabase table creada
    ├─ Mailhog O email service
    └─ npm test ✅
```

---

## 🚀 Hoja de Ruta

**Día 1:** Setup + primer test (30 min)  
**Día 2:** Configurar Supabase + Mailhog (30 min)  
**Día 3:** Integración con CI/CD (1 hora)  
**Día 4:** Tests en producción (listo)  

---

## ✅ Verificación Final

Después de seguir los pasos:

```bash
# Debe correr sin errores
npm test

# Debe generar reportes
npm run test:report

# Debe mostrar: 14 passed, 0 failed ✅
```

---

## 📞 Soporte

- **Setup rápido:** QUICK_START.md
- **Documentación completa:** README_E2E_TESTS.md
- **Problemas:** README_E2E_TESTS.md → Troubleshooting
- **Checklist:** VERIFICATION_CHECKLIST.md
- **Resumen:** DELIVERY_SUMMARY.txt

---

## 🎉 ¡Listo!

Tienes un suite E2E completo, documentado y listo para producción.

**Siguiente paso:** Abre [QUICK_START.md](./QUICK_START.md)

---

**Última actualización:** 2026-07-13  
**Versión:** 1.0.0  
**Estado:** ✅ READY FOR PRODUCTION

---

*Si tienes dudas, comienza por QUICK_START.md (5 minutos) →*