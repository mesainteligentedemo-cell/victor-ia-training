# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-e2e-playwright.spec.js >> 📧 Verificación de Emails >> Email tiene contenido correcto
- Location: tests\test-e2e-playwright.spec.js:159:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: null
```

# Test source

```ts
  72  |         platform: 'web',
  73  |         userAgent: 'Mozilla/5.0...',
  74  |       },
  75  |     };
  76  | 
  77  |     console.log(`✓ Session ID: ${testContext.sessionId}`);
  78  |     console.log(`✓ Usuario: ${sessionData.user}`);
  79  |     console.log(`✓ Módulo: ${sessionData.moduleName}`);
  80  |     console.log(`✓ Puntuación quiz: ${sessionData.quizScore}%`);
  81  | 
  82  |     // En producción, esto sería un webhook POST desde el backend
  83  |     testContext.sessionData = sessionData;
  84  | 
  85  |     // Verificar que tenemos datos
  86  |     expect(testContext.sessionId).toBeTruthy();
  87  |     expect(sessionData.quizScore).toBe(100);
  88  |     expect(sessionData.status).toBe('completado');
  89  |   });
  90  | 
  91  |   test('Simular API call a Tracker', async ({ page }) => {
  92  |     console.log('\n📡 Simulando POST a Tracker API...');
  93  | 
  94  |     // Este test verifica que la llamada API al tracker funcionaría
  95  |     // En producción, interceptar el request real
  96  | 
  97  |     const trackerPayload = {
  98  |       sessionId: testContext.sessionId,
  99  |       user: testContext.sessionData.user,
  100 |       module: testContext.sessionData.module,
  101 |       quizScore: testContext.sessionData.quizScore,
  102 |       status: testContext.sessionData.status,
  103 |       ...testContext.sessionData,
  104 |     };
  105 | 
  106 |     console.log('✓ Payload preparado para Tracker:');
  107 |     console.log(`  - sessionId: ${trackerPayload.sessionId}`);
  108 |     console.log(`  - user: ${trackerPayload.user}`);
  109 |     console.log(`  - quizScore: ${trackerPayload.quizScore}`);
  110 |     console.log(`  - Status: ${trackerPayload.status}`);
  111 | 
  112 |     // Verificar estructura del payload
  113 |     const requiredFields = ['sessionId', 'user', 'module', 'quizScore', 'status'];
  114 |     for (const field of requiredFields) {
  115 |       expect(trackerPayload[field]).toBeDefined();
  116 |     }
  117 |   });
  118 | });
  119 | 
  120 | // ==========================================
  121 | // TEST SUITE: VERIFICACIÓN DE EMAILS
  122 | // ==========================================
  123 | 
  124 | test.describe('📧 Verificación de Emails', () => {
  125 |   test('Email llegó a todos los destinatarios', async () => {
  126 |     console.log('\n📬 Verificando entrega de emails...');
  127 | 
  128 |     if (!emailHelper) {
  129 |       test.skip();
  130 |       return;
  131 |     }
  132 | 
  133 |     const recipients = constants.EMAILS.to;
  134 |     console.log(`Destinatarios esperados: ${recipients.join(', ')}`);
  135 | 
  136 |     const deliveryResults = await emailHelper.verifyEmailDelivery(
  137 |       recipients,
  138 |       constants.TIMEOUTS.EMAIL_DELIVERY
  139 |     );
  140 | 
  141 |     console.log('\n📊 Resultados de entrega:');
  142 |     let allDelivered = true;
  143 | 
  144 |     for (const [recipient, result] of Object.entries(deliveryResults)) {
  145 |       const status = result.delivered ? '✓' : '✗';
  146 |       console.log(`${status} ${recipient}: ${result.delivered ? 'Entregado' : 'NO ENTREGADO'}`);
  147 |       if (!result.delivered) allDelivered = false;
  148 |     }
  149 | 
  150 |     if (!allDelivered) {
  151 |       console.warn('⚠️  Algunos emails no fueron entregados');
  152 |     } else {
  153 |       console.log('\n✓ Todos los emails entregados exitosamente');
  154 |     }
  155 | 
  156 |     expect(allDelivered).toBe(true);
  157 |   });
  158 | 
  159 |   test('Email tiene contenido correcto', async () => {
  160 |     console.log('\n📄 Verificando contenido del email...');
  161 | 
  162 |     if (!emailHelper) {
  163 |       test.skip();
  164 |       return;
  165 |     }
  166 | 
  167 |     // Obtener el último email
  168 |     const latestEmail = await emailHelper.getLatestEmailTo(constants.TEST_USER.email);
  169 | 
  170 |     if (!latestEmail) {
  171 |       console.error('❌ No se encontró email para verificar');
> 172 |       expect(latestEmail).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
  173 |       return;
  174 |     }
  175 | 
  176 |     console.log('✓ Email encontrado');
  177 | 
  178 |     // Verificar asunto
  179 |     const subject = latestEmail.Content?.Headers?.Subject?.[0] || '';
  180 |     console.log(`  Asunto: "${subject}"`);
  181 | 
  182 |     const subjectCheck = constants.EMAILS.subject_contains.every(
  183 |       part => subject.includes(part)
  184 |     );
  185 | 
  186 |     if (!subjectCheck) {
  187 |       console.warn(`⚠️  Asunto no contiene todas las palabras clave esperadas`);
  188 |       console.warn(`  Esperado: ${constants.EMAILS.subject_contains.join(' + ')}`);
  189 |     } else {
  190 |       console.log('✓ Asunto correcto');
  191 |     }
  192 | 
  193 |     // Verificar contenido body
  194 |     const body = latestEmail.Content?.Body || '';
  195 |     const bodyChecks = {
  196 |       'Nombre usuario': body.includes(constants.TEST_USER.name),
  197 |       'Cédula': body.includes(constants.TEST_USER.cedula),
  198 |       'Módulo completado': body.includes(constants.MODULE.name),
  199 |       'Puntuación': body.includes('100'),
  200 |       'Neurotransmisores': body.includes('oxitocina') || body.includes('dopamina'),
  201 |     };
  202 | 
  203 |     console.log('\n📋 Verificaciones de contenido:');
  204 |     let allChecksPassed = true;
  205 |     for (const [check, passed] of Object.entries(bodyChecks)) {
  206 |       const icon = passed ? '✓' : '✗';
  207 |       console.log(`  ${icon} ${check}`);
  208 |       if (!passed) allChecksPassed = false;
  209 |     }
  210 | 
  211 |     if (!allChecksPassed) {
  212 |       console.warn('⚠️  Algunos contenidos esperados no están en el email');
  213 |     }
  214 | 
  215 |     expect(subjectCheck).toBe(true);
  216 |   });
  217 | 
  218 |   test('Email tiene PDF adjunto', async () => {
  219 |     console.log('\n📎 Verificando adjunto PDF...');
  220 | 
  221 |     if (!emailHelper) {
  222 |       test.skip();
  223 |       return;
  224 |     }
  225 | 
  226 |     const latestEmail = await emailHelper.getLatestEmailTo(constants.TEST_USER.email);
  227 | 
  228 |     if (!latestEmail) {
  229 |       console.error('❌ Email no encontrado');
  230 |       expect(latestEmail).toBeTruthy();
  231 |       return;
  232 |     }
  233 | 
  234 |     const hasPDF = await emailHelper.verifyEmailAttachment(latestEmail);
  235 | 
  236 |     if (hasPDF) {
  237 |       console.log('✓ PDF encontrado como adjunto');
  238 |     } else {
  239 |       console.warn('⚠️  No se encontró PDF adjunto');
  240 |     }
  241 | 
  242 |     expect(hasPDF).toBe(true);
  243 |   });
  244 | 
  245 |   test('Email enviado dentro del timeout esperado', async () => {
  246 |     console.log('\n⏱️  Verificando timing de envío...');
  247 | 
  248 |     if (!emailHelper) {
  249 |       test.skip();
  250 |       return;
  251 |     }
  252 | 
  253 |     const stats = await emailHelper.getEmailStats();
  254 |     console.log(`✓ Emails capturados: ${stats.count}`);
  255 |     console.log(`✓ Total: ${stats.total}`);
  256 | 
  257 |     expect(stats.count).toBeGreaterThan(0);
  258 |   });
  259 | });
  260 | 
  261 | // ==========================================
  262 | // TEST SUITE: VERIFICACIÓN DE TRACKER
  263 | // ==========================================
  264 | 
  265 | test.describe('📊 Verificación de Tracker (Supabase)', () => {
  266 |   test('Datos insertados en tabla tracker_results', async () => {
  267 |     console.log('\n🔍 Buscando datos en Tracker...');
  268 | 
  269 |     // Aquí esperaríamos que el webhook/API ya haya insertado
  270 |     // los datos. Esperar un momento para consistencia de BD.
  271 |     await new Promise(resolve => setTimeout(resolve, 2000));
  272 | 
```