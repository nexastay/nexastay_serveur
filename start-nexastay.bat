@echo off
echo.
echo ========================================
echo    🚀 NEXASTAY PLATFORM LAUNCHER 🚀
echo ========================================
echo.
echo Démarrage du serveur NexaStay...
echo.

cd /d "%~dp0"

echo 📦 Vérification des dépendances...
if not exist "node_modules" (
    echo Installation des dépendances...
    npm install
)

echo.
echo 🌐 Démarrage du serveur sur http://localhost:3000
echo.
echo ✅ Serveur prêt ! Le navigateur va s'ouvrir automatiquement...
echo.
echo 📊 Interfaces disponibles:
echo    • Page principale: http://localhost:3000
echo    • Dashboard hôte: http://localhost:3000/proprietaire
echo    • Interface IA: http://localhost:3000/ia
echo    • Voyageurs: http://localhost:3000/voyageur
echo.
echo 💡 Appuyez sur Ctrl+C pour arrêter le serveur
echo.

timeout /t 2 /nobreak >nul

start "" "http://localhost:3000"

node server.js

pause
