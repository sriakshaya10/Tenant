@echo off
title TenantSynth AI Launcher
echo ========================================================
echo Starting TenantSynth AI Full-Stack Platform...
echo ========================================================
start "TenantSynth AI - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "TenantSynth AI - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Both Backend (port 8000) and Frontend (port 5173) are starting!
echo Once both windows say they are ready, open:
echo   --^> http://localhost:5173
echo ========================================================
pause
