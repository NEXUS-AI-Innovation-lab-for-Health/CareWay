# 🐳 Documentation Docker - CareWay

Configuration Docker complète et optimisée pour l'application médicale CareWay.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Environnement de développement](#environnement-de-développement)
- [Environnement de production](#environnement-de-production)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes utiles](#commandes-utiles)
- [Troubleshooting](#troubleshooting)
- [Optimisations](#optimisations)

---

## 🔧 Prérequis

- **Docker** : Version 24.0 ou supérieure
- **Docker Compose** : Version 2.20 ou supérieure
- **WSL2** (Windows uniquement) : Pour de meilleures performances

### Vérifier votre installation

```bash
docker --version
docker compose version
```

---

## 🏗️ Architecture

### Fichiers Docker

```
CareWay/
├── Dockerfile              # Build multi-stage pour production
├── Dockerfile.dev          # Image de développement avec hot reload
├── docker-compose.yml      # Orchestration développement
├── docker-compose.prod.yml # Orchestration production
├── docker-compose.override.yml.example # Exemple de personnalisation locale
├── nginx.conf              # Configuration Nginx optimisée pour SPA
├── .dockerignore           # Exclusions pour le build
├── .env.example            # Template des variables d'environnement
├── docker-helper.ps1       # Script PowerShell pour Windows
├── Makefile                # Commandes Make (Linux/Mac/WSL)
└── README-DOCKER.md        # Cette documentation
```

### Images utilisées

- **Développement** : `node:20-alpine` (~120 MB)
- **Production** : 
  - Build: `node:20-alpine`
  - Runtime: `nginx:1.25-alpine` (~40 MB)

---

## 🚀 Démarrage rapide

### Option A : Avec les outils helper (recommandé)

**Windows PowerShell :**
```powershell
# Voir toutes les commandes disponibles
.\docker-helper.ps1 help

# Démarrer en développement
.\docker-helper.ps1 dev-start

# Voir les logs
.\docker-helper.ps1 dev-logs
```

**Linux/Mac/WSL (Makefile) :**
```bash
# Voir toutes les commandes disponibles
make help

# Configuration initiale
make setup

# Démarrer en développement
make dev-start

# Voir les logs
make dev-logs
```

### Option B : Avec Docker Compose directement

### 1. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-ici

# Optionnel
NODE_ENV=development
```

### 2. Lancer en développement

```bash
# Construire et démarrer
docker compose up -d

# Voir les logs
docker compose logs -f frontend
```

Accédez à l'application : **http://localhost:3000**

### 3. Lancer en production

```bash
# Construire et démarrer
docker compose -f docker-compose.prod.yml up -d

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f frontend
```

Accédez à l'application : **http://localhost**

---

## 💻 Environnement de développement

### Caractéristiques

✅ Hot reload automatique (modifications du code en temps réel)  
✅ Volumes montés pour le code source  
✅ Node modules isolés dans un volume Docker  
✅ Port 3000 exposé (configuration Vite du projet)  
✅ Utilisateur non-root pour la sécurité  

### Commandes de développement

```bash
# Démarrer les services
docker compose up -d

# Arrêter les services
docker compose down

# Redémarrer un service
docker compose restart frontend

# Voir les logs en temps réel
docker compose logs -f frontend

# Accéder au conteneur
docker compose exec frontend sh

# Reconstruire l'image (après modifications du Dockerfile)
docker compose up -d --build
```

### Modifier le code

Le hot reload est activé ! Modifiez simplement vos fichiers dans `src/` et Vite rechargera automatiquement.

---

## 🏭 Environnement de production

### Caractéristiques

✅ Build multi-stage optimisé (petite taille)  
✅ Nginx optimisé pour SPA React  
✅ Compression Gzip activée  
✅ Cache headers pour les assets  
✅ Security headers  
✅ Healthcheck configuré  
✅ Restart automatique  
✅ Limites de ressources  

### Build de production

```bash
# Build l'image de production
docker compose -f docker-compose.prod.yml build

# Démarrer en production
docker compose -f docker-compose.prod.yml up -d

# Arrêter
docker compose -f docker-compose.prod.yml down

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f

# Vérifier le healthcheck
docker inspect --format='{{json .State.Health}}' careway-frontend-prod
```

### Optimisations de production

- **Taille de l'image** : ~40 MB (nginx alpine + artifacts)
- **Compression Gzip** : Activée pour tous les assets
- **Cache** : 1 an pour JS/CSS/images, pas de cache pour index.html
- **Security headers** : X-Frame-Options, X-Content-Type-Options, etc.
- **Utilisateur non-root** : nginx user (UID 1001)

---

## 🔐 Variables d'environnement

### Variables Vite (préfixées par VITE_)

Les variables doivent être préfixées par `VITE_` pour être accessibles dans le code React.

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Utilisation dans le code

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Fichier .env.example

Créez un fichier `.env.example` pour documenter les variables :

```env
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🛠️ Commandes utiles

### Gestion des conteneurs

```bash
# Lister les conteneurs actifs
docker ps

# Lister toutes les images
docker images

# Supprimer les conteneurs arrêtés
docker compose down

# Supprimer les conteneurs + volumes
docker compose down -v

# Supprimer les images inutilisées
docker image prune -a
```

### Debugging

```bash
# Accéder au shell du conteneur
docker compose exec frontend sh

# Voir les logs détaillés
docker compose logs -f --tail=100 frontend

# Inspecter le conteneur
docker inspect careway-frontend-dev

# Vérifier la configuration Nginx (production)
docker compose -f docker-compose.prod.yml exec frontend nginx -t
```

### Performance

```bash
# Voir l'utilisation des ressources
docker stats

# Nettoyer tout Docker (attention!)
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Problème : Port 3000 déjà utilisé

**Solution** :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou changer le port dans docker-compose.yml
ports:
  - "8080:3000"  # Utilise le port 8080 au lieu de 3000
```

### Problème : Hot reload ne fonctionne pas

**Solution** :
```bash
# Vérifier que les volumes sont bien montés
docker compose exec frontend ls -la /app/src

# Redémarrer avec un rebuild
docker compose down
docker compose up -d --build
```

### Problème : Erreur de permissions (Linux/Mac)

**Solution** :
```bash
# Fixer les permissions du dossier node_modules
docker compose exec frontend chown -R nodejs:nodejs /app/node_modules
```

### Problème : Build échoue avec erreur mémoire

**Solution** :
```bash
# Augmenter la mémoire Docker dans Docker Desktop
# Settings > Resources > Memory > 4GB minimum

# Ou utiliser moins de workers
docker compose build --build-arg NODE_OPTIONS="--max-old-space-size=2048"
```

### Problème : Le frontend ne se connecte pas à Supabase

**Solution** :
1. Vérifier que les variables VITE_* sont bien définies dans `.env`
2. Reconstruire l'image après modification des variables
3. Vérifier dans le navigateur : `console.log(import.meta.env)`

### Problème : nginx 404 sur les routes React (production)

**Solution** :  
C'est déjà géré dans `nginx.conf` avec `try_files $uri $uri/ /index.html;`

Si le problème persiste :
```bash
# Vérifier la configuration nginx
docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/nginx.conf

# Recharger nginx
docker compose -f docker-compose.prod.yml exec frontend nginx -s reload
```

---

## ⚡ Optimisations

### Cache Docker Layers

Les Dockerfiles sont optimisés pour maximiser le cache :
1. Copie de `package.json` en premier
2. `npm ci` avant de copier le code
3. Build en dernier

### Volume pour node_modules

En développement, `node_modules` est dans un volume nommé pour :
- Éviter les conflits Windows/Linux
- Améliorer les performances I/O
- Persister les installations

### Multi-stage Build

Le Dockerfile de production utilise 2 stages :
- **Stage 1** : Build de l'app (node:20-alpine)
- **Stage 2** : Runtime avec Nginx (nginx:1.25-alpine)

Résultat : Image finale de ~40 MB au lieu de ~500 MB

---

## 📊 Monitoring

### Healthcheck

Les conteneurs ont des healthchecks configurés :

```bash
# Vérifier l'état de santé
docker ps --format "table {{.Names}}\t{{.Status}}"

# Détails du healthcheck
docker inspect --format='{{json .State.Health}}' careway-frontend-prod | jq
```

### Logs

```bash
# Logs avec rotation automatique (production)
# Max 10MB par fichier, 3 fichiers max

# Voir les logs Nginx
docker compose -f docker-compose.prod.yml exec frontend tail -f /var/log/nginx/access.log
docker compose -f docker-compose.prod.yml exec frontend tail -f /var/log/nginx/error.log
```

---

## 🚢 Déploiement

### Sur un serveur

```bash
# 1. Cloner le repo
git clone <votre-repo> careway
cd careway

# 2. Configurer les variables
cp .env.example .env
nano .env

# 3. Build et démarrer
docker compose -f docker-compose.prod.yml up -d --build

# 4. Vérifier
curl http://localhost/health
```

### Avec un reverse proxy (Traefik/Nginx)

Modifiez `docker-compose.prod.yml` pour ajouter les labels :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.careway.rule=Host(`careway.example.com`)"
  - "traefik.http.services.careway.loadbalancer.server.port=80"
```

---

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html)
- [Nginx SPA Configuration](https://nginx.org/en/docs/)
- [Alpine Linux](https://alpinelinux.org/)

---

## 👥 Support

Pour toute question :
1. Consultez d'abord la section [Troubleshooting](#troubleshooting)
2. Vérifiez les logs : `docker compose logs -f`
3. Contactez l'équipe CareWay

---

**Dernière mise à jour** : Février 2026  
**Version** : 1.0.0  
**Maintenu par** : CareWay Team
