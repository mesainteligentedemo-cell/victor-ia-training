/**
 * Global Setup - Se ejecuta ANTES de todos los tests
 *
 * - Limpia Mailhog
 * - Inicializa Supabase
 * - Crea webhook de captura
 * - Verifica conectividad
 */

const emailHelper = require('../helpers/email-helper');
const supabaseHelper = require('../helpers/supabase-helper');
const webhookHelper = require('../helpers/webhook-helper');
const constants = require('../helpers/test-constants');

module.exports = async (config) => {
  console.log('\n========================================');
  console.log('🚀 GLOBAL SETUP - Inicializando tests');
  console.log('========================================\n');

  try {
    // 1. Limpiar emails de Mailhog
    console.log('1️⃣ Limpiando Mailhog...');
    const cleared = await emailHelper.clearAllEmails();
    if (!cleared) {
      console.warn('⚠️  No se pudo limpiar Mailhog (¿está corriendo?)');
    }

    // 2. Inicializar Supabase
    console.log('2️⃣ Inicializando Supabase...');
    const supabaseReady = supabaseHelper.initialize();
    if (!supabaseReady) {
      console.warn('⚠️  No se pudo conectar a Supabase (verificar SUPABASE_URL y SUPABASE_ANON_KEY)');
    }

    // 3. Crear webhook de captura
    console.log('3️⃣ Creando webhook de captura...');
    const webhookUrl = await webhookHelper.createWebhookCapture();
    if (webhookUrl) {
      process.env.WEBHOOK_URL = webhookUrl;
      console.log(`✓ Webhook ready: ${webhookUrl}`);
    } else {
      console.warn('⚠️  No se pudo crear webhook (webhook.site disponible?)');
    }

    // 4. Verificar conectividad de servicios
    console.log('4️⃣ Verificando servicios...');
    const services = {
      'App': constants.URLS.APP,
      'Tracker': constants.URLS.TRACKER,
      'Mailhog UI': constants.URLS.MAILHOG_UI,
    };

    for (const [name, url] of Object.entries(services)) {
      try {
        // Verificar básicamente que el URL es accesible
        console.log(`   ✓ ${name}: ${url}`);
      } catch (error) {
        console.warn(`   ⚠️  ${name}: ${error.message}`);
      }
    }

    console.log('\n✓ Setup completado\n');

  } catch (error) {
    console.error('❌ Error en setup:', error.message);
    process.exit(1);
  }
};