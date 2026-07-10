// ============================================================================
// SNIPPET PARA ACTUALIZAR: frontend/public/index.html
// Versión: Opción B (Seguridad mínima con signed-url)
// Reemplazar la función startCourse() con este código
// ============================================================================

async function startCourse(name, emp, dep, textOnly = false) {
  if (!name || !emp || !dep) {
    setStatus('Por favor completa todos los campos.');
    return;
  }

  setStatus('Verificando acceso...');

  try {
    // =========================================================
    // PASO 1: Verificar empleado (igual que Opción A)
    // =========================================================
    const verifyRes = await fetch('/api/verify-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        employee_id: emp.trim()
      })
    });

    if (!verifyRes.ok) {
      const errData = await verifyRes.json();
      setStatus(errData.error || 'Acceso denegado.');
      return;
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.valid) {
      setStatus(verifyData.error || 'Empleado no verificado. Contacta a Pablo Solar.');
      return;
    }

    console.log(`✅ Empleado verificado: ${verifyData.role}`);
    setStatus('Empleado verificado. Generando token...');

    // =========================================================
    // PASO 2: NUEVO - Obtener signed-url (token de autenticación)
    // =========================================================
    const signedUrlRes = await fetch('/api/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: emp.trim(),
        user_name: name.trim(),
        employee_id: emp.trim()
      })
    });

    if (!signedUrlRes.ok) {
      const errData = await signedUrlRes.json();
      console.error('❌ Error generando token:', errData);
      setStatus('Error de autenticación. Intenta de nuevo.');
      return;
    }

    const tokenData = await signedUrlRes.json();
    console.log(`✅ Token generado: ${tokenData.conversation_id}`);
    setStatus('Token generado. Conectando...');

    // =========================================================
    // PASO 3: Configuración de sesión (igual que Opción A, pero con clientSecret)
    // =========================================================
    const sessionConfig = {
      agentId: 'agent_9501k3vkt6svekjs6y0qe5xzcek1',
      clientSecret: tokenData.client_secret, // ← NUEVO: token firmado
      overrides: {
        agent: {
          prompt: '',
          firstMessage: ''
        },
        conversation: {
          textOnly: textOnly || false
        },
        dynamicVariables: {
          user_name: name.trim(),
          employee_number: emp.trim(),
          departamento: dep.trim()
        }
      }
    };

    // =========================================================
    // PASO 4: Iniciar sesión (igual que Opción A)
    // =========================================================
    await startSession(sessionConfig);

    // Si llegamos aquí, la conexión fue exitosa
    setStatus(textOnly ? '✓ Modo texto activo — escribe tu mensaje' : '✓ Conectado');

    // Log local
    localStorage.setItem('vtc_last_session', JSON.stringify({
      name,
      emp,
      dep,
      timestamp: new Date().toISOString()
    }));

    console.log('🎉 Sesión iniciada con token firmado');

  } catch (error) {
    console.error('❌ Error en startCourse:', error);
    setStatus(`Error de conexión: ${error.message}`);
  }
}

// ============================================================================
// HELPER: setStatus (ya existe, solo referencia)
// ============================================================================
// Esta función ya está definida en index.html, no necesitas cambiarla
// function setStatus(msg) {
//   const el = document.querySelector('#vw-status');
//   if (el) el.textContent = msg;
// }

// ============================================================================
// HELPER: startSession (del SDK, ya existe, no necesitas cambiarla)
// ============================================================================
// Esta función viene del SDK de ElevenLabs: @elevenlabs/client
// Ahora solo recibe clientSecret adicional en sessionConfig

// ============================================================================
// NOTAS DE IMPLEMENTACIÓN
// ============================================================================
// 1. Los cambios son ADITIVOS — solo agregamos token signing
// 2. El fallback de texto (Opción A) sigue siendo igual
// 3. verify_employee webhook sigue siendo igual
// 4. Solo el nuevo paso 2 (signed-url) es nuevo
// 5. Si signed-url falla, el chat no conecta (comportamiento correcto)
// 6. Si quieres permitir fallback sin token, puedes hacer:
//
//    if (!signedUrlRes.ok) {
//      console.warn('⚠️ Token no disponible, conectando sin auth');
//      // sessionConfig sin clientSecret
//    }
//
//    Pero NO recomendado para Opción B (derrota el propósito de seguridad)

// ============================================================================
// TESTING (en consola del navegador)
// ============================================================================
// 1. Abrir: https://victor-ia-training.vercel.app
// 2. Abrir DevTools (F12)
// 3. En consola, ejecutar:
//    startCourse('Andrés Mateos', 'VTC-CL-014', 'Closer', false)
// 4. Ver logs:
//    ✅ Empleado verificado
//    ✅ Token generado
//    ✅ Sesión iniciada
// 5. El chat debe conectar y la voz debe sonar como Enrique M. Nieto