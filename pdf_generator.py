import base64
from playwright.sync_api import sync_playwright
from datetime import datetime
import random

def generate_pdf_report(data):
    """
    Genera un PDF EXACTO al reporte VTC de referencia usando Playwright.
    Retorna bytes base64 listo para adjuntar en email.
    """

    transcript = data.get('transcript', '')
    competencias = data.get('competencias', [])
    fortalezas = data.get('fortalezas', [])
    mejoras = data.get('mejoras', [])
    objeciones = data.get('objeciones', [])
    plan = data.get('plan_gerente', [])
    nota = data.get('nota_deep_learning', '')
    score = data.get('score_global', 0)

    # Generar filas de competencias
    comp_rows = "\n".join([f"""
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px;">{c.get('nombre', 'N/A')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; text-align: right;">
                <span style="color: #d4af37; font-weight: bold;">{c.get('score', 0)}/10</span>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 10px; text-align: right;">
                <span style="color: #d4af37;">{'█' * c.get('score', 0)}{'░' * (10-c.get('score', 0))}</span>
            </td>
        </tr>
    """ for c in competencias])

    # Generar timeline
    timeline_rows = "\n".join([f"""
        <tr>
            <td style="padding: 8px 12px; font-size: 10px; color: #d4af37; font-weight: bold; width: 60px;">{item.get('t', '00:00')}</td>
            <td style="padding: 8px 12px; font-size: 11px; border-left: 2px solid #d4af37; color: #333;">{item.get('texto', '')}</td>
        </tr>
    """ for item in data.get('timeline', [])])

    # Generar fortalezas
    fortalezas_html = "\n".join([f"<li style='margin-bottom: 8px;'>{f}</li>" for f in fortalezas])

    # Generar mejoras
    mejoras_html = "\n".join([f"<li style='margin-bottom: 8px;'>{m}</li>" for m in mejoras])

    # Generar objeciones
    objeciones_html = "\n".join([f"""
        <div style="margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-left: 3px solid #d4af37; border-radius: 4px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 11px;">{obj.get('objecion', '')}</p>
            <p style="margin: 0; font-size: 10px; color: #555;">{obj.get('manejo', '')}</p>
        </div>
    """ for obj in objeciones])

    # Generar plan de acción
    plan_html = "\n".join([f"<li style='margin-bottom: 8px;'>{p}</li>" for i, p in enumerate(plan, 1)])

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: Arial, Helvetica, sans-serif;
            color: #333;
            background: #f5f5f5;
            line-height: 1.4;
        }}
        .page {{
            background: white;
            padding: 30px;
            max-width: 900px;
            margin: 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #d4af37;
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid #d4af37;
            margin: -30px -30px 20px -30px;
        }}
        .header h1 {{ font-size: 24px; margin-bottom: 8px; letter-spacing: 2px; }}
        .header p {{ font-size: 10px; color: #999; letter-spacing: 1px; }}
        .session-info {{
            text-align: center;
            margin: 15px 0;
        }}
        .session-info h2 {{
            font-size: 14px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }}
        .badge {{
            display: inline-block;
            border: 1px solid #d4af37;
            padding: 6px 14px;
            font-size: 9px;
            font-weight: bold;
            color: #1a1a1a;
            background: #f5f5f5;
            border-radius: 16px;
            margin: 8px 0;
            letter-spacing: 1px;
        }}
        .section-title {{
            font-size: 11px;
            font-weight: bold;
            color: #1a1a1a;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 6px;
            margin-top: 20px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .perf-box {{
            background: #1a1a1a;
            color: #d4af37;
            text-align: center;
            padding: 24px;
            border-radius: 6px;
            margin: 15px 0;
        }}
        .score-big {{
            font-size: 48px;
            font-weight: bold;
            line-height: 1;
        }}
        .score-label {{
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }}
        td {{ padding: 8px 12px; font-size: 10px; }}
        .text-body {{
            font-size: 11px;
            line-height: 1.5;
            color: #444;
            margin: 10px 0;
            text-align: justify;
        }}
        ul {{ margin-left: 20px; }}
        li {{ margin-bottom: 6px; font-size: 11px; }}
        .green-box {{
            background: #e8f5e9;
            border-left: 4px solid #2e7d32;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
        }}
        .yellow-box {{
            background: #fdf6e3;
            border-left: 4px solid #b8860b;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
        }}
        .footer {{
            background: #1a1a1a;
            color: #d4af37;
            text-align: center;
            padding: 16px;
            font-size: 10px;
            margin: 20px -30px -30px -30px;
            border-top: 1px solid #333;
        }}
        .drill-button {{
            background: #d4af37;
            color: #1a1a1a;
            padding: 10px 20px;
            border-radius: 4px;
            display: inline-block;
            font-weight: bold;
            font-size: 11px;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="page">
        <!-- HEADER -->
        <div class="header">
            <h1>VICTORIOUS TRAVELERS CLUB</h1>
            <p>{datetime.now().strftime('%d %B %Y').upper()}</p>
            <p style="margin-top: 8px; font-size: 13px;">Reporte de entrenamiento</p>
        </div>

        <!-- SESIÓN INFO -->
        <div class="session-info">
            <h2>Sesión de {data.get('user_name', 'Empleado')} con Víctor · Coaching · {data.get('duracion_minutos', '0:00')} min</h2>
            <div class="badge">EMPLEADO N° {data.get('empleado_id', '000')} — GERENCIA O DIRECCION — DIRECTOR</div>
        </div>

        <!-- DESEMPEÑO GLOBAL -->
        <div class="perf-box">
            <div class="score-label">Desempeño Global</div>
            <div class="score-big">{score}<span style="font-size: 20px;">/10</span></div>
        </div>

        <!-- RESUMEN -->
        <div class="section-title">Resumen de la llamada</div>
        <div class="text-body">{data.get('resumen', '')}</div>

        <!-- MAPA DE COMPETENCIAS -->
        <div class="section-title">Mapa de competencias</div>
        <table>
            {comp_rows}
        </table>

        <!-- LÍNEA DE CONVERSACIÓN -->
        <div class="section-title">Línea de la conversación</div>
        <table>
            {timeline_rows}
        </table>

        <!-- LO QUE HICISTE BIEN -->
        {f'''<div class="green-box">
            <strong style="color: #2e7d32;">✓ LO QUE HICISTE BIEN</strong>
            <ul>{fortalezas_html}</ul>
        </div>''' if fortalezas else ''}

        <!-- A MEJORAR -->
        {f'''<div class="yellow-box">
            <strong style="color: #b8860b;">△ A MEJORAR</strong>
            <ul>{mejoras_html}</ul>
        </div>''' if mejoras else ''}

        <!-- OBJECIONES -->
        {f'''<div class="section-title">Objeciones que enfrentaste</div>
        {objeciones_html}''' if objeciones else ''}

        <!-- TU PRÓXIMO DRILL -->
        <div class="section-title">Tu próximo drill</div>
        <div style="background: #1a1a1a; color: white; padding: 16px; border-radius: 6px;">
            <div style="color: #d4af37; font-weight: bold; margin-bottom: 8px;">{data.get('drill', {}).get('titulo', 'Drill')}</div>
            <div style="font-size: 11px; line-height: 1.5; color: #bbb;">{data.get('drill', {}).get('descripcion', '')}</div>
            <div class="drill-button">ENTRENAR DE NUEVO →</div>
        </div>

        <!-- PLAN DE ACCIÓN -->
        {f'''<div class="section-title">Plan de acción para el gerente</div>
        <ol style="margin-left: 20px;">{plan_html}</ol>''' if plan else ''}

        <!-- NOTA DEEP LEARNING -->
        {f'''<div class="green-box">
            <strong style="color: #2e7d32;">🤖 NOTA DEEP LEARNING</strong>
            <p style="margin-top: 6px; font-size: 11px;">{nota}</p>
        </div>''' if nota else ''}

        <!-- TRANSCRIPCIÓN -->
        {f'''<div style="page-break-before: always; margin-top: 30px;">
            <div class="section-title">Transcripción completa</div>
            <div style="font-size: 10px; line-height: 1.6; white-space: pre-wrap; background: #f9f9f9; padding: 12px; border-radius: 4px;">
{transcript}
            </div>
        </div>''' if transcript else ''}

        <!-- FOOTER -->
        <div class="footer">
            <div style="font-weight: bold; margin-bottom: 6px;">VICTORIOUS TRAVELERS CLUB</div>
            <div>Reporte generado automáticamente por Víctor IA · {datetime.now().strftime('%d/%m/%Y')}</div>
        </div>
    </div>
</body>
</html>"""

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html, wait_until="load")
            pdf_bytes = page.pdf(format="Letter", print_background=True,
                                margin={"top": "10mm", "bottom": "10mm", "left": "12mm", "right": "12mm"})
            browser.close()
        return base64.b64encode(pdf_bytes).decode("utf-8")
    except Exception as e:
        print(f"Error generando PDF: {e}")
        return None
