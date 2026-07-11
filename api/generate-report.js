import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      user_name,
      empleado_id,
      user_email,
      duracion_minutos,
      estado_final,
      timestamp,
      transcript,
      conversation_id,
      disc_type
    } = req.body;

    if (!user_name || !empleado_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // 1. Guardar en Supabase DB
    const { error: dbError } = await supabase
      .from('training_sessions')
      .insert({
        employee_name: user_name,
        employee_id: empleado_id,
        conversation_id,
        duration_minutes: duracion_minutos,
        status: estado_final,
        timestamp,
        transcript,
        disc_type,
        email_sent: false
      });

    if (dbError) {
      console.error('Error guardando en DB:', dbError);
    }

    // 2. Generar HTML del email
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">📊 Reporte de Capacitación VTC</h2>

            <div style="margin: 20px 0; background: #f9f9f9; padding: 15px; border-left: 3px solid #d4af37; border-radius: 4px;">
              <p><strong>Empleado:</strong> ${user_name}</p>
              <p><strong>ID Empleado:</strong> ${empleado_id}</p>
              <p><strong>Duración:</strong> ${duracion_minutos} minutos</p>
              <p><strong>Estado:</strong> ${estado_final}</p>
              <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString('es-MX')}</p>
              <p><strong>Tipo DISC:</strong> ${disc_type || 'N/A'}</p>
            </div>

            <div style="margin: 20px 0; background: #f0f0f0; padding: 15px; border-left: 4px solid #d4af37; border-radius: 4px;">
              <h3 style="margin-top: 0;">Transcripción:</h3>
              <p style="white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${transcript || 'No hay transcripción disponible'}</p>
            </div>

            <div style="margin: 20px 0; background: #1a1a1a; color: #d4af37; padding: 15px; border-radius: 4px;">
              <h3 style="margin-top: 0;">📋 Plan de Acción</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Revisar la transcripción completa de la sesión</li>
                <li>Identificar áreas de mejora específicas</li>
                <li>Programar sesión de retroalimentación</li>
                <li>Establecer objetivos para la próxima evaluación</li>
              </ol>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Reporte generado por Victor IA Training System
            </p>
          </div>
        </body>
      </html>
    `;

    // 3. Enviar email con Resend
    const emailResponse = await resend.emails.send({
      from: 'info@victor-ia.com.mx',
      to: user_email || 'mesainteligentedemo@gmail.com',
      cc: ['chrisoria16@gmail.com', 'eldudemateos@gmail.com'],
      subject: `Reporte VTC - ${user_name}`,
      html: emailHtml
    });

    if (emailResponse.error) {
      console.error('Error enviando email:', emailResponse.error);
      return res.status(500).json({ error: 'Error enviando email' });
    }

    // 4. Actualizar estado en DB
    await supabase
      .from('training_sessions')
      .update({ email_sent: true })
      .eq('conversation_id', conversation_id);

    return res.status(200).json({
      success: true,
      message: 'Reporte guardado y email enviado',
      email_id: emailResponse.data?.id
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}