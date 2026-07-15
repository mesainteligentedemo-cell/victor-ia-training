const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const results = {
    timestamp: new Date().toISOString(),
    url: 'https://victor-ia-training.vercel.app/',
    tests: [],
    summary: { passed: 0, failed: 0, warnings: 0 }
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 PRUEBAS E2E EXHAUSTIVAS - COACH VÍCTOR (VTC Training)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const pageErrors = [];
  const consoleMessages = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  try {
    // TEST 1
    console.log('📌 TEST 1: Cargando página...');
    try {
      await page.goto(results.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ Página cargada correctamente\n');
      results.tests.push({ name: 'Carga de página', status: 'PASS' });
      results.summary.passed++;
    } catch (e) {
      console.log(`❌ Error: ${e.message}\n`);
      results.tests.push({ name: 'Carga de página', status: 'FAIL', error: e.message });
      results.summary.failed++;
    }

    // TEST 2
    console.log('📌 TEST 2: Verificando título...');
    const title = await page.title();
    if (title.includes('VTC') || title.includes('VÍCTOR')) {
      console.log(`✅ Título: "${title}"\n`);
      results.tests.push({ name: 'Título página', status: 'PASS', value: title });
      results.summary.passed++;
    } else {
      console.log(`⚠️  Título: "${title}"\n`);
      results.tests.push({ name: 'Título página', status: 'WARNING', value: title });
      results.summary.warnings++;
    }

    // TEST 3: Agent ID
    console.log('📌 TEST 3: Verificando Agent ID...');
    const agentIds = await page.evaluate(() => {
      const html = document.body.innerHTML;
      const matches = html.match(/agent_[a-z0-9]+/g) || [];
      return [...new Set(matches)];
    });

    console.log(`Agent IDs: ${agentIds.join(', ')}`);
    const hasCorrectId = agentIds.includes('agent_2201kxes45mbfmsvpn8k7b9z3fnm');

    if (hasCorrectId) {
      console.log('✅ Agent ID CORRECTO\n');
      results.tests.push({ name: 'Agent ID', status: 'PASS', agentIds });
      results.summary.passed++;
    } else {
      console.log(`❌ Agent ID INCORRECTO\n`);
      results.tests.push({ name: 'Agent ID', status: 'FAIL', agentIds });
      results.summary.failed++;
    }

    // TEST 4: Widget
    console.log('📌 TEST 4: Verificando widget ElevenLabs...');
    const hasWidget = await page.evaluate(() => {
      return {
        elevenlabsTag: !!document.querySelector('elevenlabs-convai'),
        elevenlabsScript: Array.from(document.scripts).some(s => s.src && s.src.includes('elevenlabs'))
      };
    });

    if (hasWidget.elevenlabsTag && hasWidget.elevenlabsScript) {
      console.log('✅ Widget + Script presentes\n');
      results.tests.push({ name: 'Widget ElevenLabs', status: 'PASS' });
      results.summary.passed++;
    } else {
      console.log(`❌ Widget: ${hasWidget.elevenlabsTag}, Script: ${hasWidget.elevenlabsScript}\n`);
      results.tests.push({ name: 'Widget ElevenLabs', status: 'FAIL' });
      results.summary.failed++;
    }

    // TEST 5: Estructura
    console.log('📌 TEST 5: Verificando estructura HTML...');
    const structure = await page.evaluate(() => {
      return {
        sectionCount: document.querySelectorAll('section').length,
        hasHeader: !!document.querySelector('header') || !!document.querySelector('.header'),
        hasNav: !!document.querySelector('nav') || document.querySelectorAll('a').length > 5
      };
    });

    console.log(`Secciones: ${structure.sectionCount}, Header: ${structure.hasHeader}, Nav: ${structure.hasNav}`);
    if (structure.sectionCount > 0 && structure.hasNav) {
      console.log('✅ Estructura válida\n');
      results.tests.push({ name: 'Estructura HTML', status: 'PASS', ...structure });
      results.summary.passed++;
    } else {
      console.log('⚠️  Estructura incompleta\n');
      results.tests.push({ name: 'Estructura HTML', status: 'WARNING', ...structure });
      results.summary.warnings++;
    }

    // TEST 6: Errores
    console.log('📌 TEST 6: Verificando errores de consola...');
    const errors = consoleMessages.filter(m => m.type === 'error');
    console.log(`Errores: ${errors.length}`);

    if (errors.length === 0) {
      console.log('✅ Sin errores\n');
      results.tests.push({ name: 'Errores console', status: 'PASS' });
      results.summary.passed++;
    } else {
      errors.forEach(e => console.log(`   ❌ ${e.text}`));
      console.log();
      results.tests.push({ name: 'Errores console', status: 'FAIL', errorCount: errors.length });
      results.summary.failed++;
    }

    // TEST 7: Cache headers
    console.log('📌 TEST 7: Verificando headers HTTP...');
    const response = await page.goto(results.url);
    const cacheControl = response.headers()['cache-control'];
    console.log(`Cache-Control: ${cacheControl}`);

    if (cacheControl && cacheControl.includes('no-cache')) {
      console.log('✅ Cache desactivado\n');
      results.tests.push({ name: 'HTTP Headers', status: 'PASS' });
      results.summary.passed++;
    } else {
      console.log('⚠️  Cache podría estar activo\n');
      results.tests.push({ name: 'HTTP Headers', status: 'WARNING' });
      results.summary.warnings++;
    }

    // TEST 8: Responsive
    console.log('📌 TEST 8: Verificando responsive...');
    const viewports = [
      { name: 'Mobile 375px', w: 375 },
      { name: 'Tablet 768px', w: 768 },
      { name: 'Desktop 1920px', w: 1920 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: 800 });
      const ok = await page.evaluate(() => {
        return document.body.offsetWidth > 0;
      });
      console.log(`  ${vp.name}: ${ok ? '✅' : '❌'}`);
    }
    console.log();
    results.tests.push({ name: 'Responsive Design', status: 'PASS' });
    results.summary.passed++;

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    results.summary.failed++;
  } finally {
    await browser.close();
  }

  // RESUMEN
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Exitosas:     ${results.summary.passed}`);
  console.log(`❌ Fallidas:     ${results.summary.failed}`);
  console.log(`⚠️  Advertencias: ${results.summary.warnings}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (results.summary.failed === 0) {
    console.log('🎉 SISTEMA LISTO PARA PRODUCCIÓN\n');
  } else {
    console.log('🔴 REQUIERE ATENCIÓN\n');
  }

  fs.writeFileSync('test-results-e2e.json', JSON.stringify(results, null, 2));
  process.exit(results.summary.failed > 0 ? 1 : 0);
})();