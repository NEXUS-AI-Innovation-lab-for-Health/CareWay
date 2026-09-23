@echo off
REM Script de démarrage du serveur Visio WebSocket pour Windows

echo.
echo =========================================
echo  Démarrage du serveur WebSocket Visio
echo =========================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installé ou pas dans PATH
    echo Téléchargez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Naviguer vers le dossier du serveur
cd /d "%~dp0prototype-visio-main\prototype-visio-main\visio-server"

REM Vérifier si le dossier existe
if not exist "package.json" (
    echo ERREUR: Le dossier prototype-visio-main/visio-server n'a pas été trouvé
    echo Assurez-vous que le dossier prototype-visio-main est présent
    pause
    exit /b 1
)

echo.
echo Installation des dépendances...
call npm install

if errorlevel 1 (
    echo ERREUR: Impossible d'installer les dépendances
    pause
    exit /b 1
)

echo.
echo =========================================
echo  Démarrage du serveur...
echo =========================================
echo.
echo Port: 8080
echo Appuyez sur Ctrl+C pour arrêter
echo.

call node server.js

pause
