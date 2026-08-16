@echo off
title Serveur OtakuHUB (Mobile)
echo Demarrage du serveur OtakuHUB pour ton telephone...
cd /d "%~dp0"
npm run dev -- --host --port 5173 --strictPort
pause
