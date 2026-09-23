#!/bin/bash

# Script de démarrage du serveur Visio WebSocket pour macOS/Linux

echo ""
echo "========================================="
echo "  Démarrage du serveur WebSocket Visio"
echo "========================================="
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "ERREUR: Node.js n'est pas installé"
    echo "Installez Node.js depuis https://nodejs.org/"
    exit 1
fi

# Naviguer vers le dossier du serveur
cd "$(dirname "$0")/prototype-visio-main/prototype-visio-main/visio-server"

# Vérifier si le dossier existe
if [ ! -f "package.json" ]; then
    echo "ERREUR: Le dossier prototype-visio-main/visio-server n'a pas été trouvé"
    echo "Assurez-vous que le dossier prototype-visio-main est présent"
    exit 1
fi

echo ""
echo "Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "ERREUR: Impossible d'installer les dépendances"
    exit 1
fi

echo ""
echo "========================================="
echo "  Démarrage du serveur..."
echo "========================================="
echo ""
echo "Port: 8080"
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

node server.js
