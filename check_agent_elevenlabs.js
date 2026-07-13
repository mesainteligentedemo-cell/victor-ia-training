import https from 'https';

const AGENT_ID = 'agent_5701kr0h5gg6eetb69tv6c5hwfj1';
const API_KEY = 'sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67';

console.log('🔍 VERIFICANDO AGENTE EN ELEVENLABS\n');

const options = {
  hostname: 'api.elevenlabs.io',
  path: `/v1/agents/${AGENT_ID}`,
  method: 'GET',
  headers: {
    'xi-api-key': API_KEY,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}\n`);

    if (res.statusCode === 200) {
      try {
        const agent = JSON.parse(data);
        console.log('✅ AGENTE ENCONTRADO\n');
        console.log('Estructura actual:');
        console.log(JSON.stringify(agent, null, 2));
      } catch (e) {
        console.log('❌ No se pudo parsear respuesta');
        console.log(data);
      }
    } else {
      console.log('❌ AGENTE NO ENCONTRADO (404)');
      console.log('Response:', data);
      console.log('\nProbables causas:');
      console.log('1. Agent ID incorrecto');
      console.log('2. API Key expirada');
      console.log('3. Permiso insuficiente');
    }

    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});

req.end();