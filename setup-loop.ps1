# SETUP — VICTOR IA LOOP AUTOMATIZADO
# Ejecutar EN PowerShell como ADMINISTRATOR

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "VICTOR IA — SETUP AUTOMATIZADO" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Paso 1: Instalar Python dependencies
Write-Host "`n[1/4] Instalando dependencias Python..." -ForegroundColor Yellow
pip install -r requirements.txt

# Paso 2: Instalar Playwright browsers
Write-Host "`n[2/4] Instalando Playwright browsers..." -ForegroundColor Yellow
python -m playwright install chromium

# Paso 3: Crear carpeta de logs
Write-Host "`n[3/4] Creando carpeta de logs..." -ForegroundColor Yellow
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force
}

# Paso 4: Test webhook connection
Write-Host "`n[4/4] Testando conexión a webhook..." -ForegroundColor Yellow
$testPayload = @{
    "test" = $true
    "timestamp" = Get-Date -Format "o"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "https://n8n.srv1013903.hstgr.cloud/webhook/elevenlabs-chat-track" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testPayload `
        -ErrorAction SilentlyContinue

    if ($response.StatusCode -in 200..299) {
        Write-Host "✅ Webhook conectado correctamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Webhook respondió con status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error conectando al webhook: $_" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecutar loop manualmente: python playwright-loop.py" -ForegroundColor Cyan
Write-Host "2. Programar en Task Scheduler (cada 5 min)" -ForegroundColor Cyan
Write-Host "3. Monitorear logs en carpeta 'logs/'" -ForegroundColor Cyan