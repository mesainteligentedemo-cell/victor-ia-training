import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://victor-ia-training.vercel.app';
const AGENT_ID = 'agent_2201kxes45mbfmsvpn8k7b9z3fnm';
// Roster member REAL (autorizado). El gate exige nombre+numero exactos.
const EMP = { name: 'Andres Mateos', emp: '12345', dep: 'Dirección' };

const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: [],
  net: { verifyEmployee: null, signedUrl: null, livekit: 0, elevenlabsWs: 0 },
};
const log = (m) => console.log(m);
const pass = (n, extra = {}) => { results.tests.push({ name: n, status: 'PASS', ...extra }); log(`  ✅ ${n}`); };
const fail = (n, extra = {}) => { results.tests.push({ name: n, status: 'FAIL', ...extra }); log(`  ❌ ${n}`); };
const warn = (n, extra = {}) => { results.tests.push({ name: n, status: 'WARN', ...extra }); log(`  ⚠️  ${n}`); };
const info = (n, extra = {}) => { results.tests.push({ name: n, status: 'INFO', ...extra }); log(`  ℹ️  ${n}`); };

(async () => {
  log('═══════════════════════════════════════════════════════════════');
  log('🧪 PRUEBA E2E REAL — VTC Training Post-Call');
  log('═══════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--use-fake-ui-for-media-stream',   // auto-acepta permiso de mic
      '--use-fake-device-for-media-stream' // audio sintetico (sin voz real)
    ],
  });
  const context = await browser.newContext({ permissions: ['microphone'] });
  const page = await context.newPage();

  // Espionaje de red
  page.on('response', async (res) => {
    const u = res.url();
    if (u.includes('/api/verify-employee')) {
      try { results.net.verifyEmployee = { status: res.status(), body: await res.json() }; } catch { results.net.verifyEmployee = { status: res.status() }; }
    }
    if (u.includes('/api/signed-url')) {
      try { const b = await res.json(); results.net.signedUrl = { status: res.status(), conversation_id: b.conversation_id, hasToken: !!b.client_secret, hasSignedUrl: !!b.signed_url }; } catch { results.net.signedUrl = { status: res.status() }; }
    }
  });
  page.on('websocket', (ws) => {
    const u = ws.url();
    if (u.includes('livekit') || u.includes('.cloud')) results.net.livekit++;
    if (u.includes('elevenlabs.io') && u.includes('convai')) results.net.elevenlabsWs++;
    log(`   🔌 WebSocket: ${u.slice(0, 90)}`);
  });

  try {
    // TEST 1 — carga
    log('📌 TEST 1: Cargar sitio');
    const resp = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    (resp && resp.status() === 200) ? pass('Carga de pagina (200)') : fail('Carga de pagina', { status: resp && resp.status() });

    // TEST 2 — agent id presente
    log('📌 TEST 2: Agent ID en el bundle');
    const hasAgent = await page.evaluate((id) => document.documentElement.innerHTML.includes(id), AGENT_ID);
    hasAgent ? pass('Agent ID presente', { agentId: AGENT_ID }) : fail('Agent ID no encontrado');

    // TEST 3 — abrir widget
    log('📌 TEST 3: Abrir widget #vw-launch');
    await page.waitForSelector('#vw-launch', { timeout: 15000 });
    await page.click('#vw-launch');
    await page.waitForTimeout(1200);
    const gateVisible = await page.isVisible('#vw-gate').catch(() => false);
    gateVisible ? pass('Widget abierto (gate visible)') : warn('Widget abierto pero gate no visible');

    // TEST 4 — llenar gate con roster real
    log('📌 TEST 4: Llenar gate (roster real) y comenzar');
    await page.fill('#vw-name', EMP.name);
    await page.fill('#vw-emp', EMP.emp);
    // department es <select>
    try { await page.selectOption('#vw-dep', { label: EMP.dep }); }
    catch { try { await page.selectOption('#vw-dep', EMP.dep); } catch {} }
    await page.click('#vw-cta');
    log('   ⏳ Esperando verify-employee + signed-url + WebRTC (25s)...');
    await page.waitForTimeout(25000);

    // TEST 5 — verify-employee
    log('📌 TEST 5: /api/verify-employee');
    const ve = results.net.verifyEmployee;
    if (ve && ve.status === 200 && ve.body && ve.body.authorized) pass('verify-employee 200 authorized', { role: ve.body.role });
    else if (ve) fail('verify-employee no autorizo', { got: ve });
    else warn('verify-employee no se observo en la red');

    // TEST 6 — signed-url (token ElevenLabs)
    log('📌 TEST 6: /api/signed-url');
    const su = results.net.signedUrl;
    if (su && su.status === 200 && su.hasToken) pass('signed-url 200 con token ElevenLabs', { conversation_id: su.conversation_id, hasSignedUrl: su.hasSignedUrl });
    else if (su) fail('signed-url fallo', { got: su });
    else warn('signed-url no se observo en la red');

    // TEST 7 — WebRTC / conexion al agente
    log('📌 TEST 7: Conexion WebRTC al agente');
    if (results.net.livekit > 0 || results.net.elevenlabsWs > 0) pass('Sesion de voz iniciada (WS abierto)', { livekit: results.net.livekit, elevenlabsWs: results.net.elevenlabsWs });
    else info('WS de voz no capturado (SDK puede usar WebRTC/DTLS no-WS o mic sintetico sin habla)');

    // TEST 8 — webhook post-call (aclaracion arquitectonica)
    log('📌 TEST 8: Webhook post-call n8n');
    info('El webhook elevenlabs-postall lo dispara ElevenLabs (servidor) al COLGAR, no el navegador. No es interceptable en la pagina. Requiere sesion de voz real para generar reporte+PDF+audio+email.');

  } catch (e) {
    fail('Excepcion', { error: e.message });
    log(`   ❌ ${e.message}`);
  } finally {
    log('\n═══════════════════════════════════════════════════════════════');
    log('📊 RESUMEN');
    log('═══════════════════════════════════════════════════════════════');
    const c = { PASS: 0, FAIL: 0, WARN: 0, INFO: 0 };
    results.tests.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    log(`PASS ${c.PASS} · FAIL ${c.FAIL} · WARN ${c.WARN} · INFO ${c.INFO}`);
    log(`verify-employee: ${results.net.verifyEmployee?.status || 'n/a'} · signed-url: ${results.net.signedUrl?.status || 'n/a'}`);
    log('═══════════════════════════════════════════════════════════════\n');
    fs.writeFileSync('test-e2e-results.json', JSON.stringify(results, null, 2));
    log('📁 test-e2e-results.json');
    await browser.close();
  }
})();
