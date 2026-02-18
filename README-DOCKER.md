# 🐳 CareWay - Docker pour le Développement

Configuration Docker optimisée pour le développement local avec **Supabase** intégré.

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Démarrage rapide](#-démarrage-rapide)
- [Architecture](#-architecture)
- [Services disponibles](#-services-disponibles)
- [Commandes utiles](#-commandes-utiles)
- [Volumes et cache](#-volumes-et-cache)
- [Troubleshooting](#-troubleshooting)

---

## 🔧 Prérequis

- **Docker Desktop** : Version 24.0+
- **Docker Compose** : Version 2.20+
- **WSL2** (Windows) recommandé pour de meilleures performances

### Vérifier l'installation

```powershell
docker --version
docker compose version
```

---

## 🚀 Démarrage rapide

### 1. Lancer l'environnement

```powershell
# Avec le script helper (recommandé)
.\docker-helper.ps1 start

# OU directement avec Docker Compose
docker compose up -d
```

### 2. Accéder aux services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Application React + Vite (hot reload) |
| **Supabase DB** | localhost:5432 | PostgreSQL 15 |
| **Supabase API** | http://localhost:54321 | API Supabase locale |

### 3. Logs en temps réel

```powershell
.\docker-helper.ps1 logs

# OU
docker compose logs -f
```

### 4. Arrêter l'environnement

```powershell
.\docker-helper.ps1 stop

# OU
docker compose down
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Frontend Container (Node 20 Alpine)                 │
│ ├─ Vite Dev Server (Port 3000)                      │
│ ├─ Hot Module Replacement (HMR)                     │
│ ├─ Code source monté en volume                      │
│ └─ node_modules en cache anonyme                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Container (PostgreSQL 15)                  │
│ ├─ Port 5432 (PostgreSQL)                           │
│ ├─ Port 54321 (API Supabase)                        │
│ └─ Données persistées dans volume Docker            │
└─────────────────────────────────────────────────────┘
```

### Fichiers Docker

```
CareWay/
├── Dockerfile.dev              # Image de développement
├── docker-compose.yml          # Orchestration des services
├── docker-helper.ps1           # Script PowerShell d'aide
├── .dockerignore               # Fichiers exclus du build
└── .npmrc                      # Configuration npm (registre JSR)
```

---

## 🎯 Services disponibles

### Frontend (Vite + React)

- **Image** : `node:20-alpine` (~120 MB)
- **Port** : 3000
- **Hot Reload** : ✅ Activé
- **Source Maps** : ✅ Activés
- **Optimisations** : Cache npm optimisé

**Volumes montés :**
- `./src` → Code source (modifications instantanées)
- `./public` → Assets statiques
- `/app/node_modules` → Cache anonyme (performance++)

### Supabase (PostgreSQL)

- **Image** : `supabase/postgres:15`
- **Port PostgreSQL** : 5432
- **Port API** : 54321
- **Base de données** : `careway`
- **Utilisateur** : `postgres`
- **Scripts d'init** : `./src/scripts/*.sql`

**Volume persisté :**
- `supabase_data` → Données PostgreSQL

---

## ⚡ Commandes utiles

### Script PowerShell (Recommandé)

```powershell
# Démarrer
.\docker-helper.ps1 start

# Arrêter
.\docker-helper.ps1 stop

# Redémarrer
.\docker-helper.ps1 restart

# Voir les logs
.\docker-helper.ps1 logs

# Shell frontend
.\docker-helper.ps1 shell

# Shell PostgreSQL
.\docker-helper.ps1 db-shell

# Statut des conteneurs
.\docker-helper.ps1 status

# Vérifier la santé
.\docker-helper.ps1 health

# Nettoyer (volumes inclus)
.\docker-helper.ps1 clean

# Aide
.\docker-helper.ps1 help
```

### Docker Compose directement

```powershell
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Rebuild
docker compose up -d --build

# Logs
docker compose logs -f frontend
docker compose logs -f supabase

# Shell
docker compose exec frontend sh
docker compose exec supabase psql -U postgres -d careway

# Statut
docker compose ps
```

---

## 💾 Volumes et cache

### Cache npm optimisé

Le fichier `docker-compose.yml` utilise un **volume anonyme** pour `node_modules` :

```yaml
volumes:
  - /app/node_modules  # Cache anonyme (plus rapide)
```

**Avantages :**
- ✅ Installation npm **1 seule fois**
- ✅ Pas de conflit avec node_modules local
- ✅ Performance maximale

### Persistance des données

```powershell
# Lister les volumes
docker volume ls

# Supprimer les volumes (ATTENTION: perte de données!)
docker compose down -v
```

---

## 🔍 Troubleshooting

### Le frontend ne démarre pas

```powershell
# Vérifier les logs
docker compose logs frontend

# Rebuild complet
docker compose down
docker compose up -d --build
```

### Problème avec les packages JSR

Le fichier `.npmrc` configure automatiquement le registre JSR :

```properties
@jsr:registry=https://npm.jsr.io
```

Si problème persiste :

```powershell
docker compose exec frontend npm config set @jsr:registry https://npm.jsr.io
docker compose restart frontend
```

### Port déjà utilisé

Modifier les ports dans `docker-compose.yml` :

```yaml
ports:
  - "3001:3000"  # Frontend sur 3001 au lieu de 3000
```

### Supabase ne démarre pas

```powershell
# Vérifier les logs
docker compose logs supabase

# Vérifier la santé
docker compose ps

# Recréer le volume
docker compose down -v
docker compose up -d
```

### Hot reload ne fonctionne pas

```powershell
# Vérifier que les volumes sont bien montés
docker compose exec frontend ls -la /app/src

# Redémarrer le conteneur
docker compose restart frontend
```

### Nettoyer complètement

```powershell
# Supprimer conteneurs, volumes et images
docker compose down -v --rmi all

# Rebuild from scratch
docker compose up -d --build
```

---

## 🔐 Variables d'environnement

Les variables sont configurées dans `docker-compose.yml` :

```yaml
environment:
  - NODE_ENV=development
  - VITE_SUPABASE_URL=http://localhost:54321
  - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Pour personnaliser, créer un fichier `.env` :

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-key
POSTGRES_PASSWORD=your-password
```

---

## 📊 Performances

### Temps de démarrage

| Action | Temps (première fois) | Temps (avec cache) |
|--------|----------------------|-------------------|
| Build image | ~30-40s | ~2-5s |
| Install npm | ~25-30s | 0s (cache) |
| Start Vite | ~5-10s | ~5-10s |
| **Total** | **~60-80s** | **~10-15s** |

### Utilisation des ressources

| Service | CPU | RAM |
|---------|-----|-----|
| Frontend | ~10-20% | ~200-300 MB |
| Supabase | ~5-10% | ~100-150 MB |
| **Total** | **~15-30%** | **~300-450 MB** |

---

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Vite](https://vitejs.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide Docker Compose](https://docs.docker.com/compose/)

---

## 💡 Bonnes pratiques

✅ **Utiliser le script PowerShell** pour les commandes courantes  
✅ **Ne pas commit** le dossier `node_modules`  
✅ **Sauvegarder** les migrations SQL dans `./src/scripts`  
✅ **Vérifier** les logs régulièrement  
✅ **Nettoyer** les volumes inutilisés  

---

**Développé avec ❤️ pour CareWay**
