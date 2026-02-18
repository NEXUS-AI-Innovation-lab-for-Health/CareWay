#!/bin/sh
# ================================
# Healthcheck script pour Docker
# ================================
# Ce script vérifie que l'application est accessible

# Vérifier que nginx répond
if ! curl -f http://localhost/ > /dev/null 2>&1; then
    echo "ERROR: Nginx n'est pas accessible"
    exit 1
fi

# Vérifier que le fichier index.html existe
if [ ! -f /usr/share/nginx/html/index.html ]; then
    echo "ERROR: index.html manquant"
    exit 1
fi

echo "OK: Application en bonne santé"
exit 0
