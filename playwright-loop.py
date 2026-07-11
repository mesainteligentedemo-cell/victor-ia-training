#!/usr/bin/env python3
"""
VICTOR IA — LOOP AUTOMATIZADO DE CAPACITACIÓN
Genera sesiones fake con Fingerprint Scraper + Playwright + Chat Loop
Envía datos a n8n webhook para generar reportes PDF automáticos
Ejecutar cada 5 minutos vía Windows Task Scheduler
"""

import sys
# Windows: la consola cp1252 no soporta emojis — forzar UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

import json
import random
import time
import requests
import subprocess
from datetime import datetime
from playwright.sync_api import sync_playwright
import uuid
import base64
from pdf_generator import generate_pdf_report as generate_pdf_from_template

# ============================================================================
# CONFIG
# ============================================================================

CONFIG_FILE = "config-loop.json"

with open(CONFIG_FILE, "r") as f:
    CONFIG = json.load(f)

WEBHOOK_URL = CONFIG["webhook_url"]  # https://n8n.srv1013903.hstgr.cloud/webhook/elevenlabs-chat-track
CHAT_API = CONFIG["chat_api"]  # https://victor-ia-training.vercel.app/api/elevenlabs-chat
CHAT_URL = CONFIG["chat_url"]  # https://victor-ia-training.vercel.app/
HEADLESS = CONFIG["headless"]  # True/False

EMPLOYEES = [
    {"name": "Carlos Mendoza", "id": "VTC-CL-001", "dept": "Dirección"},
    {"name": "Sandra García", "id": "VTC-CL-014", "dept": "OPC"},
    {"name": "Jorge López", "id": "VTC-CL-023", "dept": "Cierre"},
    {"name": "Laura Sánchez", "id": "VTC-CL-024", "dept": "Línea"},
    {"name": "Miguel Ángel", "id": "VTC-CL-025", "dept": "Front to Middle"},
]

MODULES = ["Cierre", "Ventas", "Objeciones", "PNL", "Reportes"]
RESPONSES = [
    "Entendido, siguiente",
    "¿Puedes explicar más?",
    "Eso tiene sentido",
    "Siguiente módulo",
    "¿Cómo se aplica?",
    "Dale, continúa",
    "Perfecto",
]

# ============================================================================
# FINGERPRINT SCRAPER (generar identidad única)
# ============================================================================

def generate_fingerprint():
    """Genera fingerprint fake único"""
    return {
        "fingerprint_id": str(uuid.uuid4()),
        "canvas_hash": f"canvas_{random.randint(1000000, 9999999)}",
        "webgl_hash": f"webgl_{random.randint(1000000, 9999999)}",
        "timezone": random.choice(["America/Mexico_City", "America/Los_Angeles", "America/Chicago"]),
        "language": "es-MX",
        "platform": random.choice(["Linux", "Windows", "MacIntel"]),
    }

def generate_ip():
    """Genera IP fake de MX/USA"""
    mx_ips = ["201.153", "187.189", "189.204"]
    usa_ips = ["76.194", "99.100", "12.212"]

    prefix = random.choice(mx_ips + usa_ips)
    return f"{prefix}.{random.randint(0,255)}.{random.randint(0,255)}"

# ============================================================================
# PLAYWRIGHT — AUTOMATIZACIÓN NAVEGADOR
# ============================================================================

def run_chat_session(employee, fingerprint, ip, conversation_id):
    """Ejecuta sesión de chat automatizada con Playwright"""

    messages = []
    start_time = datetime.now()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context()
        page = context.new_page()

        try:
            # STEP 1: Navegar al sitio
            print(f"[{employee['name']}] Navegando a {CHAT_URL}...")
            page.goto(CHAT_URL, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_selector("#vw-launch", state="visible", timeout=30000)
            time.sleep(random.uniform(2, 4))

            # STEP 2: Abrir el widget flotante (el form vive DENTRO de #vw-panel,
            # que tiene display:none hasta que se hace click en el launcher)
            print(f"[{employee['name']}] Abriendo widget de Victor...")
            page.click("#vw-launch")
            page.wait_for_selector("#vw-name", state="visible", timeout=15000)
            time.sleep(random.uniform(0.5, 1))

            # STEP 3: Llenar formulario (IDs reales del gate: vw-name, vw-emp, vw-dep)
            print(f"[{employee['name']}] Llenando formulario...")
            page.fill("#vw-name", employee['name'])
            time.sleep(random.uniform(0.5, 1.5))

            page.fill("#vw-emp", employee['id'])
            time.sleep(random.uniform(0.5, 1.5))

            page.select_option("#vw-dep", employee['dept'])
            time.sleep(random.uniform(0.5, 1))

            # NOTA: NO se hace click en #vw-cta ("Comenzar capacitación") a propósito:
            # ese botón pide micrófono y abre una sesión REALTIME de ElevenLabs
            # (consume créditos en cada loop). El chat se simula vía CHAT_API abajo.
            print(f"[{employee['name']}] ✅ Formulario llenado (name/emp/dep)")

            # STEP 3: Chat loop (3-5 turnos)
            num_turns = random.randint(3, 5)

            for turn in range(num_turns):
                print(f"[{employee['name']}] Turno {turn+1}/{num_turns}...")

                # User message
                if turn == 0:
                    user_msg = "Hola, quiero aprender"
                elif turn == 1:
                    user_msg = f"Módulo {random.choice(MODULES)}"
                else:
                    user_msg = random.choice(RESPONSES)

                # Enviar a API
                payload = {
                    "userMessage": user_msg,
                    "conversationId": conversation_id,
                    "history": messages
                }

                try:
                    resp = requests.post(CHAT_API, json=payload, timeout=35)
                    if resp.status_code == 200:
                        data = resp.json()
                        agent_msg = data.get("agentResponse", "")

                        messages.append({"role": "user", "text": user_msg})
                        messages.append({"role": "agent", "text": agent_msg})

                        print(f"  User: {user_msg[:50]}...")
                        print(f"  Victor: {agent_msg[:50]}...")
                    else:
                        print(f"  Error: {resp.status_code}")
                except Exception as e:
                    print(f"  Error en turno: {e}")

                time.sleep(random.uniform(2, 4))

        except Exception as e:
            print(f"[{employee['name']}] Error Playwright: {e}")

        finally:
            browser.close()

    end_time = datetime.now()
    duration = int((end_time - start_time).total_seconds() / 60)

    return {
        "conversation": messages,
        "duration_minutes": duration,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
    }

# ============================================================================
# PDF LOCAL — GENERAR REPORTE PROFESIONAL VTC
# ============================================================================

def generate_pdf_report(employee, chat_data, conversation_id):
    """Genera un PDF profesional EXACTO al reporte VTC de referencia"""

    # Construir transcript
    transcript_lines = []
    for msg in chat_data['conversation']:
        role = "VÍCTOR" if msg['role'] == 'agent' else employee['name'].upper()
        transcript_lines.append(f"{role}: {msg['text']}")
    transcript = "\n\n".join(transcript_lines) if transcript_lines else "Sin transcripción"

    # Competencias por defecto
    competencias = [
        {"nombre": "Rapport", "score": random.randint(2, 8)},
        {"nombre": "PNL", "score": random.randint(2, 8)},
        {"nombre": "Postura", "score": random.randint(2, 8)},
        {"nombre": "Objeciones", "score": random.randint(1, 6)},
        {"nombre": "Leer la sala", "score": random.randint(2, 7)},
        {"nombre": "Cierre", "score": random.randint(1, 6)},
    ]

    data = {
        'user_name': employee['name'],
        'empleado_id': employee['id'],
        'departamento': employee.get('dept', 'GERENCIA O DIRECCION'),
        'puesto': 'DIRECTOR',
        'duracion_minutos': f"{chat_data['duration_minutes']}:00",
        'timestamp': chat_data['start_time'],
        'score_global': random.randint(2, 8),
        'resumen': 'El asesor participó en una sesión de capacitación automatizada con el entrenador Víctor IA, realizando múltiples turnos de diálogo.',
        'competencias': competencias,
        'timeline': [
            {"t": "00:00", "texto": "Introducción y solicitud de datos"},
            {"t": "01:15", "texto": "Primer módulo de capacitación"},
            {"t": "02:45", "texto": "Interacción con el agente"},
            {"t": "04:00", "texto": "Conclusión de la sesión"},
        ],
        'fortalezas': [
            'Participación activa en la sesión de capacitación',
            'Disposición para aprender nuevos conceptos',
            'Interacción clara con el agente'
        ],
        'mejoras': [
            'Profundizar en la aplicación práctica de los conceptos',
            'Aumentar la velocidad de aprendizaje',
            'Relacionar los principios con casos reales'
        ],
        'objeciones': [
            {
                'objecion': 'Falta de claridad en algunos conceptos',
                'manejo': 'El agente Víctor brindó explicaciones adicionales y ejemplos prácticos para mejorar la comprensión'
            }
        ],
        'drill': {
            'titulo': 'Refuerzo de conceptos clave',
            'descripcion': 'Practica nuevamente los conceptos aprendidos en esta sesión con enfoque en aplicación práctica',
            'url': 'https://tracker.victor-ia.xyz'
        },
        'plan_gerente': [
            'Revisar el reporte completo de esta sesión de capacitación',
            'Programar una sesión de seguimiento para verificar retención',
            'Asignar ejercicios prácticos basados en los módulos cubiertos',
            'Evaluar el progreso en la próxima sesión'
        ],
        'nota_deep_learning': 'El sistema de capacitación automatizado funcionó correctamente. Se recomienda continuar con sesiones periódicas para reforzar el aprendizaje.',
        'transcript': transcript
    }

    try:
        pdf_base64 = generate_pdf_from_template(data)
        print(f"[{employee['name']}] 📄 PDF generado (profesional VTC) - {len(base64.b64decode(pdf_base64))//1024} KB")
        return pdf_base64
    except Exception as e:
        print(f"[{employee['name']}] ⚠️ Error generando PDF: {e}")
        return None

# ============================================================================
# WEBHOOK — ENVIAR REPORTE (Vercel /api/generate-report → Resend + Supabase)
# ============================================================================

def send_to_webhook(employee, fingerprint, ip, chat_data, conversation_id, pdf_base64=None):
    """Envía datos al endpoint que guarda en Supabase y manda el email con PDF"""

    # Construir transcripción
    transcript = "\n".join([
        f"{msg['role'].upper()}: {msg['text']}"
        for msg in chat_data['conversation']
    ])

    # Payload compatible con n8n
    payload = {
        "empleado_id": employee['id'],
        "user_name": employee['name'],
        "user_email": CONFIG.get("email_destination", "mesainteligentedemo@gmail.com"),
        "fingerprint": fingerprint['fingerprint_id'],
        "ip": ip,
        "conversation_id": conversation_id,
        "conversation": chat_data['conversation'],
        "transcript": transcript,
        "disc_type": "Amiable",  # Detectar automáticamente en futuro
        "timestamp": chat_data['start_time'],
        "timestamp_fin": chat_data['end_time'],
        "duracion_minutos": chat_data['duration_minutes'],
        "estado_final": "completado",
        "status": "capacitacion_automatizada",
        "modulos": [msg['text'] for msg in chat_data['conversation'] if "Módulo" in msg['text']],
    }

    if pdf_base64:
        payload["pdf_base64"] = pdf_base64

    try:
        print(f"[{employee['name']}] Enviando webhook con reporte...")
        # timeout amplio: el endpoint guarda en Supabase Y envía email con adjunto
        resp = requests.post(WEBHOOK_URL, json=payload, timeout=60)

        if resp.status_code in [200, 201]:
            print(f"[{employee['name']}] ✅ Webhook OK ({resp.status_code}). Email con PDF enviado.")
            try:
                print(f"    Respuesta: {resp.json()}")
            except Exception:
                pass
            return True
        else:
            print(f"[{employee['name']}] ❌ Webhook error: {resp.status_code} — {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"[{employee['name']}] ❌ Error enviando webhook: {e}")
        return False

# ============================================================================
# MAIN LOOP
# ============================================================================

def main():
    print("\n" + "="*70)
    print("VICTOR IA — LOOP AUTOMATIZADO")
    print("="*70)

    # Seleccionar empleado aleatorio
    employee = random.choice(EMPLOYEES)
    print(f"\n👤 Empleado: {employee['name']} ({employee['id']})")

    # Generar identidad única
    fingerprint = generate_fingerprint()
    ip = generate_ip()
    conversation_id = f"conv_{uuid.uuid4().hex[:16]}"

    print(f"🔐 Fingerprint: {fingerprint['fingerprint_id']}")
    print(f"🌐 IP: {ip}")
    print(f"💬 Conversación ID: {conversation_id}")

    # Ejecutar sesión de chat
    print(f"\n▶️  Iniciando sesión de chat...")
    chat_data = run_chat_session(employee, fingerprint, ip, conversation_id)

    print(f"\n✅ Sesión completada: {chat_data['duration_minutes']} minutos")
    print(f"📝 Turnos: {len(chat_data['conversation'])}")

    # Generar PDF en local (Playwright) — no depende de chromium serverless
    print(f"\n📄 Generando PDF del reporte...")
    pdf_base64 = generate_pdf_report(employee, chat_data, conversation_id)

    # Enviar a webhook (Supabase + email Resend con PDF adjunto)
    print(f"\n📤 Enviando reporte...")
    ok = send_to_webhook(employee, fingerprint, ip, chat_data, conversation_id, pdf_base64)
    if not ok:
        raise SystemExit(1)

    print("\n" + "="*70)
    print("✅ LOOP COMPLETADO")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()