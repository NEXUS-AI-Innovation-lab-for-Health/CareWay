# ================================
# Stage 1: Build
# ================================
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances (optimisation du cache Docker)
COPY package.json package-lock.json* ./

# Installer les dépendances de production et de développement
RUN npm ci

# Copier le reste du code source
COPY . .

# Build de l'application
RUN npm run build

# ================================
# Stage 2: Production avec Nginx
# ================================
FROM nginx:1.25-alpine AS production

# Métadonnées
LABEL maintainer="CareWay Team"
LABEL description="CareWay - Application médicale React + TypeScript"
LABEL version="1.0.0"

# Installer curl pour healthcheck
RUN apk add --no-cache curl

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés depuis le stage builder (Vite utilise 'dist')
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un utilisateur non-root pour plus de sécurité
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Changer l'utilisateur
USER nginx

# Exposer le port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
