#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sincroniza VICTOR_SYSTEM_PROMPT_CANONICAL.md al agente ElevenLabs (VTC Capacitacion).

Uso:
    python scripts/sync-prompt-to-elevenlabs.py            # sincroniza
    python scripts/sync-prompt-to-elevenlabs.py --dry-run  # muestra qué haría sin tocar nada

La API key se toma de la variable de entorno ELEVENLABS_API_KEY.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

AGENT_ID = "agent_9501k3vkt6svekjs6y0qe5xzcek1"  # VTC Capacitacion - Agente Victor
API_BASE = "https://api.elevenlabs.io/v1/convai/agents"

# Fuente de verdad LIVE = V11 (flujo obligatorio, no saltos). No apuntar a versiones previas: regresaria el agente.
PROMPT_FILE = Path(__file__).resolve().parent.parent / "VICTOR_SYSTEM_PROMPT_V11_FLUJO_OBLIGATORIO.md"

# Fallback: key conocida del ecosistema Victor IA (misma cuenta)
API_KEY = os.environ.get(
    "ELEVENLABS_API_KEY",
    "sk_87d5a7899d6c489c94232248c4880a0c4fe317adb3701e67",
)


def api_request(method: str, url: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("xi-api-key", API_KEY)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        print(f"[ERROR] HTTP {e.code} en {method} {url}\n{detail}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"[ERROR] Sin conexion con ElevenLabs: {e.reason}")
        sys.exit(1)


def main() -> None:
    dry_run = "--dry-run" in sys.argv

    if not PROMPT_FILE.exists():
        print(f"[ERROR] No existe el archivo canonical: {PROMPT_FILE}")
        sys.exit(1)

    prompt = PROMPT_FILE.read_text(encoding="utf-8")
    print(f"Prompt canonical: {PROMPT_FILE.name} ({len(prompt):,} caracteres)")

    # 1. Leer config actual del agente (para no pisar nada mas que el prompt)
    agent = api_request("GET", f"{API_BASE}/{AGENT_ID}")
    current = (
        agent.get("conversation_config", {})
        .get("agent", {})
        .get("prompt", {})
        .get("prompt", "")
    )
    print(f"Prompt actual en ElevenLabs: {len(current):,} caracteres")

    if current == prompt:
        print("Sin cambios - el agente ya tiene la version canonical. Nada que hacer.")
        return

    if dry_run:
        print("[DRY-RUN] Se actualizaria el system prompt del agente. No se toco nada.")
        return

    # 2. PATCH solo del prompt (el resto de la config queda intacta)
    payload = {"conversation_config": {"agent": {"prompt": {"prompt": prompt}}}}
    result = api_request("PATCH", f"{API_BASE}/{AGENT_ID}", payload)

    name = result.get("name", AGENT_ID)
    print(f"OK - Prompt sincronizado al agente '{name}' ({AGENT_ID}).")
    print("Verifica en https://elevenlabs.io/app/conversational-ai")


if __name__ == "__main__":
    main()
