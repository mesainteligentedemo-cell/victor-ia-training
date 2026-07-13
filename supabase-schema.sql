-- ============================================================================
-- SUPABASE SCHEMA — Victor IA Training Platform
-- Crear estas tablas en tu proyecto Supabase (SQL Editor)
-- ============================================================================

-- Tabla 1: Registro de intentos de acceso/verificación de empleados
CREATE TABLE IF NOT EXISTS public.employee_access_log (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  CREATED_AT TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para búsqueda rápida
CREATE INDEX idx_employee_access_log_employee_id ON public.employee_access_log(employee_id);
CREATE INDEX idx_employee_access_log_timestamp ON public.employee_access_log(timestamp DESC);

-- Tabla 2: Tokens de conversación (signed URLs)
CREATE TABLE IF NOT EXISTS public.conversation_tokens (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  user_name TEXT,
  employee_id TEXT,
  signed_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_in_seconds INT,
  CONSTRAINT fk_employee_id FOREIGN KEY(employee_id)
    REFERENCES employee_access_log(employee_id)
    ON DELETE SET NULL
);

CREATE INDEX idx_conversation_tokens_conversation_id ON public.conversation_tokens(conversation_id);
CREATE INDEX idx_conversation_tokens_employee_id ON public.conversation_tokens(employee_id);
CREATE INDEX idx_conversation_tokens_expires_at ON public.conversation_tokens(expires_at);

-- Tabla 3: Historial de módulos por empleado (progreso del curso)
CREATE TABLE IF NOT EXISTS public.employee_module_progress (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  quiz_passed BOOLEAN DEFAULT FALSE,
  quiz_score INT,
  quiz_answers JSONB, -- { "q1": "option_a", "q2": "option_b", ... }
  time_spent_seconds INT DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(employee_id, module_id)
);

CREATE INDEX idx_employee_module_progress_employee_id ON public.employee_module_progress(employee_id);
CREATE INDEX idx_employee_module_progress_module_id ON public.employee_module_progress(module_id);
CREATE INDEX idx_employee_module_progress_completed ON public.employee_module_progress(completed);

-- Tabla 4: Sesiones activas del usuario
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  conversation_id TEXT UNIQUE,
  agent_id TEXT DEFAULT 'agent_9501k3vkt6svekjs6y0qe5xzcek1',
  current_module TEXT,
  current_block TEXT,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  metadata JSONB, -- { "department": "closer", "role": "Senior Closer", ... }
  CONSTRAINT fk_active_sessions_employee FOREIGN KEY(employee_id)
    REFERENCES employee_access_log(employee_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_active_sessions_employee_id ON public.active_sessions(employee_id);
CREATE INDEX idx_active_sessions_conversation_id ON public.active_sessions(conversation_id);
CREATE INDEX idx_active_sessions_last_activity ON public.active_sessions(last_activity DESC);

-- Tabla 5: Reportes de performance por empleado (KPIs)
CREATE TABLE IF NOT EXISTS public.employee_performance (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  total_sessions INT DEFAULT 0,
  total_time_minutes INT DEFAULT 0,
  modules_completed INT DEFAULT 0,
  quiz_average_score DECIMAL(5,2) DEFAULT 0,
  strongest_module TEXT,
  weakest_module TEXT,
  last_training TIMESTAMPTZ,
  CONSTRAINT fk_employee_performance FOREIGN KEY(employee_id)
    REFERENCES employee_access_log(employee_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_employee_performance_employee_id ON public.employee_performance(employee_id);

-- Tabla 6: Feedback de roleplay/pruebas
CREATE TABLE IF NOT EXISTS public.roleplay_feedback (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  roleplay_type TEXT, -- "familia_mx", "pareja_us", "objeciones_7", etc.
  difficulty TEXT, -- "tibio", "realista", "pesadilla"
  transcript JSONB, -- { "turns": [ { "speaker": "victor", "text": "..." }, ... ] }
  feedback_points JSONB, -- { "strengths": [...], "gaps": [...], "next_focus": "..." }
  score INT, -- 1-10
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_roleplay_feedback FOREIGN KEY(employee_id)
    REFERENCES employee_access_log(employee_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_roleplay_feedback_employee_id ON public.roleplay_feedback(employee_id);
CREATE INDEX idx_roleplay_feedback_recorded_at ON public.roleplay_feedback(recorded_at DESC);

-- ============================================================================
-- RLS (Row Level Security) — Proteger datos
-- ============================================================================

-- TODOS los datos son privados por defecto (RLS enabled)
ALTER TABLE public.employee_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roleplay_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Solo el service_role (backend) puede insertar
CREATE POLICY "Service role can insert employee_access_log"
  ON public.employee_access_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert conversation_tokens"
  ON public.conversation_tokens
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read all" ON public.employee_access_log
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read all" ON public.conversation_tokens
  FOR SELECT USING (auth.role() = 'service_role');

-- Policy: Los empleados solo ven su propio progreso (si autenticados)
CREATE POLICY "Users see own module progress"
  ON public.employee_module_progress
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    employee_id = auth.jwt() ->> 'employee_id'
  );

-- ============================================================================
-- VIEWS (vistas útiles para reportes)
-- ============================================================================

-- Vista: Dashboard de actividad del piso (últimas 24 horas)
CREATE OR REPLACE VIEW public.vw_activity_last_24h AS
SELECT
  DATE(e.timestamp) AS fecha,
  COUNT(DISTINCT e.employee_id) AS unique_employees,
  COUNT(*) FILTER (WHERE e.verified = true) AS verified_accesses,
  COUNT(*) FILTER (WHERE e.verified = false) AS failed_accesses
FROM public.employee_access_log e
WHERE e.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE(e.timestamp);

-- Vista: Progreso promedio de módulos
CREATE OR REPLACE VIEW public.vw_module_completion_stats AS
SELECT
  module_name,
  COUNT(*) AS total_started,
  COUNT(*) FILTER (WHERE completed = true) AS total_completed,
  ROUND(
    COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*) * 100, 2
  ) AS completion_percentage,
  ROUND(AVG(quiz_score)::NUMERIC, 2) AS avg_quiz_score
FROM public.employee_module_progress
GROUP BY module_name
ORDER BY completion_percentage DESC;

-- Vista: Mejores y peores desempeños
CREATE OR REPLACE VIEW public.vw_top_performers AS
SELECT
  e.id,
  e.employee_id,
  e.name,
  p.total_sessions,
  p.modules_completed,
  ROUND(p.quiz_average_score::NUMERIC, 2) AS quiz_avg,
  p.last_training,
  ROW_NUMBER() OVER (ORDER BY p.modules_completed DESC, p.quiz_average_score DESC) AS rank
FROM public.employee_performance p
JOIN public.employee_access_log e ON p.employee_id = e.employee_id
WHERE p.total_sessions > 0;

-- ============================================================================
-- FUNCIONES ÚTILES (triggers/automaciones)
-- ============================================================================

-- Función: Actualizar último acceso en active_sessions
CREATE OR REPLACE FUNCTION public.fn_update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.active_sessions
  SET last_activity = NOW()
  WHERE conversation_id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Cuando se inserta token, actualizar active_sessions
CREATE TRIGGER trg_update_session_on_token
AFTER INSERT ON public.conversation_tokens
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_session_activity();

-- Función: Calcular tiempo total de entrenamiento por empleado
CREATE OR REPLACE FUNCTION public.fn_calculate_employee_stats(p_employee_id TEXT)
RETURNS TABLE(
  total_modules_completed INT,
  total_time_minutes INT,
  avg_quiz_score DECIMAL,
  strongest_module TEXT,
  weakest_module TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT FILTER (WHERE completed = true),
    ROUND(SUM(time_spent_seconds) / 60)::INT,
    ROUND(AVG(quiz_score)::NUMERIC, 2),
    (SELECT module_name FROM public.employee_module_progress WHERE employee_id = p_employee_id ORDER BY quiz_score DESC LIMIT 1),
    (SELECT module_name FROM public.employee_module_progress WHERE employee_id = p_employee_id ORDER BY quiz_score ASC LIMIT 1)
  FROM public.employee_module_progress
  WHERE employee_id = p_employee_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS (documentación de esquema)
-- ============================================================================

COMMENT ON TABLE public.employee_access_log IS 'Registro de intentos de acceso (auditoría de verificación)';
COMMENT ON TABLE public.conversation_tokens IS 'Tokens firmados para conectar a ElevenLabs (signed URLs)';
COMMENT ON TABLE public.employee_module_progress IS 'Progreso por módulo: qué completó, quiz score, tiempo';
COMMENT ON TABLE public.active_sessions IS 'Sesiones activas actualmente en el agente';
COMMENT ON TABLE public.employee_performance IS 'KPIs agregados por empleado';
COMMENT ON TABLE public.roleplay_feedback IS 'Feedback de simulaciones/roleplay y pruebas';

-- ============================================================================
-- SEED DATA (empleados autorizados — opcional, verificar contra BE)
-- ============================================================================

-- INSERT INTO public.employee_access_log (name, employee_id, verified)
-- VALUES
--   ('Pablo Solar', 'VTC-CL-001', true),
--   ('Andrés Mateos', 'VTC-CL-014', true),
--   ('Christian Soria', 'VTC-CL-023', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRACKING DE INTERACCIONES (agregado 2026-07-12)
-- Tablas requeridas por: api/email-report.js, api/track-interaction.js,
-- api/report.js, api/audio.js
-- ============================================================================

-- Tabla 7: Sesiones de entrenamiento (una fila por sesión completada)
-- Columnas alineadas con el INSERT de api/email-report.js.
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id BIGSERIAL PRIMARY KEY,
  employee_name TEXT,
  employee_id TEXT,
  conversation_id TEXT UNIQUE,
  duration_minutes NUMERIC,
  status TEXT DEFAULT 'completado',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transcript TEXT,
  score_global NUMERIC,
  email_sent BOOLEAN DEFAULT FALSE,
  empleado_validado BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,        -- URL del reporte PDF (Supabase Storage / externo)
  audio_url TEXT,      -- URL del MP3 de la sesión
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_employee_id ON public.training_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_conversation_id ON public.training_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_timestamp ON public.training_sessions(timestamp DESC);

-- Tabla 8: Interacciones granulares (block_viewed, quiz_answered, module_completed, ...)
CREATE TABLE IF NOT EXISTS public.training_interactions (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  conversation_id TEXT,
  type TEXT NOT NULL,          -- block_viewed | quiz_answered | module_completed | session_completed | heartbeat
  module_id TEXT,
  block_id TEXT,
  score INT,
  data JSONB,                  -- payload libre de la interacción
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_interactions_employee_id ON public.training_interactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_interactions_conversation_id ON public.training_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_training_interactions_type ON public.training_interactions(type);
CREATE INDEX IF NOT EXISTS idx_training_interactions_created_at ON public.training_interactions(created_at DESC);

-- Tabla 9: Errores reportados desde el frontend / runtime
CREATE TABLE IF NOT EXISTS public.training_errors (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT,
  conversation_id TEXT,
  message TEXT,
  context JSONB,               -- { source, line, stack, module_id, user_agent, ... }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_errors_employee_id ON public.training_errors(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_errors_created_at ON public.training_errors(created_at DESC);

-- RLS para las nuevas tablas (solo service_role escribe/lee vía backend)
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_errors ENABLE ROW LEVEL SECURITY;

-- Nota: el backend usa SUPABASE_SERVICE_ROLE_KEY, que bypassa RLS.
-- Estas policies permiten lectura al service_role de forma explícita.
DO $$ BEGIN
  CREATE POLICY "svc training_sessions" ON public.training_sessions
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "svc training_interactions" ON public.training_interactions
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "svc training_errors" ON public.training_errors
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
