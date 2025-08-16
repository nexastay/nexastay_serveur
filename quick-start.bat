@echo off
title NexaStay Platform
color 0A

echo.
echo  ███╗   ██╗███████╗██╗  ██╗ █████╗ ███████╗████████╗ █████╗ ██╗   ██╗
echo  ████╗  ██║██╔════╝╚██╗██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔══██╗╚██╗ ██╔╝
echo  ██╔██╗ ██║█████╗   ╚███╔╝ ███████║███████╗   ██║   ███████║ ╚████╔╝ 
echo  ██║╚██╗██║██╔══╝   ██╔██╗ ██╔══██║╚════██║   ██║   ██╔══██║  ╚██╔╝  
echo  ██║ ╚████║███████╗██╔╝ ██╗██║  ██║███████║   ██║   ██║  ██║   ██║   
echo  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   
echo.
echo                    🚀 PLATEFORME DE RESERVATION PREMIUM 🚀
echo.

cd /d "%~dp0"

echo [INFO] Démarrage automatique...
timeout /t 1 /nobreak >nul

if not exist "node_modules" (
    echo [SETUP] Installation des dépendances...
    npm install --silent
)

echo [SERVER] Lancement du serveur NexaStay...
echo [BROWSER] Ouverture automatique dans 3 secondes...

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

node server.js
