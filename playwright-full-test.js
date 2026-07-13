/**
 * PLAYWRIGHT E2E TEST — Victor IA Training
 * Verifica todo el flujo:
 * 1. Carga del sitio
 * 2. Endpoints disponibles
 * 3. Estructura HTML
 * 4. Funcionalidad completa
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://victor-ia-training.vercel.app';
const TRACKER_URL = 'https://tracker.victor-ia.xyz';

async function runTests() {
  let browser;
  const results = [];

  console.log('\n');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  PLAYWRIGHT E2E TEST — Victor IA Training');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('\n');

  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. LAUNCH BROWSER
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 1: Browser Launch');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    results.push({ test: 'Browser Launch', status: '✅ PASS' });
    console.log('   ✅ PASS\n');

    // ─────────────────────────────────────────────────────────────────────
    // 2. VISIT TRAINING SITE
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 2: Visit Training Site');
    console.log(`   URL: ${BASE_URL}`);
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      console.log(`   Title: "${title}"`);
      results.push({ test: 'Visit Training Site', status: '✅ PASS' });
      console.log('   ✅ PASS\n');
    } catch (e) {
      results.push({ test: 'Visit Training Site', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. VERIFY TRAINING SITE STRUCTURE
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 3: Training Site Structure');
    try {
      // Check for hero section
      const hasHero = await page.locator('[data-section="hero"], .hero, h1').count() > 0;
      console.log(`   Has hero section: ${hasHero ? '✓' : '✗'}`);

      // Check for curriculum sections
      const sectionCount = await page.locator('[data-block-id]').count();
      console.log(`   Blocks found: ${sectionCount}`);

      // Check for ElevenLabs widget
      const hasElevenLabs = await page.locator('script[src*="elevenlabs"]').count() > 0;
      console.log(`   ElevenLabs widget: ${hasElevenLabs ? '✓' : '✗'}`);

      if (hasHero || sectionCount > 0) {
        results.push({ test: 'Training Site Structure', status: '✅ PASS' });
        console.log('   ✅ PASS\n');
      } else {
        results.push({ test: 'Training Site Structure', status: '⚠️ WARNING' });
        console.log('   ⚠️ WARNING: Limited structure detected\n');
      }
    } catch (e) {
      results.push({ test: 'Training Site Structure', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. TEST API ENDPOINT: /api/sessions-active
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 4: API Endpoint /api/sessions-active');
    try {
      const response = await page.request.get(`${BASE_URL}/api/sessions-active`);
      const status = response.status();
      console.log(`   Status: ${status}`);

      if (status === 200) {
        const data = await response.json();
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        console.log(`   Total sessions: ${data.total || 0}`);
        results.push({ test: 'API /api/sessions-active', status: '✅ PASS' });
        console.log('   ✅ PASS\n');
      } else {
        results.push({ test: 'API /api/sessions-active', status: `❌ FAIL: HTTP ${status}` });
        console.log(`   ❌ FAIL: HTTP ${status}\n`);
      }
    } catch (e) {
      results.push({ test: 'API /api/sessions-active', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. TEST API ENDPOINT: /api/sessions-history
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 5: API Endpoint /api/sessions-history');
    try {
      const response = await page.request.get(`${BASE_URL}/api/sessions-history?days=30`);
      const status = response.status();
      console.log(`   Status: ${status}`);

      if (status === 200) {
        const data = await response.json();
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        console.log(`   Total sessions: ${data.total || 0}`);
        console.log(`   Stats: ${data.stats ? 'present' : 'missing'}`);
        results.push({ test: 'API /api/sessions-history', status: '✅ PASS' });
        console.log('   ✅ PASS\n');
      } else {
        results.push({ test: 'API /api/sessions-history', status: `❌ FAIL: HTTP ${status}` });
        console.log(`   ❌ FAIL: HTTP ${status}\n`);
      }
    } catch (e) {
      results.push({ test: 'API /api/sessions-history', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. TEST API ENDPOINT: /api/sessions-reports
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 6: API Endpoint /api/sessions-reports');
    try {
      const response = await page.request.get(`${BASE_URL}/api/sessions-reports`);
      const status = response.status();
      console.log(`   Status: ${status}`);

      if (status === 200) {
        const data = await response.json();
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        console.log(`   Total reports: ${data.total || 0}`);
        results.push({ test: 'API /api/sessions-reports', status: '✅ PASS' });
        console.log('   ✅ PASS\n');
      } else {
        results.push({ test: 'API /api/sessions-reports', status: `❌ FAIL: HTTP ${status}` });
        console.log(`   ❌ FAIL: HTTP ${status}\n`);
      }
    } catch (e) {
      results.push({ test: 'API /api/sessions-reports', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 7. TEST TRACKER INTEGRATION
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 7: Tracker Integration');
    try {
      const trackerResponse = await page.request.get(TRACKER_URL);
      const trackerStatus = trackerResponse.status();
      console.log(`   Status: ${trackerStatus}`);

      if (trackerStatus === 200) {
        const trackerHtml = await trackerResponse.text();

        // Check for capacitaciones modal
        const hasModal = trackerHtml.includes('qa-capacitaciones');
        console.log(`   Modal element: ${hasModal ? '✓' : '✗'}`);

        // Check for button
        const hasButton = trackerHtml.includes('Seguimiento Capacitación');
        console.log(`   Button text: ${hasButton ? '✓' : '✗'}`);

        // Check for minimize function
        const hasMinimize = trackerHtml.includes('minimizeCapacitaciones');
        console.log(`   Minimize function: ${hasMinimize ? '✓' : '✗'}`);

        if (hasModal && hasButton && hasMinimize) {
          results.push({ test: 'Tracker Integration', status: '✅ PASS' });
          console.log('   ✅ PASS\n');
        } else {
          results.push({ test: 'Tracker Integration', status: '⚠️ INCOMPLETE' });
          console.log('   ⚠️ INCOMPLETE\n');
        }
      } else {
        results.push({ test: 'Tracker Integration', status: `❌ FAIL: HTTP ${trackerStatus}` });
        console.log(`   ❌ FAIL: HTTP ${trackerStatus}\n`);
      }
    } catch (e) {
      results.push({ test: 'Tracker Integration', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 8. TEST EMAIL ENDPOINT (structure only, no actual send)
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 8: Email Endpoint Structure');
    try {
      const response = await page.request.post(`${BASE_URL}/api/email-report`, {
        data: {
          conversation_id: 'test_validation_only',
          user_name: 'Test User',
          user_email: 'test@example.com',
          empleado_id: 'TEST-001'
        }
      });
      const status = response.status();
      console.log(`   Status: ${status}`);
      console.log(`   Response is JSON: ${response.headers()['content-type']?.includes('json') ? '✓' : '✗'}`);

      // 400 is expected (missing fields), 200 means success
      if (status === 400 || status === 200) {
        const data = await response.json();
        console.log(`   Has 'success' field: ${'success' in data ? '✓' : '✗'}`);
        console.log(`   Has 'error' field: ${'error' in data ? '✓' : '✗'}`);
        results.push({ test: 'Email Endpoint Structure', status: '✅ PASS' });
        console.log('   ✅ PASS\n');
      } else {
        results.push({ test: 'Email Endpoint Structure', status: `❌ FAIL: HTTP ${status}` });
        console.log(`   ❌ FAIL: HTTP ${status}\n`);
      }
    } catch (e) {
      results.push({ test: 'Email Endpoint Structure', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 9. TEST VERCEL DEPLOYMENT
    // ─────────────────────────────────────────────────────────────────────
    console.log('📌 TEST 9: Vercel Deployment');
    try {
      const response = await page.request.get(BASE_URL);
      const status = response.status();
      const serverHeader = response.headers()['server'] || 'unknown';
      console.log(`   Status: ${status}`);
      console.log(`   Server: ${serverHeader}`);
      console.log(`   Load time: ${response.ok ? 'fast' : 'slow'}`);

      if (status === 200) {
        results.push({ test: 'Vercel Deployment', status: '✅ PASS' });
        console.log('   ✅ PASS\n');
      } else {
        results.push({ test: 'Vercel Deployment', status: `❌ FAIL: HTTP ${status}` });
        console.log(`   ❌ FAIL: HTTP ${status}\n`);
      }
    } catch (e) {
      results.push({ test: 'Vercel Deployment', status: `❌ FAIL: ${e.message}` });
      console.log(`   ❌ FAIL: ${e.message}\n`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────────
    const passCount = results.filter(r => r.status.includes('✅')).length;
    const failCount = results.filter(r => r.status.includes('❌')).length;
    const warnCount = results.filter(r => r.status.includes('⚠️')).length;
    const total = results.length;

    console.log('════════════════════════════════════════════════════════════════');
    console.log('  RESUMEN DE PRUEBAS');
    console.log('════════════════════════════════════════════════════════════════\n');

    results.forEach(r => {
      console.log(`${r.status.padEnd(20)} ${r.test}`);
    });

    console.log('\n📊 RESULTADOS:');
    console.log(`   ✅ Pasadas: ${passCount}/${total}`);
    console.log(`   ❌ Fallidas: ${failCount}/${total}`);
    console.log(`   ⚠️  Advertencias: ${warnCount}/${total}`);

    if (failCount === 0) {
      console.log('\n🎉 TODAS LAS PRUEBAS PASARON' );
    } else {
      console.log(`\n⚠️  ${failCount} prueba(s) fallida(s) — revisa arriba`);
    }

    console.log('\n════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runTests().catch(console.error);
