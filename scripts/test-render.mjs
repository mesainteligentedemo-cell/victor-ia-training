import { buildReportHtml, buildPdfReportHtml, getNextModule, deriveNeuro } from '../api/email-report.js';
import fs from 'fs';

const mockVtc = {
  user_name: 'Pablo Solar',
  empleado_id: '1234567',
  departamento: 'Dirección',
  duracion_minutos: '4:05',
  tipo_sesion: 'Roleplay Cierre',
  timestamp: '15 de julio de 2026',
  fecha_corta: '15 JUL 2026',
  fecha_iso: '2026-07-15',
  hora_inicio: '14:30:00',
  hora_cierre: '14:34:05',
  conversation_id: 'conv_test_123',
  intervenciones: 12,
  score_global: 8,
  comprension_general: 8,
  resumen: 'El asesor manejó bien la calificación y el cierre. Enfrentó tres objeciones de precio y las resolvió con anclaje de ROI.',
  titular: 'Sesión sólida con cierre efectivo.',
  escenario: 'Cierre de venta timeshare con objeción de precio',
  idioma: 'ES',
  sentimiento: 'Positivo',
  tono: 'consultivo',
  competencias: [
    { nombre: 'Rapport', score: 8, feedback: 'Buen tono' },
    { nombre: 'PNL', score: 8, feedback: 'Anclajes correctos' },
    { nombre: 'Postura', score: 7, feedback: 'Firme' },
    { nombre: 'Objeciones', score: 7, feedback: 'Resolvió' },
    { nombre: 'Cierre', score: 8, feedback: 'Cierre limpio' },
    { nombre: 'Leer la sala', score: 8, feedback: 'Atento' }
  ],
  principios_neuro: ['Reciprocidad', 'Escasez'],
  fortalezas: ['Excelente rapport inicial', 'Cierre con urgencia bien anclada'],
  mejoras: ['Escuchar más antes de responder', 'Reducir tecnicismos'],
  objeciones: [
    { objecion: 'Es muy caro', manejo: 'Comparó con ROI a 5 años' },
    { objecion: 'Necesito tiempo', manejo: 'Anclaje de urgencia' },
    { objecion: 'Prefiero esperar', manejo: 'Justificó plazo, parcial' }
  ],
  analisis_pnl: 'Uso de anclajes temporales y reciprocidad.',
  participacion: 'Participación activa y sostenida.',
  plan_gerente: ['Practicar manejo de objeción "esperar"', 'Reforzar escucha activa'],
  timeline: [
    { t: '0:45', texto: 'Calificación OK' },
    { t: '1:30', texto: 'Presentación producto' },
    { t: '2:15', texto: 'Objeción 1 precio' },
    { t: '3:00', texto: 'Cierre acuerdo' },
    { t: '4:00', texto: 'Cierre perfecto' }
  ],
  drill: { titulo: 'Repasar objeciones', descripcion: 'Practica objeción de espera.', url: 'https://tracker.victor-ia.xyz' },
  nota_deep_learning: 'El asesor mejora con anclajes concretos.',
  nota_bullets: ['Dar más ejemplos de ROI'],
  messages: [
    { role: 'user', message: 'Hola, buenos días, estoy listo para empezar la sesión de hoy.', time: 15 },
    { role: 'agent', message: 'Bienvenido, hoy vamos a practicar el cierre con objeciones de precio.', time: 30 },
    { role: 'user', message: 'Entiendo, cuéntame más sobre el escenario.', time: 45 },
    { role: 'agent', message: 'Perfecto, imagina que soy un cliente indeciso...', time: 60 },
    { role: 'user', message: 'Le explico el valor a largo plazo de la membresía.', time: 120 },
    { role: 'agent', message: 'Excelente, cierre perfecto, resolviste la objeción.', time: 245 }
  ],
  history: [
    { duration_min: 3.9, score: 7.3, pct: 73, sentiment: 'Neutral', date: '2026-07-10' },
    { duration_min: 3.5, score: 6.8, pct: 68, sentiment: 'Neutral', date: '2026-07-08' },
    { duration_min: 4.2, score: 7.0, pct: 70, sentiment: 'Positivo', date: '2026-07-05' }
  ]
};
mockVtc.next_module = getNextModule(mockVtc.escenario, mockVtc.competencias);

const emailHtml = buildReportHtml(mockVtc, { forPdf: false });
const pdfHtml = buildPdfReportHtml(mockVtc);
fs.writeFileSync('scripts/_out-email.html', emailHtml);
fs.writeFileSync('scripts/_out-pdf.html', pdfHtml);

// Test: primera sesión (sin histórico)
const firstVtc = { ...mockVtc, history: [], next_module: getNextModule(mockVtc.escenario, mockVtc.competencias) };
const firstHtml = buildReportHtml(firstVtc, {});
fs.writeFileSync('scripts/_out-email-first.html', firstHtml);

// Test: sin objeciones
const noObjVtc = { ...mockVtc, objeciones: [] };
buildReportHtml(noObjVtc, {});

const checks = {
  'Google Fonts link': emailHtml.includes('fonts.googleapis.com'),
  'Cormorant font': emailHtml.includes('Cormorant Garamond'),
  'IBM Plex Mono': emailHtml.includes('IBM Plex Mono'),
  'Inter font': emailHtml.includes('Inter'),
  'Crema bg #F5F5F0': emailHtml.includes('#F5F5F0'),
  'Oro #B89A6A': emailHtml.includes('#B89A6A'),
  'Tinta #070708': emailHtml.includes('#070708'),
  'Heatmap SVG': emailHtml.includes('Heatmap de competencias') && emailHtml.includes('<svg'),
  'Sparkline SVG': emailHtml.includes('Histórico de desempeño'),
  'Gauges SVG (Dopamina)': emailHtml.includes('Dopamina') && emailHtml.includes('Cortisol'),
  'Timeline SVG': emailHtml.includes('Línea de tiempo'),
  'Trend indicators': emailHtml.includes('Indicadores de tendencia'),
  'Tabla 1 Sesión': emailHtml.includes('Información de sesión') && emailHtml.includes('Departamento'),
  'Tabla 2 KPIs': emailHtml.includes('Métricas clave'),
  'Tabla 3 Competencias': emailHtml.includes('Trend'),
  'Tabla 4 Objeciones': emailHtml.includes('Objeciones enfrentadas'),
  'Tabla 5 Transcript': emailHtml.includes('Transcripción abreviada') && emailHtml.includes('Excerpt'),
  'CTA Ver Reporte': emailHtml.includes('Ver Reporte') && emailHtml.includes('/api/report'),
  'CTA Descargar PDF': emailHtml.includes('Descargar PDF'),
  'CTA Escuchar': emailHtml.includes('Escuchar Grabación') && emailHtml.includes('/api/audio'),
  'CTA Módulo Siguiente': emailHtml.includes('Módulo Siguiente'),
  'Hora Cierre': emailHtml.includes('14:34:05'),
  'Primera sesión label': firstHtml.includes('Primera sesión, sin histórico'),
  'PDF heatmap': pdfHtml.includes('Heatmap de competencias'),
  'PDF gauges': pdfHtml.includes('Dopamina'),
  'PDF sparkline': pdfHtml.includes('Histórico de desempeño'),
  'PDF timeline chart': pdfHtml.includes('Línea de tiempo')
};

let pass = 0, fail = 0;
for (const [k, v] of Object.entries(checks)) {
  console.log(`${v ? '✅' : '❌'} ${k}`);
  v ? pass++ : fail++;
}
console.log(`\n${pass}/${pass + fail} checks passed`);
console.log('next_module:', JSON.stringify(mockVtc.next_module));
console.log('neuro:', JSON.stringify(deriveNeuro(mockVtc)));
console.log('email size:', (emailHtml.length / 1024).toFixed(1), 'KB');
process.exit(fail ? 1 : 0);