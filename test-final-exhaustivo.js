const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🚀 TEST E2E FINAL - COACH VÍCTOR\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = { passed: 0, failed: 0, warnings: 0, details: [] };

  try {
    // LOAD
    console.log('⏳ Cargando https://victor-ia-training.vercel.app/...');
    await page.goto('https://victor-ia-training.vercel.app/', { waitUntil: 'networkidle' });

    // Get full HTML length to verify which file is being served
    const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);
    console.log(`📊 Tamaño HTML: ${htmlLength} caracteres\n`);

    // TEST 1: Agent ID CORRECTO
    console.log('TEST 1: Agent ID');
    const agentId = await page.evaluate(() => {
      return document.body.innerHTML.match(/agent_[a-z0-9]+/)?.[0];
    });

    if (agentId === 'agent_2201kxes45mbfmsvpn8k7b9z3fnm') {
      console.log(`✅ CORRECTO: ${agentId}\n`);
      results.passed++;
    } else {
      console.log(`❌ INCORRECTO: ${agentId}\n`);
      results.failed++;
      results.details.push(`Agent ID: ${agentId}`);
    }

    // TEST 2: Widget ElevenLabs
    console.log('TEST 2: Widget ElevenLabs');
    const widget = await page.evaluate(() => {
      const tag = !!document.querySelector('elevenlabs-convai');
      const script = Array.from(document.scripts).some(s => s.src?.includes('elevenlabs'));
      const widgetAttr = document.querySelector('elevenlabs-convai')?.getAttribute('agent-id');
      return { tag, script, widgetAttr };
    });

    if (widget.tag && widget.script && widget.widgetAttr === 'agent_2201kxes45mbfmsvpn8k7b9z3fnm') {
      console.log(`✅ Widget presente con agent ID correcto\n`);
      results.passed++;
    } else {
      console.log(`❌ Widget: ${widget.tag}, Script: ${widget.script}, Attr: ${widget.widgetAttr}\n`);
      results.failed++;
    }

    // TEST 3: Sin errores críticos
    console.log('TEST 3: Errores en consola');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    await page.waitForTimeout(2000);

    if (errors.length === 0) {
      console.log(`✅ Sin errores críticos\n`);
      results.passed++;
    } else {
      console.log(`⚠️  ${errors.length} errores encontrados:`);
      errors.forEach(e => console.log(`   - ${e}`));
      console.log();
      results.warnings++;
    }

    // TEST 4: Estructura
    console.log('TEST 4: Estructura HTML');
    const struct = await page.evaluate(() => ({
      sections: document.querySelectorAll('section').length,
      hasNav: document.querySelectorAll('a').length > 5,
      hasTitle: !!document.querySelector('h1')
    }));

    if (struct.sections > 0 && struct.hasNav && struct.hasTitle) {
      console.log(`✅ Estructura válida (${struct.sections} secciones)\n`);
      results.passed++;
    } else {
      console.log(`⚠️  Estructura incompleta\n`);
      results.warnings++;
    }

    // TEST 5: Responsive
    console.log('TEST 5: Responsive');
    const viewports = [
      { name: 'Mobile 375px', w: 375 },
      { name: 'Tablet 768px', w: 768 },
      { name: 'Desktop 1920px', w: 1920 }
    ];

    let allResponsive = true;
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: 800 });
      const visible = await page.evaluate(() => document.body.offsetWidth > 0);
      console.log(`  ${vp.name}: ${visible ? '✅' : '❌'}`);
      if (!visible) allResponsive = false;
    }
    console.log();
    if (allResponsive) results.passed++;
    else results.warnings++;

    // RESUMEN
    console.log('═══════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Exitosas:     ${results.passed}`);
    console.log(`❌ Fallidas:     ${results.failed}`);
    console.log(`⚠️  Advertencias: ${results.warnings}`);
    console.log('═══════════════════════════════════════════\n');

    if (results.failed === 0) {
      console.log('🎉 SISTEMA FUNCIONAL Y LISTO PARA PRODUCCIÓN\n');
      process.exit(0);
    } else {
      console.log('🔴 REQUIERE ATENCIÓN\n');
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();