#!/usr/bin/env node

/**
 * Setup Script para Victor IA E2E Tests
 *
 * Ejecutar: node setup.js
 *
 * Tareas:
 * 1. Instalar dependencias (npm install)
 * 2. Copiar .env.example a .env (si no existe)
 * 3. Crear estructura de carpetas
 * 4. Verificar Mailhog
 * 5. Mostrar instrucciones finales
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = __dirname;
const envExamplePath = path.join(projectRoot, '.env.example');
const envPath = path.join(projectRoot, '.env');

console.log('\n🚀 Victor IA E2E Tests - Setup\n');
console.log('=' .repeat(50));

// ==========================================
// PASO 1: Instalar dependencias
// ==========================================

console.log('\n1️⃣  Instalando dependencias npm...');
try {
  execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✓ npm install completado');
} catch (error) {
  console.error('✗ Error en npm install');
  process.exit(1);
}

// ==========================================
// PASO 2: Crear .env si no existe
// ==========================================

console.log('\n2️⃣  Verificando archivo .env...');

if (fs.existsSync(envPath)) {
  console.log('✓ .env ya existe');
} else if (fs.existsSync(envExamplePath)) {
  console.log('  Creando .env desde .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✓ .env creado (completar credenciales)');
} else {
  console.warn('⚠️  No se encontró .env.example');
}

// ==========================================
// PASO 3: Crear carpetas necesarias
// ==========================================

console.log('\n3️⃣  Creando estructura de carpetas...');

const folders = [
  'tests',
  'helpers',
  'fixtures',
  'playwright-report',
];

for (const folder of folders) {
  const folderPath = path.join(projectRoot, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`  ✓ ${folder}/`);
  } else {
    console.log(`  ✓ ${folder}/ (ya existe)`);
  }
}

// ==========================================
// PASO 4: Verificar Mailhog
// ==========================================

console.log('\n4️⃣  Verificando Mailhog...');

const checkMailhog = async () => {
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:8025/api/v2/messages', {
      timeout: 2000,
    });
    console.log('✓ Mailhog está corriendo en http://localhost:8025');
    return true;
  } catch (error) {
    console.warn('⚠️  Mailhog no está disponible');
    console.log('   Para instalar Mailhog:');
    console.log('   - Docker: docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog');
    console.log('   - Descarga: https://github.com/mailhog/MailHog/releases');
    return false;
  }
};

checkMailhog().then(mailhogAvailable => {
  // ==========================================
  // PASO 5: Resumen Final
  // ==========================================

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Setup completado\n');

  console.log('📋 Próximos pasos:\n');

  if (!fs.existsSync(envPath) || fs.readFileSync(envPath, 'utf-8').includes('your-')) {
    console.log('1. Editar .env con tus credenciales:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY');
    console.log('   - TEST_USER_EMAIL');
    console.log('   - WEBHOOK_TEST_URL (opcional)\n');
  }

  if (!mailhogAvailable) {
    console.log('2. Iniciar Mailhog (opcional, para capturar emails):');
    console.log('   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog\n');
  }

  console.log('3. Correr los tests:');
  console.log('   npm test');
  console.log('   npm run test:headed (con interfaz visual)');
  console.log('   npm run test:debug (modo debug)\n');

  console.log('4. Ver reportes:');
  console.log('   npm run test:report\n');

  console.log('📚 Documentación: README_E2E_TESTS.md\n');

  console.log('=' .repeat(50) + '\n');
});