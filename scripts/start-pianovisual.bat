@echo off
setlocal

cd /d "%~dp0\.."

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRORE] Node.js non trovato. Installa Node.js 20+ e riprova.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRORE] npm non trovato. Installa Node.js 20+ e riprova.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Dipendenze non trovate: avvio npm install...
  call npm install
  if errorlevel 1 (
    echo [ERRORE] npm install fallito.
    pause
    exit /b 1
  )
)

echo [INFO] Avvio PianoVisual su http://localhost:5173
start "" "http://localhost:5173"
call npm start

