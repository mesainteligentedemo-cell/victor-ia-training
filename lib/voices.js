// lib/voices.js
// Roster de voces ElevenLabs para el roleplay de VTC Training.
// Fuente única de verdad — usado por api/voices.js y espejado (hardcoded, porque
// el frontend estático no puede importar módulos server-side) en
// frontend/public/index.html como VOICE_PROFILES.
//
// IMPORTANTE — limitación real de ElevenLabs Conversational AI:
// Una llamada usa UNA sola voz TTS durante toda la conversación. Estos IDs
// NO cambian la voz en vivo a mitad de llamada. Para lograr voces distintas
// por personaje en tiempo real se necesita "Agent Transfer" configurado en el
// dashboard de ElevenLabs (un sub-agente por voz), lo cual es una tarea de
// configuración manual fuera del alcance de este código. Mientras tanto, el
// agente actúa los distintos personajes vocalmente (tono/energía) con su
// única voz, y estos IDs se envían como `dynamicVariables` puramente
// informativos (para que el agente sepa qué nombre usar por personaje/idioma).

export const VOICE_PROFILES = {
  victor:   { id: 'gbTn1bmCvNgk0QEAVyfM', name: 'Víctor',          languages: ['ES', 'EN'] },
  carlos:   { id: 'JgmJ33RuT4tPQOENamHR', name: 'Carlos',           languages: ['ES'] },
  sandra:   { id: 'hrlCBOGwBPZYViXHeZjS', name: 'Sandra',           languages: ['ES'] },
  carlitos: { id: 'htFfPSZGJwjBv1CL0aMD', name: 'Carlitos (20)',    languages: ['ES'] },
  sandrita: { id: '13VFWfJ7e20fmvmaqXWl', name: 'Sandrita (18)',    languages: ['ES'] },
  burt:     { id: '4YYIPFl9wE5c4L2eu2Gb', name: 'Burt',             languages: ['EN'] },
  hope:     { id: 'uYXf8XasLslADfZ2MB4u', name: 'Hope',             languages: ['EN'] },
};

/**
 * Sugiere una asignación de voces para un roleplay dado el idioma y si
 * participan "hijos" en la escena. Puramente informativo (ver limitación
 * arriba) — no cambia la voz real de la llamada en vivo.
 */
export function assignVoices({ language = 'ES', withKids = false } = {}) {
  const lang = String(language || 'ES').toUpperCase();
  const isEN = lang === 'EN';
  return {
    victor: VOICE_PROFILES.victor,
    cliente1: isEN ? VOICE_PROFILES.burt : VOICE_PROFILES.carlos,
    cliente2: isEN ? VOICE_PROFILES.hope : VOICE_PROFILES.sandra,
    hijos: withKids
      ? (isEN ? null /* sin voces EN de hijos en el roster actual */ : [VOICE_PROFILES.carlitos, VOICE_PROFILES.sandrita])
      : null,
  };
}