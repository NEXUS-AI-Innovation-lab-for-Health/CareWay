# 🚀 Guide de déploiement CareWay - Docker

Guide complet pour déployer CareWay sur différentes plateformes.

## 📋 Table des matières

- [Déploiement local](#déploiement-local)
- [VPS / Serveur dédié](#vps--serveur-dédié)
- [AWS](#aws-elastic-container-service)
- [Azure](#azure-container-instances)
- [Google Cloud](#google-cloud-run)
- [DigitalOcean](#digitalocean-app-platform)
- [Render](#render)
- [Fly.io](#flyio)

---

## 🏠 Déploiement local

Voir [README-DOCKER.md](README-DOCKER.md) pour les instructions complètes.

---

## 🖥️ VPS / Serveur dédié

### Prérequis

- Ubuntu 22.04+ / Debian 11+
- Docker & Docker Compose installés
- Nom de domaine pointant vers le serveur (optionnel)

### Installation

```bash
# 1. Se connecter au serveur
ssh user@votre-serveur.com

# 2. Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Installer Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 4. Cloner le projet
git clone https://github.com/votre-org/careway.git
cd careway

# 5. Configurer les variables
cp .env.example .env
nano .env  # Éditer avec vos valeurs Supabase

# 6. Démarrer en production
docker compose -f docker-compose.prod.yml up -d

# 7. Vérifier
curl http://localhost/health
```

### Configuration Nginx reverse proxy (optionnel)

```nginx
# /etc/nginx/sites-available/careway
server {
    listen 80;
    server_name careway.example.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d careway.example.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## ☁️ AWS (Elastic Container Service)

### Via ECS Fargate

**1. Créer un repository ECR**

```bash
# Créer le repository
aws ecr create-repository --repository-name careway

# Se connecter à ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com

# Builder et pousser l'image
docker build -t careway .
docker tag careway:latest ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/careway:latest
docker push ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/careway:latest
```

**2. Créer une task definition**

```json
{
  "family": "careway-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "careway-frontend",
      "image": "ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/careway:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VITE_SUPABASE_URL",
          "value": "https://xxx.supabase.co"
        }
      ],
      "essential": true
    }
  ]
}
```

**3. Créer le service ECS**

```bash
aws ecs create-service \
  --cluster careway-cluster \
  --service-name careway-service \
  --task-definition careway-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Coût estimé AWS

- ECS Fargate (0.25 vCPU, 0.5 GB) : ~15€/mois
- Application Load Balancer : ~20€/mois
- ECR storage : ~1€/mois
- **Total : ~36€/mois**

---

## 🔷 Azure (Container Instances)

### Déploiement via Azure CLI

```bash
# 1. Créer un groupe de ressources
az group create --name careway-rg --location westeurope

# 2. Créer un container registry
az acr create --resource-group careway-rg --name carewayregistry --sku Basic

# 3. Builder et pousser l'image
az acr build --registry carewayregistry --image careway:latest .

# 4. Déployer le container
az container create \
  --resource-group careway-rg \
  --name careway-frontend \
  --image carewayregistry.azurecr.io/careway:latest \
  --dns-name-label careway-app \
  --ports 80 \
  --environment-variables \
    VITE_SUPABASE_URL=https://xxx.supabase.co \
    VITE_SUPABASE_ANON_KEY=xxx \
  --cpu 1 \
  --memory 1
```

### Coût estimé Azure

- Azure Container Instances (1 vCPU, 1 GB) : ~30€/mois
- Container Registry : ~5€/mois
- **Total : ~35€/mois**

---

## 🌐 Google Cloud (Cloud Run)

### Déploiement

```bash
# 1. Configurer gcloud
gcloud config set project VOTRE_PROJECT_ID

# 2. Activer les APIs nécessaires
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Builder et déployer
gcloud builds submit --tag gcr.io/VOTRE_PROJECT_ID/careway

gcloud run deploy careway \
  --image gcr.io/VOTRE_PROJECT_ID/careway \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 80 \
  --set-env-vars "VITE_SUPABASE_URL=https://xxx.supabase.co,VITE_SUPABASE_ANON_KEY=xxx"
```

### Avantages Cloud Run

✅ Pay-per-use (gratuit si peu de trafic)  
✅ Auto-scaling  
✅ HTTPS automatique  
✅ Déploiement en 1 commande  

### Coût estimé GCP

- Cloud Run : 0€ si < 2M requêtes/mois (gratuit)
- Sinon : ~5-10€/mois pour trafic modéré

---

## 🌊 DigitalOcean (App Platform)

### Via l'interface web

1. Connecter votre repository GitHub
2. Choisir "Docker" comme type d'application
3. Configurer :
   - **Dockerfile path** : `Dockerfile`
   - **HTTP port** : `80`
   - **Environment variables** : Ajouter `VITE_SUPABASE_*`
4. Déployer

### Via doctl CLI

```bash
# Installer doctl
brew install doctl  # Mac
# ou télécharger depuis https://github.com/digitalocean/doctl

# Authentification
doctl auth init

# Créer l'app
doctl apps create --spec app.yaml
```

**app.yaml** :
```yaml
name: careway
services:
  - name: frontend
    dockerfile_path: Dockerfile
    github:
      repo: votre-org/careway
      branch: main
    http_port: 80
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: VITE_SUPABASE_URL
        value: https://xxx.supabase.co
      - key: VITE_SUPABASE_ANON_KEY
        value: xxx
```

### Coût estimé DigitalOcean

- App Platform (Basic) : ~5€/mois
- Domain + SSL : Inclus
- **Total : ~5€/mois** ✅ Le moins cher !

---

## 🎨 Render

### Déploiement automatique depuis GitHub

1. Se connecter sur [Render.com](https://render.com)
2. "New +" → "Web Service"
3. Connecter votre repo GitHub
4. Configuration :
   - **Environment** : Docker
   - **Dockerfile Path** : `Dockerfile`
   - **Plan** : Free ou Starter ($7/mois)
5. Ajouter les variables d'environnement
6. Déployer

### render.yaml (Infrastructure as Code)

```yaml
services:
  - type: web
    name: careway-frontend
    env: docker
    dockerfilePath: ./Dockerfile
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: VITE_SUPABASE_URL
        value: https://xxx.supabase.co
      - key: VITE_SUPABASE_ANON_KEY
        value: xxx
```

### Avantages Render

✅ Déploiement auto depuis GitHub  
✅ SSL gratuit  
✅ Plan gratuit disponible (avec limitations)  
✅ Très simple à utiliser  

### Coût estimé Render

- Free plan : 0€ (avec limitations)
- Starter : ~7$/mois
- **Total : 0-7€/mois**

---

## 🚀 Fly.io

### Installation

```bash
# Installer flyctl
curl -L https://fly.io/install.sh | sh

# Se connecter
flyctl auth login
```

### fly.toml

Créer un fichier `fly.toml` :

```toml
app = "careway"
primary_region = "cdg"  # Paris

[build]
  dockerfile = "Dockerfile"

[env]
  VITE_SUPABASE_URL = "https://xxx.supabase.co"

[http_service]
  internal_port = 80
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Déploiement

```bash
# Initialiser
flyctl launch --no-deploy

# Ajouter les secrets
flyctl secrets set VITE_SUPABASE_ANON_KEY=xxx

# Déployer
flyctl deploy

# Ouvrir dans le navigateur
flyctl open
```

### Avantages Fly.io

✅ Auto-scaling à 0 (économies)  
✅ Multi-région facile  
✅ HTTPS automatique  
✅ Plan gratuit généreux  

### Coût estimé Fly.io

- Free tier : 0€ (3 VM basiques gratuites)
- Ensuite : ~5€/mois
- **Total : 0-5€/mois**

---

## 🔄 CI/CD avec GitHub Actions

Le fichier [.github/workflows/docker.yml](.github/workflows/docker.yml) est déjà configuré pour :

✅ Builder l'image Docker  
✅ Tester le healthcheck  
✅ Scanner les vulnérabilités (Trivy)  
✅ Pousser vers GitHub Container Registry  

### Activer le workflow

1. Aller dans **Settings → Actions → General**
2. Activer "Read and write permissions"
3. Commit et push → Le workflow se lance automatiquement

---

## 📊 Comparatif des plateformes

| Plateforme | Coût/mois | Complexité | Auto-scaling | SSL gratuit | Recommandation |
|------------|-----------|------------|--------------|-------------|----------------|
| **Fly.io** | 0-5€ | ⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐⭐ Meilleur rapport qualité/prix |
| **Render** | 0-7€ | ⭐ | ✅ | ✅ | ⭐⭐⭐⭐⭐ Le plus simple |
| **DigitalOcean** | 5€ | ⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐ Bon pour production |
| **Google Cloud Run** | 0-10€ | ⭐⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐ Pay-per-use |
| **AWS ECS** | 36€ | ⭐⭐⭐⭐ | ✅ | ❌ | ⭐⭐⭐ Pour grandes apps |
| **Azure ACI** | 35€ | ⭐⭐⭐ | ❌ | ❌ | ⭐⭐⭐ Si déjà sur Azure |
| **VPS** | 5-20€ | ⭐⭐⭐⭐⭐ | ❌ | ❌ | ⭐⭐ Contrôle total |

---

## 🔒 Checklist de sécurité avant déploiement

- [ ] Variables d'environnement configurées (pas en dur dans le code)
- [ ] Clés Supabase correctes (production)
- [ ] HTTPS activé
- [ ] Firewall configuré (si VPS)
- [ ] Backups configurés
- [ ] Monitoring activé
- [ ] Logs centralisés
- [ ] Rate limiting (si API)

---

## 📚 Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Vite Production Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Dernière mise à jour** : Février 2026  
**Maintenu par** : CareWay Team
