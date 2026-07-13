import fs from 'fs';
import https from 'https';

// Leer el V13 completo
const v13Content = fs.readFileSync('./VICTOR_SYSTEM_PROMPT_V13_CURRICULUM_COMPLETO.md', 'utf-8');

// Configuración de ElevenLabs
const AGENT_ID = 'agent_5701kr0h5gg6eetb69tv6c5hwfj1';
const API_KEY = 'sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67';

// Payload para PATCH
const payload = {
  system_prompt: v13Content,
  prompt_version: 'V13',
  curriculum_version: 'COMPLETO_2026-07-12'
};

console.log('🚀 PUSHING V13 A ELEVENLABS\n');
console.log(`Agent ID: ${AGENT_ID}`);
console.log(`Prompt size: ${v13Content.length} chars`);
console.log(`Payload size: ${JSON.stringify(payload).length} bytes\n`);

// PATCH request
const options = {
  hostname: 'api.elevenlabs.io',
  port: 443,
  path: `/v1/agents/${AGENT_ID}`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': API_KEY,
    'Content-Length': Buffer.byteLength(JSON.stringify(payload))
  }
};

console.log('⏳ Enviando request...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`);

    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ PUSH EXITOSO\n');
      console.log('V13 System Prompt actualizado en ElevenLabs');
      console.log(`Versión: V13 (Curriculum Completo 2026-07-12)`);
      console.log(`Módulos: F, 0, 1–12 (16 módulos totales)`);
      console.log(`Bloques: 72+ coordinados`);
      console.log(`Quizzes: 16 validaciones`);
      console.log('\n🎯 Agent está LISTO para entrenar');
    } else {
      console.log('❌ ERROR en el push\n');
      console.log('Response:', data);
      console.log('\nDebug info:');
      console.log('- Verificar API_KEY es correcta');
      console.log('- Verificar AGENT_ID es correcto');
      console.log('- Verificar conexión de internet');
    }

    process.exit(res.statusCode === 200 || res.statusCode === 204 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error('❌ ERROR EN CONEXIÓN:', e.message);
  process.exit(1);
});

// Enviar payload
req.write(JSON.stringify(payload));
req.end();