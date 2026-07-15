# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-e2e-playwright.spec.js >> 📋 Resumen y Reporte >> Verificar que no hay errores críticos
- Location: tests\test-e2e-playwright.spec.js:566:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  478 |       expectedValues,
  479 |       constants.TIMEOUTS.API_RESPONSE
  480 |     );
  481 | 
  482 |     if (result.received) {
  483 |       console.log('\n📋 Verificación de datos:');
  484 |       for (const [key, check] of Object.entries(result.results)) {
  485 |         const status = check.passed ? '✓' : '✗';
  486 |         console.log(`  ${status} ${key}`);
  487 |         console.log(`      Expected: ${check.expected}`);
  488 |         console.log(`      Actual:   ${check.actual}`);
  489 |       }
  490 | 
  491 |       if (result.allPassed) {
  492 |         console.log('✓ Todos los datos correctos');
  493 |       } else {
  494 |         console.warn('⚠️  Algunos datos no coinciden');
  495 |       }
  496 |     }
  497 |   });
  498 | 
  499 |   test('Método HTTP es POST', async () => {
  500 |     console.log('\n📮 Verificando método HTTP...');
  501 | 
  502 |     if (!webhookHelper.webhookId) {
  503 |       console.log('⚠️  Sin webhook ID configurado (skipped)');
  504 |       test.skip();
  505 |       return;
  506 |     }
  507 | 
  508 |     const result = await webhookHelper.verifyWebhookMethod(
  509 |       'POST',
  510 |       constants.TIMEOUTS.API_RESPONSE
  511 |     );
  512 | 
  513 |     if (result.found) {
  514 |       console.log('✓ Webhook recibido como POST');
  515 |       console.log(`  - URL: ${result.webhook.url}`);
  516 |     } else {
  517 |       console.warn('⚠️  POST webhook no encontrado');
  518 |     }
  519 |   });
  520 | });
  521 | 
  522 | // ==========================================
  523 | // TEST SUITE: RESUMEN FINAL
  524 | // ==========================================
  525 | 
  526 | test.describe('📋 Resumen y Reporte', () => {
  527 |   test('Generar reporte de verificaciones', async () => {
  528 |     console.log('\n========================================');
  529 |     console.log('📋 RESUMEN DE VERIFICACIONES');
  530 |     console.log('========================================\n');
  531 | 
  532 |     const report = {
  533 |       timestamp: new Date().toISOString(),
  534 |       sessionId: testContext.sessionId,
  535 |       testUser: constants.TEST_USER.name,
  536 |       module: constants.MODULE.name,
  537 | 
  538 |       checklist: {
  539 |         '✓ Flujo de capacitación completado': true,
  540 |         '✓ Emails entregados': true,
  541 |         '✓ Email con contenido correcto': true,
  542 |         '✓ Email con PDF adjunto': true,
  543 |         '✓ Datos en Tracker': !!testContext.trackerData,
  544 |         '✓ Campos requeridos presentes': !!testContext.trackerData,
  545 |         '✓ Valores correctos en Tracker': !!testContext.trackerData,
  546 |         '✓ Timestamp reciente': !!testContext.trackerData,
  547 |         '✓ Webhook recibido': false, // Depende de webhook.site
  548 |       },
  549 | 
  550 |       details: {
  551 |         email_recipients: constants.EMAILS.to,
  552 |         quiz_score: constants.QUIZ_SCORE,
  553 |         module_id: constants.MODULE.id,
  554 |         tracker_url: constants.URLS.TRACKER,
  555 |         session_created: new Date().toISOString(),
  556 |       },
  557 |     };
  558 | 
  559 |     console.log(JSON.stringify(report, null, 2));
  560 | 
  561 |     console.log('\n✅ Reporte completado');
  562 |     console.log('📊 Ver detalles: playwright-report/index.html');
  563 |     console.log('📄 Resultados JSON: test-results.json');
  564 |   });
  565 | 
  566 |   test('Verificar que no hay errores críticos', async () => {
  567 |     // Este es un test "validador" que verifica el estado general
  568 | 
  569 |     const criticalChecks = {
  570 |       'Session ID generado': !!testContext.sessionId,
  571 |       'Datos de sesión': !!testContext.sessionData,
  572 |     };
  573 | 
  574 |     console.log('\n🔐 Verificaciones críticas:');
  575 |     for (const [check, passed] of Object.entries(criticalChecks)) {
  576 |       const status = passed ? '✓' : '✗';
  577 |       console.log(`  ${status} ${check}`);
> 578 |       expect(passed).toBe(true);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  579 |     }
  580 |   });
  581 | });
```