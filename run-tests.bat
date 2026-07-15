@echo off
REM Victor IA E2E Tests - Windows Batch Runner
REM Ejecutar: run-tests.bat [opciones]
REM Opciones: headed, debug, report, single, watch

setlocal enabledelayedexpansion

set "OPTION=%1"

if "%OPTION%"=="" (
    echo.
    echo 🚀 Victor IA E2E Tests
    echo.
    echo Ejecutando: npm test (headless)
    echo.
    call npm test
    goto :end
)

if /i "%OPTION%"=="headed" (
    echo.
    echo 🚀 Victor IA E2E Tests (con interfaz visual)
    echo.
    call npm run test:headed
    goto :end
)

if /i "%OPTION%"=="debug" (
    echo.
    echo 🚀 Victor IA E2E Tests (modo debug - pausar en cada step)
    echo.
    call npm run test:debug
    goto :end
)

if /i "%OPTION%"=="report" (
    echo.
    echo 📊 Abriendo reporte HTML...
    echo.
    call npm run test:report
    goto :end
)

if /i "%OPTION%"=="single" (
    echo.
    echo 🚀 Victor IA E2E Tests (un archivo)
    echo.
    call npm run test:single
    goto :end
)

if /i "%OPTION%"=="watch" (
    echo.
    echo 👀 Victor IA E2E Tests (modo watch - re-ejecuta al cambiar)
    echo.
    call npm run test:watch
    goto :end
)

if /i "%OPTION%"=="help" (
    echo.
    echo 📚 Victor IA E2E Tests - Help
    echo.
    echo Opciones:
    echo   (sin opción)  - npm test (headless)
    echo   headed        - npm run test:headed (con navegador visible)
    echo   debug         - npm run test:debug (modo debug)
    echo   report        - npm run test:report (ver reporte HTML)
    echo   single        - npm run test:single (un archivo)
    echo   watch         - npm run test:watch (watch mode)
    echo   help          - Mostrar esta ayuda
    echo.
    echo Ejemplos:
    echo   run-tests.bat
    echo   run-tests.bat headed
    echo   run-tests.bat debug
    echo   run-tests.bat report
    echo.
    goto :end
)

echo.
echo ❌ Opción no reconocida: %OPTION%
echo.
echo Usa: run-tests.bat help
echo.

:end
pause