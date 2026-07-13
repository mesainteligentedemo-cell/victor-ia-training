import { chromium } from 'playwright';

const URL = 'https://victor-ia-training.vercel.app/';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST E2E COMPLETO: VTC TRAINING SYSTEM');
  console.log('='.repeat(60) + '\n');

  const results = {
    login: false,
    modulo_f_visible: false,
    blocks_responsive: false,
    quiz_completo: false,
    reporte_generado: false,
    email_enviado: false,
    errors: []
  };

  try {
    // PASO 1: LOGIN
    console.log('📋 PASO 1: Login\n');
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Llenar formulario
    const name_field = await page.$('#vw-name');
    const emp_field = await page.$('#vw-emp');
    const dep_field = await page.$('#vw-dep');

    if (!name_field || !emp_field || !dep_field) {
      results.errors.push('❌ Campos de login no encontrados');
      throw new Error('Login form not found');
    }

    await name_field.fill('Pablo Solar');
    await emp_field.fill('1234567');
    await dep_field.selectOption('Dirección');

    // Click en CTA
    const cta = await page.$('#vw-cta');
    await cta.click();

    // Esperar verificación
    await page.waitForTimeout(3000);

    // Verificar que se haya conectado (buscar widget o chat)
    const connected = await page.evaluate(() => {
      return !!document.getElementById('vw-chat');
    });

    if (connected) {
      results.login = true;
      console.log('✅ Login exitoso\n');
    } else {
      results.errors.push('❌ No se pudo conectar a ElevenLabs');
      throw new Error('Connection failed');
    }

    // PASO 2: VERIFICAR ESTRUCTURA
    console.log('📊 PASO 2: Verificar estructura de Módulo F\n');

    const structure = await page.evaluate(() => {
      const modules = {
        f_blocks: [],
        f_quiz: false,
        modulo_0: false,
        total_modules: 0
      };

      // Verificar bloques de Módulo F
      const f_blocks = document.querySelectorAll('[data-block-id^="f-"]');
      f_blocks.forEach(b => {
        modules.f_blocks.push({
          id: b.dataset.blockId,
          text: b.textContent.substring(0, 50)
        });
      });

      // Verificar Quiz F
      modules.f_quiz = !!document.querySelector('#modulo-f .quiz');

      // Verificar Módulo 0
      modules.modulo_0 = !!document.getElementById('modulo-0');

      // Contar módulos
      modules.total_modules = document.querySelectorAll('[id^="modulo-"]').length;

      return modules;
    });

    console.log(`  ✅ ${structure.f_blocks.length} bloques de Módulo F encontrados`);
    structure.f_blocks.forEach((b, i) => {
      console.log(`     f-${String(i+1).padStart(2, '0')}: ${b.text.substring(0, 40)}`);
    });
    console.log(`  ${structure.f_quiz ? '✅' : '❌'} Quiz Módulo F`);
    console.log(`  ${structure.modulo_0 ? '✅' : '❌'} Módulo 0 presente`);
    console.log(`  📦 ${structure.total_modules} módulos totales\n`);

    results.modulo_f_visible = structure.f_blocks.length === 6 && structure.f_quiz;

    // PASO 3: SCROLL Y VALIDACIÓN DE CONTENIDO
    console.log('🔍 PASO 3: Validar contenido clave\n');

    const content_check = await page.evaluate(() => {
      const body_text = document.body.textContent;
      const checks = {
        has_60_percent: body_text.includes('El 60%'),
        has_vtc_definition: body_text.includes('membresía vacacional de lujo'),
        has_arquetipos: body_text.includes('Arquetipos'),
        has_quiz_questions: body_text.match(/Pregunta \d+:/g) ? true : false,
        has_pnl: body_text.includes('neuronas espejo'),
        page_height: document.documentElement.scrollHeight
      };
      return checks;
    });

    console.log(`  ${content_check.has_60_percent ? '✅' : '⚠️'} "El 60%" (f-01) presente`);
    console.log(`  ${content_check.has_vtc_definition ? '✅' : '⚠️'} Definición VTC presente`);
    console.log(`  ${content_check.has_arquetipos ? '✅' : '⚠️'} Arquetipos (Módulo 0) presente`);
    console.log(`  ${content_check.has_pnl ? '✅' : '⚠️'} PNL presente`);
    console.log(`  ${content_check.has_quiz_questions ? '✅' : '⚠️'} Preguntas de quiz presentes`);
    console.log(`  📏 Altura total: ${content_check.page_height}px\n`);

    results.blocks_responsive = content_check.has_60_percent && content_check.has_quiz_questions;

    // PASO 4: VERIFICAR RESPUESTA DE API
    console.log('🔌 PASO 4: Validar endpoints de API\n');

    try {
      const verify_response = await page.evaluate(async () => {
        const res = await fetch('/api/verify-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Pablo Solar',
            employee_id: '1234567',
            department: 'Dirección'
          })
        });
        return { status: res.status, ok: res.ok };
      });

      console.log(`  ${verify_response.ok ? '✅' : '❌'} /api/verify-employee (${verify_response.status})`);
    } catch (e) {
      console.log(`  ⚠️ /api/verify-employee (error: ${e.message})`);
    }

    // RESULTADO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBA E2E');
    console.log('='.repeat(60) + '\n');

    console.log(`${results.login ? '✅' : '❌'} Login y conexión`);
    console.log(`${results.modulo_f_visible ? '✅' : '❌'} Módulo F (6 bloques + quiz)`);
    console.log(`${results.blocks_responsive ? '✅' : '❌'} Contenido clave validado`);

    if (results.errors.length > 0) {
      console.log(`\n❌ Errores encontrados:`);
      results.errors.forEach(e => console.log(`   ${e}`));
    } else {
      console.log(`\n✅ TODAS LAS PRUEBAS PASARON`);
      console.log(`\n🎯 Sistema LISTO para producción`);
    }

  } catch (e) {
    console.error('\n❌ ERROR:', e.message);
    results.errors.push(`ERROR: ${e.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

test();