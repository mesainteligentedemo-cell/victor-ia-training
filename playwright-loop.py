#!/usr/bin/env python3
"""
VICTOR IA — LOOP AUTOMATIZADO DE CAPACITACIÓN
Genera sesiones fake con Fingerprint Scraper + Playwright + Chat Loop
Envía datos a n8n webhook para generar reportes PDF automáticos
Ejecutar cada 5 minutos vía Windows Task Scheduler
"""

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
            page.goto(CHAT_URL, wait_until="networkidle")
            time.sleep(random.uniform(2, 4))

            # STEP 2: Llenar formulario
            print(f"[{employee['name']}] Llenando formulario...")
            page.fill("input[placeholder*='nombre']", employee['name'])
            time.sleep(random.uniform(0.5, 1.5))

            page.fill("input[placeholder*='empleado']", employee['id'])
            time.sleep(random.uniform(0.5, 1.5))

            # Seleccionar departamento
            page.select_option("select", employee['dept'])
            time.sleep(random.uniform(0.5, 1))

            # Click botón
            page.click("button:has-text('COMENZAR')")
            time.sleep(random.uniform(3, 5))

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
# WEBHOOK — ENVIAR A N8N
# ============================================================================

def send_to_webhook(employee, fingerprint, ip, chat_data, conversation_id):
    """Envía datos a n8n para generar reporte PDF"""

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

    try:
        print(f"[{employee['name']}] Enviando webhook a n8n...")
        resp = requests.post(WEBHOOK_URL, json=payload, timeout=10)

        if resp.status_code in [200, 201]:
            print(f"[{employee['name']}] ✅ Webhook enviado. Reporte PDF en camino...")
            return True
        else:
            print(f"[{employee['name']}] ❌ Webhook error: {resp.status_code}")
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

    # Enviar a webhook
    print(f"\n📤 Enviando datos a n8n...")
    send_to_webhook(employee, fingerprint, ip, chat_data, conversation_id)

    print("\n" + "="*70)
    print("✅ LOOP COMPLETADO")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()