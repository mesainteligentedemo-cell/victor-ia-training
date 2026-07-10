#!/usr/bin/env python3
"""
GENERADOR DE REPORTES DIARIOS — VÍCTOR IA TRAINING
Ejecutar diariamente a las 23:59 PM
Envía reportes por email a vendedores y gerentes
"""

import os
import json
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Template
import statistics
from collections import defaultdict

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-api-key")

# Email
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "re_XXXXX")
EMAIL_FROM = "reportes@victor-ia.com"
GERENTES_EMAIL = os.getenv("GERENTES_EMAIL", "gerentes@vtc.com").split(",")

# Paths
TEMPLATE_PATH = "/app/REPORTE-DIARIO-TEMPLATE.html"
OUTPUT_DIR = "/app/reportes"
LOG_FILE = "/app/logs/reporte-generador.log"

# ============================================================================
# CONEXIÓN SUPABASE
# ============================================================================

try:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except ImportError:
    print("ERROR: Instalar supabase-py: pip install supabase")
    exit(1)

# ============================================================================
# FUNCIONES HELPER
# ============================================================================

def log(message):
    """Log a mensaje con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")

def obtener_sesiones_24h():
    """Traer todas las sesiones de las últimas 24 horas"""
    log("Obteniendo sesiones de últimas 24h...")

    hace_24h = (datetime.now() - timedelta(hours=24)).isoformat()
    hoy = datetime.now().isoformat()

    try:
        response = supabase.table("sessions")\
            .select("*")\
            .gte("created_at", hace_24h)\
            .lte("created_at", hoy)\
            .execute()

        sesiones = response.data if response.data else []
        log(f"✓ {len(sesiones)} sesiones encontradas")
        return sesiones

    except Exception as e:
        log(f"ERROR obteniendo sesiones: {e}")
        return []

def agrupar_por_usuario(sesiones):
    """Agrupar sesiones por usuario_id"""
    usuarios = defaultdict(list)

    for sesion in sesiones:
        user_id = sesion.get("user_id")
        if user_id:
            usuarios[user_id].append(sesion)

    log(f"✓ Agrupadas en {len(usuarios)} usuarios")
    return usuarios

def calcular_metricas(sesiones):
    """Calcular métricas KPI para un usuario"""
    if not sesiones:
        return {}

    total = len(sesiones)
    cerrados = len([s for s in sesiones if s.get("estado_final") == "cerrado"])

    # Duraciones
    duraciones = [s.get("duracion_minutos", 0) for s in sesiones if s.get("duracion_minutos")]
    duracion_total = sum(duraciones)
    duracion_promedio = statistics.mean(duraciones) if duraciones else 0

    # Calidad
    calidades = [s.get("calidad_score", 0) for s in sesiones if s.get("calidad_score")]
    calidad_promedio = statistics.mean(calidades) if calidades else 0

    # Montos
    montos = [s.get("monto_cierre", 0) for s in sesiones if s.get("monto_cierre")]
    monto_total = sum(montos)

    # DISC Distribution
    discs = defaultdict(int)
    for s in sesiones:
        disc = s.get("disc_profile", "Unknown")
        discs[disc] += 1

    # Objeciones
    obj_presentadas = sum([s.get("objeciones_presentadas", 0) for s in sesiones])
    obj_resueltas = sum([s.get("objeciones_resueltas", 0) for s in sesiones])

    # Técnicas
    tecnicas_count = defaultdict(int)
    for s in sesiones:
        tecnicas = s.get("tecnicas_usadas", [])
        if isinstance(tecnicas, list):
            for t in tecnicas:
                tecnicas_count[t] += 1

    return {
        "total_sesiones": total,
        "sesiones_cerradas": cerrados,
        "cierre_rate": round((cerrados / total * 100), 1) if total > 0 else 0,
        "duracion_total_minutos": duracion_total,
        "duracion_total_horas": round(duracion_total / 60, 1),
        "duracion_promedio": round(duracion_promedio, 1),
        "calidad_promedio": round(calidad_promedio, 1),
        "monto_total": monto_total,
        "monto_total_k": round(monto_total / 1000, 1),
        "objeciones_presentadas": obj_presentadas,
        "objeciones_resueltas": obj_resueltas,
        "objecion_resolve_rate": round((obj_resueltas / obj_presentadas * 100), 1) if obj_presentadas > 0 else 0,
        "disc_distribution": dict(discs),
        "tecnicas": dict(tecnicas_count),
        "sesiones": sesiones
    }

def calcular_ranking(usuarios_metricas):
    """Calcular ranking por tasa de cierre"""
    ranking = sorted(
        usuarios_metricas.items(),
        key=lambda x: x[1].get("cierre_rate", 0),
        reverse=True
    )

    return ranking

def obtener_tendencia_7dias(user_id):
    """Obtener datos de tendencia de los últimos 7 días"""
    log(f"Obteniendo tendencia 7 días para usuario {user_id}...")

    tendencias = []

    for i in range(7, 0, -1):
        fecha = (datetime.now() - timedelta(days=i)).date()

        try:
            response = supabase.table("sessions")\
                .select("*")\
                .eq("user_id", user_id)\
                .gte("created_at", f"{fecha}T00:00:00")\
                .lte("created_at", f"{fecha}T23:59:59")\
                .execute()

            sesiones = response.data if response.data else []

            if sesiones:
                total = len(sesiones)
                cerrados = len([s for s in sesiones if s.get("estado_final") == "cerrado"])
                tasa = round((cerrados / total * 100), 1) if total > 0 else 0
            else:
                tasa = 0

            tendencias.append({
                "fecha": fecha.strftime("%d/%m"),
                "tasa": tasa
            })

        except Exception as e:
            log(f"ERROR obteniendo tendencia: {e}")
            tendencias.append({"fecha": fecha.strftime("%d/%m"), "tasa": 0})

    return tendencias

def generar_html_reporte(user_id, user_name, user_email, user_role, metricas, ranking):
    """Generar HTML del reporte a partir del template"""

    log(f"Generando HTML para {user_name}...")

    # Leer template
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_str = f.read()

    template = Template(template_str)

    # Obtener tendencia 7 días
    tendencia = obtener_tendencia_7dias(user_id)

    # Calcular posición en ranking
    ranking_posicion = 1
    for i, (uid, _) in enumerate(ranking, 1):
        if uid == user_id:
            ranking_posicion = i
            break

    # Datos DISC para gráfico
    disc_dist = metricas.get("disc_distribution", {})
    disc_labels = list(disc_dist.keys())
    disc_data = list(disc_dist.values())

    # Datos de tendencia
    trend_labels = [t["fecha"] for t in tendencia]
    trend_data = [t["tasa"] for t in tendencia]

    # Datos de duración por sesión
    sesiones = metricas.get("sesiones", [])
    duration_labels = [f"Sesión {i+1}" for i in range(len(sesiones))]
    duration_data = [s.get("duracion_minutos", 0) for s in sesiones]

    # Datos de técnicas (top 5)
    tecnicas = metricas.get("tecnicas", {})
    tecnicas_sorted = sorted(tecnicas.items(), key=lambda x: x[1], reverse=True)[:5]
    techniques_labels = [t[0] for t in tecnicas_sorted]
    techniques_data = [t[1] for t in tecnicas_sorted]

    # Filas de ranking
    ranking_rows_html = ""
    for i, (uid, met) in enumerate(ranking[:10], 1):
        usuario = met.get("user_name", "Desconocido")
        tasa = met.get("cierre_rate", 0)
        monto = met.get("monto_total", 0)
        calidad = met.get("calidad_promedio", 0)

        # Badge
        if i == 1:
            badge = '<span class="ranking-badge badge-top">🏆 TOP</span>'
        elif tasa > 30:
            badge = '<span class="ranking-badge badge-good">✓ BUENO</span>'
        else:
            badge = '<span class="ranking-badge badge-warning">⚠️ MEJORAR</span>'

        # Highlight fila actual
        highlight = "background: #f0f4ff;" if uid == user_id else ""

        ranking_rows_html += f"""
        <tr style="{highlight}">
            <td><strong>#{i}</strong></td>
            <td>{usuario}</td>
            <td>{tasa}%</td>
            <td>${monto:,}</td>
            <td>{calidad}/10</td>
            <td>{badge}</td>
        </tr>
        """

    # Fortalezas
    fortalezas_html = ""
    obj_rate = metricas.get("objecion_resolve_rate", 0)

    if metricas.get("cierre_rate", 0) > 30:
        fortalezas_html += "<li>Excelente tasa de cierre (superior al promedio del piso)</li>"

    if obj_rate > 80:
        fortalezas_html += "<li>Excelente resolución de objeciones</li>"

    if metricas.get("calidad_promedio", 0) > 8:
        fortalezas_html += "<li>Sesiones de muy buena calidad</li>"

    # Mejoras
    mejoras_html = ""
    if metricas.get("calidad_promedio", 0) < 7:
        mejoras_html += "<li>Aumentar calidad general de las sesiones</li>"

    if "AMIABLE" not in [d.upper() for d in metricas.get("disc_distribution", {}).keys()]:
        mejoras_html += "<li>Practicar más con clientes de perfil Amiable</li>"

    if obj_rate < 70:
        mejoras_html += "<li>Mejorar técnicas de resolución de objeciones</li>"

    # Recomendaciones
    recomendaciones_html = f"""
    <div class="recommendation-item">
        <div class="recommendation-title">✅ Para el Gerente</div>
        <div class="recommendation-text">
            {user_name} mostró un desempeño de <strong>{metricas.get('cierre_rate', 0)}%</strong> en cierre rate hoy.
            Posición en piso: <strong>#{ranking_posicion}</strong>.
            Recomendación: {"Reconocer y mantener momentum" if metricas.get('cierre_rate', 0) > 30 else "Ofrecer coaching personalizado esta semana"}.
        </div>
    </div>

    <div class="recommendation-item">
        <div class="recommendation-title">🎯 Para {user_name}</div>
        <div class="recommendation-text">
            Completaste <strong>{metricas.get('total_sesiones')}</strong> sesiones hoy con una calidad promedio de <strong>{metricas.get('calidad_promedio', 0)}/10</strong>.
            Tu tendencia es {"📈 positiva" if trend_data[-1] > trend_data[0] else "📉 negativa" if trend_data[-1] < trend_data[0] else "→ estable"}.
            {"¡Sigue adelante!" if trend_data[-1] > trend_data[0] else "Necesitas un boost esta semana."}
        </div>
    </div>
    """

    # Sesiones HTML
    sesiones_html = ""
    for i, sesion in enumerate(sesiones, 1):
        cliente = sesion.get("cliente_nombre", "Anónimo")
        estado = sesion.get("estado_final", "pendiente")
        estado_badge = {
            "cerrado": "status-closed",
            "be-back": "status-callback",
            "pendiente": "status-pending"
        }.get(estado, "status-pending")

        tiempo_inicio = sesion.get("timestamp_inicio", "")[:16]
        tiempo_fin = sesion.get("timestamp_fin", "")[:16]

        transcripcion_preview = sesion.get("transcripcion", "")[:200]

        sesiones_html += f"""
        <div class="session-card">
            <div class="session-header">
                <span class="session-title">SESIÓN {i} — {cliente}</span>
                <span class="session-time">{tiempo_inicio} - {tiempo_fin}</span>
                <span class="session-status {estado_badge}">
                    {'✅ CERRADO' if estado == 'cerrado' else '⏳ PENDIENTE' if estado == 'pendiente' else '📞 BE-BACK'}
                </span>
            </div>

            <div class="session-grid">
                <div class="session-metric">
                    <div class="metric-label">Duración</div>
                    <div class="metric-value">{sesion.get('duracion_minutos', 0)} min</div>
                </div>
                <div class="session-metric">
                    <div class="metric-label">DISC</div>
                    <div class="metric-value">{sesion.get('disc_profile', 'N/A')}</div>
                </div>
                <div class="session-metric">
                    <div class="metric-label">Pasos Pitch</div>
                    <div class="metric-value">{sesion.get('pasos_pitch_alcanzados', 0)}/19</div>
                </div>
                <div class="session-metric">
                    <div class="metric-label">Calidad</div>
                    <div class="metric-value">{sesion.get('calidad_score', 0)}/10</div>
                </div>
            </div>

            <div class="transcript-section">
                <strong>Transcripción (preview):</strong><br>
                {transcripcion_preview}...
                <br><br>
                <small><a href="#">Ver transcripción completa →</a></small>
            </div>
        </div>
        """

    # Renderizar template
    html = template.render(
        usuario_nombre=user_name,
        usuario_email=user_email,
        usuario_rol=user_role,
        usuario_experiencia="3 años",  # TODO: traer de DB
        fecha=datetime.now().strftime("%d de %B de %Y"),
        fecha_hora_generacion=datetime.now().strftime("%d/%m/%Y · %H:%M:%S"),

        # KPIs
        total_sesiones=metricas.get("total_sesiones", 0),
        trend_sesiones="+1" if metricas.get("total_sesiones", 0) > 7 else "-1",
        trend_sesiones_class="trend-up" if metricas.get("total_sesiones", 0) > 7 else "trend-down",

        duracion_total_horas=metricas.get("duracion_total_horas", 0),
        duracion_promedio_min=metricas.get("duracion_promedio", 0),

        cierre_rate=metricas.get("cierre_rate", 0),
        trend_cierre=f"📈 +{round(metricas.get('cierre_rate', 0) - 20, 1)}%" if metricas.get("cierre_rate", 0) > 20 else "📉",
        trend_cierre_class="trend-up" if metricas.get("cierre_rate", 0) > 20 else "trend-down",

        monto_total_k=metricas.get("monto_total_k", 0),
        trend_monto="📈 +15%" if metricas.get("monto_total", 0) > 50000 else "→ Estable",
        trend_monto_class="trend-up" if metricas.get("monto_total", 0) > 50000 else "trend-down",

        calidad_promedio=metricas.get("calidad_promedio", 0),
        calidad_categoria="Excelente" if metricas.get("calidad_promedio", 0) > 8 else "Bueno" if metricas.get("calidad_promedio", 0) > 7 else "Regular",

        ranking_posicion=ranking_posicion,
        ranking_total=len(ranking),

        # Gráficos
        disc_data=json.dumps(disc_data),
        trend_labels=json.dumps(trend_labels),
        trend_data=json.dumps(trend_data),
        duration_labels=json.dumps(duration_labels),
        duration_data=json.dumps(duration_data),
        techniques_labels=json.dumps(techniques_labels),
        techniques_data=json.dumps(techniques_data),

        # Tablas
        ranking_rows=ranking_rows_html,

        # Sesiones
        sesiones_html=sesiones_html,

        # Análisis
        fortalezas_list=fortalezas_html,
        mejoras_list=mejoras_html,

        # Recomendaciones
        recomendaciones_html=recomendaciones_html
    )

    return html

def enviar_email(to, cc, subject, html, user_name):
    """Enviar email vía Resend API"""
    log(f"Enviando email a {to}...")

    try:
        import requests

        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "from": EMAIL_FROM,
                "to": to,
                "cc": cc,
                "subject": subject,
                "html": html,
                "reply_to": "soporte@victor-ia.com"
            }
        )

        if response.status_code == 200:
            log(f"✓ Email enviado a {to}")
            return True
        else:
            log(f"ERROR enviando email a {to}: {response.text}")
            return False

    except Exception as e:
        log(f"ERROR en envío de email: {e}")
        return False

def generar_reportes_diarios():
    """MAIN: Generar y enviar todos los reportes"""

    log("=" * 80)
    log("INICIANDO GENERACIÓN DE REPORTES DIARIOS")
    log("=" * 80)

    # 1. Traer sesiones
    sesiones = obtener_sesiones_24h()

    if not sesiones:
        log("⚠️ No hay sesiones en las últimas 24h")
        return

    # 2. Agrupar por usuario
    usuarios = agrupar_por_usuario(sesiones)

    # 3. Calcular métricas para cada usuario
    log("Calculando métricas...")
    usuarios_metricas = {}

    for user_id, sesiones_user in usuarios.items():
        metricas = calcular_metricas(sesiones_user)
        # Agregar info del usuario
        if sesiones_user:
            metricas["user_id"] = user_id
            metricas["user_name"] = sesiones_user[0].get("user_name", "Desconocido")
            metricas["user_email"] = sesiones_user[0].get("user_email", "")
            metricas["user_role"] = sesiones_user[0].get("user_role", "Vendedor")

        usuarios_metricas[user_id] = metricas

    # 4. Calcular ranking
    ranking = calcular_ranking(usuarios_metricas)

    # 5. Generar y enviar reportes
    log(f"Generando {len(usuarios_metricas)} reportes...")

    reportes_exitosos = 0
    reportes_fallidos = 0

    for user_id, metricas in usuarios_metricas.items():
        try:
            # Generar HTML
            html = generar_html_reporte(
                user_id,
                metricas.get("user_name"),
                metricas.get("user_email"),
                metricas.get("user_role"),
                metricas,
                ranking
            )

            # Guardar HTML localmente
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            fecha_str = datetime.now().strftime("%Y%m%d")
            output_file = os.path.join(OUTPUT_DIR, f"reporte_{user_id}_{fecha_str}.html")

            with open(output_file, "w", encoding="utf-8") as f:
                f.write(html)

            log(f"✓ HTML guardado: {output_file}")

            # Enviar email
            subject = f"Reporte Diario — {metricas.get('user_name')} — {datetime.now().strftime('%d/%m/%Y')}"
            cc_emails = GERENTES_EMAIL

            if enviar_email(
                metricas.get("user_email"),
                cc_emails,
                subject,
                html,
                metricas.get("user_name")
            ):
                reportes_exitosos += 1
            else:
                reportes_fallidos += 1

        except Exception as e:
            log(f"ERROR procesando usuario {user_id}: {e}")
            reportes_fallidos += 1

    # 6. Resumen
    log("=" * 80)
    log(f"RESUMEN:")
    log(f"  Usuarios procesados: {len(usuarios_metricas)}")
    log(f"  Reportes exitosos: {reportes_exitosos}")
    log(f"  Reportes fallidos: {reportes_fallidos}")
    log("=" * 80)

# ============================================================================
# EJECUCIÓN
# ============================================================================

if __name__ == "__main__":
    generar_reportes_diarios()