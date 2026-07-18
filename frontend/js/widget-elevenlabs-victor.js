/**
 * WIDGET ELEVENLABS VICTOR
 *
 * Abre el agente Víctor con los datos del formulario
 * Detecta idioma automáticamente
 * Pasa datos: nombre, ID empleado, departamento, idioma
 *
 * Uso: startVictorChat(name, employeeId, department)
 */

(function() {
  'use strict';

  // ─────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────
  const CONFIG = {
    agentId: 'agent_2201kxes45mbfmsvpn8k7b9z3fnm',
    apiVerifyUrl: '/api/verify-employee',
    apiSignedUrl: '/api/signed-url'
  };

  // ─────────────────────────────────────────
  // DETECTAR IDIOMA
  // ─────────────────────────────────────────
  function detectLanguage() {
    // Primero check localStorage
    const stored = localStorage.getItem('session_language');
    if (stored) return stored;

    // Luego navigator.language
    const nav = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
    return nav.includes('en') ? 'en' : 'es';
  }

  // ─────────────────────────────────────────
  // FUNCIÓN PRINCIPAL
  // ─────────────────────────────────────────
  async function startVictorChat(name, employeeId, department) {
    try {
      // 1. Detectar idioma
      const language = detectLanguage();
      localStorage.setItem('session_language', language);

      console.log('[Victor Widget] Starting with:', { name, employeeId, department, language });

      // 2. Verificar empleado
      const verifyRes = await fetch(CONFIG.apiVerifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          employee_id: employeeId.trim(),
          department: department.trim()
        })
      });

      if (!verifyRes.ok) {
        alert('Acceso denegado. Verifica tus datos.');
        return;
      }

      const verifyData = await verifyRes.json();
      console.log('[Victor Widget] Verified:', verifyData);

      // 3. Obtener signed URL
      const signedRes = await fetch(CONFIG.apiSignedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${verifyData.session_token}`
        },
        body: JSON.stringify({
          user_id: employeeId.trim(),
          user_name: name.trim(),
          employee_id: employeeId.trim()
        })
      });

      if (!signedRes.ok) {
        alert('Error al iniciar la sesión.');
        return;
      }

      const tokenData = await signedRes.json();
      console.log('[Victor Widget] Token acquired');

      // 4. Configurar sesión para ElevenLabs
      // IMPORTANTE: en el SDK @elevenlabs/client, `dynamicVariables` va en el NIVEL RAÍZ
      // del config, NO dentro de `overrides`. Si se anida en overrides, ElevenLabs las
      // ignora y Víctor no recibe {{user_name}} → vuelve a pedir los datos.
      const sessionConfig = {
        connectionType: 'webrtc',
        conversationToken: tokenData.client_secret,  // token WebRTC (era clientSecret, nombre incorrecto)
        // dynamicVariables al NIVEL RAÍZ (fix)
        dynamicVariables: {
          user_name: name.trim(),
          employee_number: employeeId.trim(),
          departamento: department.trim(),
          language: language,  // 'es' o 'en'
          session_token: tokenData.conversation_id,
          session_start: new Date().toISOString(),
          role: verifyData.role || 'Closer'
        }
      };

      console.log('[Victor Widget] Session config:', sessionConfig);

      // 5. Iniciar sesión con ElevenLabs ConvAI SDK (@elevenlabs/client → Conversation.startSession)
      const { Conversation } = await import('https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.14.0/+esm');
      await Conversation.startSession(sessionConfig);
      console.log('[Victor Widget] Session started successfully');

    } catch (error) {
      console.error('[Victor Widget] Error:', error);
      alert('Error al iniciar: ' + error.message);
    }
  }

  // Exportar función global
  window.startVictorChat = startVictorChat;

  console.log('[Victor Widget] Loaded. Use: window.startVictorChat(name, employeeId, department)');

})();