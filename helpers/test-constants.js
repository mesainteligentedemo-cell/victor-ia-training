/**
 * Test Constants - Datos de prueba y configuración
 *
 * NOTA: Para producción, reemplazar con valores reales
 * de las variables de entorno (.env)
 */

module.exports = {
  // URLs
  URLS: {
    TRACKER: 'https://tracker.victor-ia.xyz',
    TRACKER_API: 'https://tracker.victor-ia.xyz/api/v1',
    ELEVENLABS: 'https://app.elevenlabs.io',
    APP: process.env.APP_URL || 'http://localhost:3000',
    MAILHOG_UI: 'http://localhost:8025',
    MAILHOG_API: 'http://localhost:1025',
  },

  // Test User Data
  TEST_USER: {
    name: 'Pablo Solar',
    cedula: '1234567',
    email: 'mesainteligentedemo@gmail.com',
    phone: '+52 55 1234 5678',
  },

  // Module Info
  MODULE: {
    id: 'modulo_f',
    name: 'Fundamentos',
    code: 'F',
    videoUrl: 'https://example.com/video-fundamentos.mp4',
    duration: 45, // minutes
  },

  // Emails Expected
  EMAILS: {
    to: [
      'mesainteligentedemo@gmail.com',
      'chrisoria16@gmail.com',
      'eldudemateos@gmail.com',
    ],
    cc: [],
    from: 'noreply@victor-ia.com.mx',
    subject_contains: [
      'Sesión',
      'Pablo Solar',
      'completado',
    ],
  },

  // Expected Quiz Score
  QUIZ_SCORE: 100,

  // Neurociencia Fields
  NEUROCIENCIA: {
    oxitocina: 90,
    amigdala: 90,
    dopamina: 85,
    cortisol: 30,
    serotonina: 80,
  },

  // Tracker Fields (minimal expected)
  TRACKER_FIELDS: [
    'sessionId',
    'user',
    'module',
    'quizScore',
    'status',
    'createdAt',
  ],

  // Timeout values
  TIMEOUTS: {
    EMAIL_DELIVERY: 5000, // 5 seconds
    API_RESPONSE: 10000, // 10 seconds
    PAGE_LOAD: 30000, // 30 seconds
    VIDEO_PLAY: 5000, // 5 seconds
  },

  // Retry settings
  RETRIES: {
    EMAIL_FETCH: 3,
    API_VERIFY: 3,
  },

  // Supabase
  SUPABASE: {
    table: 'tracker_results',
    project: process.env.SUPABASE_PROJECT_ID || 'your-project-id',
    url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  },
};