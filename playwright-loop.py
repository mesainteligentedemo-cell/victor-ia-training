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
# PDF LOCAL — GENERAR REPORTE CON PLAYWRIGHT (sin depender de serverless)
# ============================================================================

def generate_pdf_report(employee, chat_data, conversation_id):
    """Genera el PDF del reporte en local con Playwright y lo regresa en base64"""
    import base64

    transcript_html = "".join(
        f"<div class='msg {msg['role']}'><b>{'Victor' if msg['role']=='agent' else employee['name']}:</b> {msg['text']}</div>"
        for msg in chat_data['conversation']
    ) or "<p>Sin transcripción (0 turnos).</p>"

    html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><style>
  body{{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:40px;}}
  h1{{color:#b89a6a;font-family:Georgia,serif;font-weight:400;border-bottom:2px solid #b89a6a;padding-bottom:10px;}}
  table{{width:100%;border-collapse:collapse;margin:20px 0;}}
  td{{padding:8px 12px;border:1px solid #ddd;font-size:13px;}}
  td:first-child{{background:#f7f4ee;font-weight:bold;width:200px;}}
  .msg{{padding:8px 12px;margin:6px 0;border-radius:6px;font-size:12px;line-height:1.5;background:#f5f5f5;}}
  .msg.agent{{background:#f7f4ee;border-left:3px solid #b89a6a;}}
  .plan{{background:#1a1a1a;color:#e8dcc8;padding:16px 20px;border-radius:8px;margin-top:24px;}}
  .plan h2{{color:#b89a6a;margin-top:0;font-size:16px;}}
  .foot{{margin-top:30px;color:#999;font-size:11px;text-align:center;}}
</style></head><body>
  <h1>Reporte de Capacitación VTC</h1>
  <table>
    <tr><td>Empleado</td><td>{employee['name']}</td></tr>
    <tr><td>ID Empleado</td><td>{employee['id']}</td></tr>
    <tr><td>Departamento</td><td>{employee['dept']}</td></tr>
    <tr><td>Conversación</td><td>{conversation_id}</td></tr>
    <tr><td>Inicio</td><td>{chat_data['start_time']}</td></tr>
    <tr><td>Fin</td><td>{chat_data['end_time']}</td></tr>
    <tr><td>Duración</td><td>{chat_data['duration_minutes']} minutos</td></tr>
    <tr><td>Turnos</td><td>{len(chat_data['conversation'])}</td></tr>
    <tr><td>Estado</td><td>Completado</td></tr>
  </table>
  <h2 style="color:#b89a6a;font-family:Georgia,serif;font-weight:400;">Transcripción</h2>
  {transcript_html}
  <div class="plan">
    <h2>Plan de Acción</h2>
    <ol>
      <li>Revisar la transcripción completa de la sesión</li>
      <li>Identificar áreas de mejora específicas</li>
      <li>Programar sesión de retroalimentación</li>
      <li>Establecer objetivos para la próxima evaluación</li>
    </ol>
  </div>
  <div class="foot">Reporte generado por Victor IA Training System · {datetime.now().strftime('%d/%m/%Y %H:%M')}</div>
</body></html>"""

    try:
        with sync_playwright() as p:
            # PDF requiere chromium headless SIEMPRE (independiente del config)
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html, wait_until="load")
            pdf_bytes = page.pdf(format="Letter", print_background=True,
                                 margin={"top": "15mm", "bottom": "15mm", "left": "12mm", "right": "12mm"})
            browser.close()
        print(f"[{employee['name']}] 📄 PDF generado en local ({len(pdf_bytes)//1024} KB)")
        return base64.b64encode(pdf_bytes).decode("ascii")
    except Exception as e:
        print(f"[{employee['name']}] ⚠️ No se pudo generar PDF local: {e} — el email irá sin adjunto")
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