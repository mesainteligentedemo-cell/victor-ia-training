import base64
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
import math

GOLD = HexColor('#d4af37')
DARK = HexColor('#1a1a1a')
LIGHT = HexColor('#f5f5f5')
GREEN = HexColor('#2e7d32')
GREEN_BG = HexColor('#e8f5e9')
YELLOW = HexColor('#b8860b')
YELLOW_BG = HexColor('#fdf6e3')

def generate_pdf_report(data):
    """
    Genera un PDF EXACTO al reporte VTC de referencia.
    Retorna bytes base64 listo para adjuntar en email.
    """

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch,
                           leftMargin=0.7*inch, rightMargin=0.7*inch)
    story = []

    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=GOLD,
        spaceAfter=6,
        alignment=1,  # center
        fontName='Helvetica-Bold'
    )

    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=DARK,
        spaceAfter=12,
        spaceBefore=12,
        alignment=0,
        fontName='Helvetica-Bold',
        letterSpacing=2
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=black,
        spaceAfter=8,
        alignment=4,  # justify
        leading=14
    )

    # ==== HEADER ====
    header_data = [
        [Paragraph("VICTORIOUS TRAVELERS CLUB", ParagraphStyle('h', parent=styles['Normal'], fontSize=18, textColor=GOLD, alignment=1, fontName='Helvetica-Bold'))],
        [Paragraph(datetime.now().strftime("%d %B %Y").upper(), ParagraphStyle('h2', parent=styles['Normal'], fontSize=9, textColor=HexColor('#999999'), alignment=1))],
        [Paragraph("Reporte de entrenamiento", ParagraphStyle('h3', parent=styles['Normal'], fontSize=13, textColor=white, alignment=1))]
    ]
    header_table = Table(header_data, colWidths=[7.5*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 14),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.15*inch))

    # ==== SESIÓN + BADGE ====
    sesion_text = f"Sesión de {data.get('user_name', 'Empleado')} con Víctor · Coaching · {data.get('duracion_minutos', '0:00')} min"
    story.append(Paragraph(sesion_text, ParagraphStyle('sesion', parent=styles['Normal'], fontSize=12, textColor=DARK, alignment=1, fontName='Helvetica-Bold')))

    badge_text = f"EMPLEADO N° {data.get('empleado_id', '000')} — GERENCIA O DIRECCION — DIRECTOR"
    story.append(Paragraph(badge_text, ParagraphStyle('badge', parent=styles['Normal'], fontSize=8, textColor=DARK, alignment=1, fontName='Helvetica-Bold', borderPadding=6)))
    story.append(Spacer(1, 0.15*inch))

    # ==== DESEMPEÑO GLOBAL ====
    score = int(data.get('score_global', 0))
    perf_data = [
        [Paragraph("DESEMPEÑO GLOBAL", ParagraphStyle('p', parent=styles['Normal'], fontSize=9, textColor=HexColor('#999999'), alignment=1, fontName='Helvetica-Bold'))],
        [Paragraph(f"{score}<font size=16>/10</font>", ParagraphStyle('score', parent=styles['Normal'], fontSize=48, textColor=GOLD, alignment=1, fontName='Helvetica-Bold'))],
    ]
    perf_table = Table(perf_data, colWidths=[7.5*inch])
    perf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
    ]))
    story.append(perf_table)
    story.append(Spacer(1, 0.2*inch))

    # ==== RESUMEN ====
    story.append(Paragraph("RESUMEN DE LA LLAMADA", section_style))
    resumen = data.get('resumen', 'Sin resumen disponible')
    story.append(Paragraph(resumen, body_style))
    story.append(Spacer(1, 0.15*inch))

    # ==== MAPA DE COMPETENCIAS ====
    story.append(Paragraph("MAPA DE COMPETENCIAS", section_style))

    # Tabla de competencias (barras)
    comp_data = [["Competencia", "Score", "Evaluación"]]
    competencias = data.get('competencias', [])
    for comp in competencias:
        nombre = comp.get('nombre', 'N/A')
        score = int(comp.get('score', 0))
        comp_data.append([
            Paragraph(nombre, ParagraphStyle('comp', parent=styles['Normal'], fontSize=9)),
            Paragraph(f"{score}/10", ParagraphStyle('comp', parent=styles['Normal'], fontSize=9, textColor=GOLD, fontName='Helvetica-Bold')),
            Paragraph("█" * score + "░" * (10-score), ParagraphStyle('comp', parent=styles['Normal'], fontSize=8, textColor=GOLD))
        ])

    comp_table = Table(comp_data, colWidths=[3.5*inch, 1*inch, 3*inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT),
        ('TEXTCOLOR', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('TEXTCOLOR', (0, 1), (-1, -1), black),
        ('ALIGN', (0, 1), (-1, 1), 'LEFT'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT]),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#eeeeee')),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 0.15*inch))

    # ==== LÍNEA DE CONVERSACIÓN ====
    story.append(Paragraph("LÍNEA DE LA CONVERSACIÓN", section_style))
    timeline = data.get('timeline', [])
    for item in timeline:
        time_badge = Paragraph(f"<b>{item.get('t', '00:00')}</b>", ParagraphStyle('time', parent=styles['Normal'], fontSize=8, textColor=GOLD))
        text = Paragraph(item.get('texto', ''), body_style)
        story.append(Paragraph(f"<b>{item.get('t', '00:00')}</b> — {item.get('texto', '')}", body_style))
    story.append(Spacer(1, 0.15*inch))

    # ==== LO QUE HICISTE BIEN ====
    fortalezas = data.get('fortalezas', [])
    if fortalezas:
        story.append(Paragraph("✓ LO QUE HICISTE BIEN", section_style))
        for f in fortalezas:
            story.append(Paragraph(f"• {f}", body_style))
        story.append(Spacer(1, 0.1*inch))

    # ==== A MEJORAR ====
    mejoras = data.get('mejoras', [])
    if mejoras:
        story.append(Paragraph("△ A MEJORAR", section_style))
        for m in mejoras:
            story.append(Paragraph(f"• {m}", body_style))
        story.append(Spacer(1, 0.1*inch))

    # ==== OBJECIONES ====
    objeciones = data.get('objeciones', [])
    if objeciones:
        story.append(Paragraph("OBJECIONES QUE ENFRENTASTE", section_style))
        for obj in objeciones:
            story.append(Paragraph(f"<b>Objeción:</b> {obj.get('objecion', '')}", body_style))
            story.append(Paragraph(f"<b>Manejo:</b> {obj.get('manejo', '')}", body_style))
            story.append(Spacer(1, 0.08*inch))

    # ==== TU PRÓXIMO DRILL ====
    drill = data.get('drill', {})
    story.append(Paragraph("TU PRÓXIMO DRILL", section_style))
    story.append(Paragraph(f"<b>{drill.get('titulo', 'Sin título')}</b>", body_style))
    story.append(Paragraph(drill.get('descripcion', ''), body_style))
    story.append(Spacer(1, 0.15*inch))

    # ==== PLAN DE ACCIÓN GERENTE ====
    plan = data.get('plan_gerente', [])
    if plan:
        story.append(Paragraph("PLAN DE ACCIÓN PARA EL GERENTE", section_style))
        for i, p in enumerate(plan, 1):
            story.append(Paragraph(f"<b>{i}.</b> {p}", body_style))
        story.append(Spacer(1, 0.15*inch))

    # ==== NOTA DEEP LEARNING ====
    nota = data.get('nota_deep_learning', '')
    if nota:
        story.append(Paragraph("NOTA DEEP LEARNING", section_style))
        story.append(Paragraph(f"🤖 {nota}", body_style))
        story.append(Spacer(1, 0.15*inch))

    # ==== TRANSCRIPCIÓN ====
    transcript = data.get('transcript', '')
    if transcript:
        story.append(PageBreak())
        story.append(Paragraph("TRANSCRIPCIÓN COMPLETA", section_style))
        story.append(Paragraph(transcript, body_style))

    # ==== FOOTER ====
    story.append(Spacer(1, 0.3*inch))
    footer_data = [
        [Paragraph("VICTORIOUS TRAVELERS CLUB", ParagraphStyle('f', parent=styles['Normal'], fontSize=10, textColor=GOLD, alignment=1, fontName='Helvetica-Bold'))],
        [Paragraph("Reporte generado automáticamente por Víctor IA", ParagraphStyle('f2', parent=styles['Normal'], fontSize=8, textColor=HexColor('#777777'), alignment=1))]
    ]
    footer_table = Table(footer_data, colWidths=[7.5*inch])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(footer_table)

    # Generar PDF
    doc.build(story)

    # Retornar bytes base64
    pdf_bytes = buffer.getvalue()
    return base64.b64encode(pdf_bytes).decode('utf-8')
