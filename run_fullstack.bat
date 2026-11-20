@echo off
title CloudVault Fullstack Runner
echo ========================================================
echo     CloudVault Fullstack - Python FastAPI + React TSX
echo ========================================================
echo.

echo [1/2] Python FastAPI Backend ishga tushirilmoqda (Port 8000)...
start "CloudVault Backend (FastAPI)" cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

echo [2/2] React Frontend ishga tushirilmoqda (Port 5173)...
start "CloudVault Frontend (Vite)" cmd /c "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Serverlar ishga tushdi! Brauzer ochilmoqda: http://localhost:5173/
timeout /t 3 >nul
start http://localhost:5173/
exit
