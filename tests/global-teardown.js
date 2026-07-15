/**
 * Global Teardown - Se ejecuta DESPUÉS de todos los tests
 *
 * - Genera resumen de resultados
 * - Documenta webhooks capturados
 * - Limpia recursos
 */

module.exports = async (config) => {
  console.log('\n========================================');
  console.log('🏁 GLOBAL TEARDOWN - Finalizando tests');
  console.log('========================================\n');

  try {
    const fs = require('fs');
    const path = require('path');

    // Leer archivo de resultados JSON si existe
    const resultsFile = path.join(process.cwd(), 'test-results.json');
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
      console.log(`📊 Total tests: ${results.stats?.expected || 0}`);
      console.log(`✓ Passed: ${results.stats?.passed || 0}`);
      console.log(`✗ Failed: ${results.stats?.failed || 0}`);
    }

    console.log('\n✓ Teardown completado\n');

  } catch (error) {
    console.error('⚠️  Error en teardown:', error.message);
  }
};