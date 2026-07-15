const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🧪 INICIANDO PRUEBAS E2E - Coach VÍCTOR\n');

  try {
    // TEST 1: Cargar sitio
    console.log('TEST 1: Cargando sitio...');
    await page.goto('https://victor-ia-training.vercel.app/', { waitUntil: 'networkidle' });
    console.log('✅ Sitio cargado correctamente\n');

    // TEST 2: Verificar agent ID correcto en el HTML
    console.log('TEST 2: Verificando Agent ID...');
    const agentId = await page.evaluate(() => {
      const match = document.body.innerHTML.match(/agent_[a-z0-9]+/);
      return match ? match[0] : null;
    });
    console.log(`Agent ID encontrado: ${agentId}`);
    
    if (agentId === 'agent_2201kxes45mbfmsvpn8k7b9z3fnm') {
      console.log('✅ Agent ID CORRECTO\n');
    } else {
      console.log(`❌ Agent ID INCORRECTO. Esperado: agent_2201kxes45mbfmsvpn8k7b9z3fnm, Encontrado: ${agentId}\n`);
    }

    // TEST 3: Widget ElevenLabs embebido
    console.log('TEST 3: Verificando widget ElevenLabs...');
    const hasWidget = await page.evaluate(() => {
      return !!document.querySelector('elevenlabs-convai');
    });
    
    if (hasWidget) {
      console.log('✅ Widget ElevenLabs embebido correctamente\n');
    } else {
      console.log('❌ Widget ElevenLabs NO encontrado\n');
    }

    // TEST 4: Verificar estructura de página
    console.log('TEST 4: Verificando estructura...');
    const hasTitle = await page.evaluate(() => {
      return document.querySelector('h1') !== null;
    });
    
    const hasModules = await page.evaluate(() => {
      return document.querySelectorAll('section').length > 0;
    });

    if (hasTitle && hasModules) {
      console.log('✅ Estructura de página válida\n');
    } else {
      console.log('❌ Estructura de página incompleta\n');
    }

    // TEST 5: Verificar script de ElevenLabs
    console.log('TEST 5: Verificando script de ElevenLabs...');
    const hasElevenLabsScript = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return scripts.some(s => s.src.includes('elevenlabs'));
    });
    
    if (hasElevenLabsScript) {
      console.log('✅ Script ElevenLabs cargado\n');
    } else {
      console.log('⚠️  Script ElevenLabs podría no estar cargado\n');
    }

    // TEST 6: Verificar que no hay errores críticos
    console.log('TEST 6: Capturando errores de la consola...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length === 0) {
      console.log('✅ Sin errores críticos en la consola\n');
    } else {
      console.log(`⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach(e => console.log(`   - ${e}`));
    }

    // RESUMEN FINAL
    console.log('\n═══════════════════════════════════════');
    console.log('✅ RESUMEN DE PRUEBAS COMPLETADO');
    console.log('═══════════════════════════════════════');
    console.log(`Agent ID:        ${agentId === 'agent_2201kxes45mbfmsvpn8k7b9z3fnm' ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
    console.log(`Widget:          ${hasWidget ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    console.log(`Estructura:      ${hasTitle && hasModules ? '✅ VÁLIDA' : '❌ INCOMPLETA'}`);
    console.log(`Script EL:       ${hasElevenLabsScript ? '✅ PRESENTE' : '⚠️  AUSENTE'}`);
    console.log(`Errores:         ${errors.length === 0 ? '✅ NINGUNO' : `❌ ${errors.length}`}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR EN PRUEBAS:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
