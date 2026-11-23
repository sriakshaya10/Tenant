@echo off
title TenantSynth AI - Frontend Server
cd /d "%~dp0frontend"
echo ========================================================
echo Starting TenantSynth AI React+Vite Frontend on port 5173...
echo App URL: http://localhost:5173
echo ========================================================
npm run dev
pause
