@echo off
title TenantSynth AI - Backend Server
cd /d "%~dp0backend"
echo ========================================================
echo Starting TenantSynth AI FastAPI Backend on port 8000...
echo API Docs: http://localhost:8000/docs
echo ========================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
