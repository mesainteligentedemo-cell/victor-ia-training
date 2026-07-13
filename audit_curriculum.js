import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔍 AUDITORÍA COMPLETA: VTC Curriculum\n');
  console.log('URL: https://victor-ia-training.vercel.app/\n');

  await page.goto('https://victor-ia-training.vercel.app/', { waitUntil: 'load', timeout: 30000 });

  await page.waitForTimeout(2000);

  console.log('=== ESTRUCTURA PRINCIPAL ===\n');

  const sections = await page.evaluate(() => {
    const ids = ['hero', 'indice', 'bienvenida', 'modulo-f', 'modulo-0', 'modulo-1', 'modulo-2'];
    const found = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      found[id] = el ? '✅' : '❌';
    });
    return found;
  });

  Object.entries(sections).forEach(([id, status]) => {
    console.log(`${status} ${id}`);
  });

  console.log('\n=== MÓDULO F (FUNDAMENTOS) ===\n');

  const moduloFBlocks = await page.evaluate(() => {
    const blocks = [];
    ['f-01', 'f-02', 'f-03', 'f-04', 'f-05', 'f-06'].forEach(id => {
      const el = document.querySelector(`[data-block-id="${id}"]`);
      if (el) {
        blocks.push({
          id,
          title: el.querySelector('h3, h2') ? el.querySelector('h3, h2').textContent.trim() : 'Sin título',
          content: el.textContent.substring(0, 80).trim()
        });
      }
    });
    return blocks;
  });

  if (moduloFBlocks.length > 0) {
    console.log(`✅ ${moduloFBlocks.length}/6 bloques encontrados\n`);
    moduloFBlocks.forEach((b, i) => {
      console.log(`  f-${String(i+1).padStart(2, '0')}: ${b.title.substring(0, 50)}`);
    });
  } else {
    console.log('❌ NO SE ENCONTRARON BLOQUES DE MÓDULO F');
  }

  console.log('\n=== TOTAL DE MÓDULOS ===\n');

  const totalModules = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="module"], [class*="modulo"], .card');
    const modules = Array.from(cards).filter(c => c.textContent.includes('Módulo'));
    return modules.length;
  });

  console.log(`Total de módulos en índice: ${totalModules} (esperado: 16+)`);

  console.log('\n=== VERIFICACIÓN DE SCROLL ===\n');

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`Altura total de la página: ${scrollHeight}px`);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1000);

  const allText = await page.evaluate(() => {
    const text = document.body.textContent;
    return {
      hasModuloF: text.includes('Módulo F'),
      hasModulo0: text.includes('Módulo 0'),
      hasQuizzes: text.includes('Quiz'),
      hasEmail: text.includes('correo') || text.includes('email'),
      el60Percent: text.includes('El 60%'),
      hasArquetipos: text.includes('Arquetipos'),
      hasPNL: text.includes('neuronas espejo'),
      hasPresion: text.includes('Presión del floor'),
    };
  });

  console.log(`${allText.hasModuloF ? '✅' : '❌'} Módulo F presente`);
  console.log(`${allText.hasModulo0 ? '✅' : '❌'} Módulo 0 presente`);
  console.log(`${allText.hasQuizzes ? '✅' : '❌'} Quizzes presentes`);
  console.log(`${allText.el60Percent ? '✅' : '❌'} Texto "El 60%" en Módulo F`);
  console.log(`${allText.hasArquetipos ? '✅' : '❌'} Arquetipos (Módulo 0)`);
  console.log(`${allText.hasPNL ? '✅' : '❌'} PNL neuronas espejo`);
  console.log(`${allText.hasPresion ? '✅' : '❌'} Presión del floor`);

  console.log('\n' + '='.repeat(50));
  console.log('✅ AUDITORÍA COMPLETADA');
  console.log('='.repeat(50));

  await browser.close();
  process.exit(0);
})();