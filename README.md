
# 🏥 CareWay

**CareWay** est une plateforme moderne de gestion des soins à domicile qui connecte les patients avec des infirmiers qualifiés. Développée dans le cadre du projet SAE#16, cette application offre une solution complète pour la planification, la gestion et le suivi des rendez-vous de soins infirmiers.

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-blue.svg)](https://tailwindcss.com/)

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Installation avec Docker (Recommandé)](#-installation-avec-docker-recommandé)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Scripts disponibles](#-scripts-disponibles)
- [Contribution](#-contribution)
- [Licence](#-licence)

## 🎯 Aperçu

CareWay est une application web full-stack qui facilite la mise en relation entre patients et infirmiers à domicile. Elle permet aux patients de rechercher des infirmiers disponibles, de réserver des rendez-vous et de gérer leur profil médical, tandis que les infirmiers peuvent gérer leur planning, leurs indisponibilités et leurs interventions.

**Design original** : [Figma - SAE#16](https://www.figma.com/design/lPR6wFrFEw5AjNnVOLpz46/SAE-16---FrontEnd---DW)

## ✨ Fonctionnalités

### Pour les Patients
- 🔍 **Recherche d'infirmiers** : Trouvez des infirmiers qualifiés près de chez vous
- 📅 **Réservation de rendez-vous** : Planifiez facilement vos soins à domicile
- 🗺️ **Carte interactive** : Visualisez la localisation des infirmiers disponibles
- 📱 **Profil médical** : Gérez vos informations médicales en toute sécurité
- 📄 **Gestion de documents** : Téléchargez et consultez vos documents médicaux
- 🌐 **Multilingue** : Interface disponible en français et anglais
- 🔐 **FranceConnect** : Authentification sécurisée via FranceConnect

### Pour les Infirmiers
- 📊 **Dashboard personnalisé** : Vue d'ensemble de vos rendez-vous
- ⏰ **Gestion des disponibilités** : Définissez vos horaires et indisponibilités
- 🚗 **Optimisation des trajets** : Planification intelligente de vos déplacements avec IA
- 👤 **Profil professionnel** : Gérez vos informations et compétences
- 📈 **Statistiques** : Suivez votre activité et vos interventions
- 🔔 **Notifications** : Recevez des alertes pour vos rendez-vous

### Fonctionnalités Communes
- 🔒 **Authentification sécurisée** : Système d'authentification robuste
- 📱 **Interface responsive** : Adaptée à tous les appareils (mobile, tablette, desktop)
- ♿ **Accessibilité** : Interface accessible et inclusive
- 🎨 **Design moderne** : Interface utilisateur élégante et intuitive

## 🛠️ Technologies

### Frontend
- **React 18** - Bibliothèque UI moderne
- **TypeScript** - Typage statique pour plus de robustesse
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Composants UI réutilisables
- **Lucide React** - Icônes modernes
- **React Router** - Gestion du routing
- **React Hook Form** - Gestion des formulaires
- **Recharts** - Visualisation de données

### Backend & Services
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication
  - Storage
  - Real-time subscriptions
- **OpenAI API** - Optimisation des trajets avec IA

### Maps & Géolocalisation
- **Leaflet** - Cartes interactives
- **React Leaflet** - Intégration React pour Leaflet

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **npm** ou **yarn** - Gestionnaire de paquets
- **Git** - Contrôle de version
- **Un compte Supabase** - [Créer un compte](https://supabase.com/)

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/NEXUS-AI-Innovation-lab-for-Health/CareWay.git
cd CareWay
```

### 2. Installer les dépendances

```bash
npm install
```

ou avec yarn :

```bash
yarn install
```

### 3. Installer les types TypeScript pour React

```bash
npm install --save-dev @types/react @types/react-dom
```

Cette étape est **essentielle** pour que TypeScript reconnaisse correctement la syntaxe JSX et les composants React.

## ⚙️ Configuration

### 1. Configuration Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com/)
2. Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme_supabase
VITE_OPENAI_API_KEY=votre_clé_api_openai (optionnel)
```

### 2. Initialisation de la base de données

Exécutez les scripts SQL dans l'ordre suivant dans l'éditeur SQL de Supabase :

1. **Structure de base** : Consultez [DATABASE_STRUCTURE.md](src/DATABASE_STRUCTURE.md)
2. **Types de soins** : Exécutez `src/scripts/init-care-types.sql`
3. **Champs médicaux patients** : Exécutez `src/scripts/add-patient-medical-fields.sql`
4. **Données de démonstration** (optionnel) : Exécutez `src/demo-data-script.sql`

### 3. Configuration du Storage Supabase

1. Dans votre projet Supabase, allez dans **Storage**
2. Créez un bucket nommé `patient-documents`
3. Configurez les politiques d'accès (voir [STOCKAGE_DOCUMENTS_GUIDE.md](src/STOCKAGE_DOCUMENTS_GUIDE.md))

## 🐳 Installation avec Docker (Recommandé)

### Prérequis Docker

- **Docker Desktop** (version 24.0 ou supérieure) - [Télécharger](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (version 2.20 ou supérieure) - Inclus avec Docker Desktop
- **WSL2** (pour Windows) - [Installer WSL2](https://docs.microsoft.com/fr-fr/windows/wsl/install)

### 1. Cloner le repository

```bash
git clone https://github.com/NEXUS-AI-Innovation-lab-for-Health/CareWay.git
cd CareWay
```

### 2. Configuration automatique des fichiers d'environnement

Pour les nouveaux membres de l'équipe ou lors de la première installation :

```powershell
.\setup.ps1
```

Ce script va automatiquement :
- ✅ Créer le fichier `docker/.env` avec les clés JWT Supabase
- ✅ Créer le fichier `.env.development` pour l'API Gateway
- ✅ Vérifier que tous les fichiers nécessaires existent

**Configuration manuelle (alternative)** :

Si vous préférez configurer manuellement :

```powershell
# Créer le fichier docker/.env
Copy-Item .env.example docker/.env

# Créer le fichier .env.development
@"
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
"@ | Out-File -FilePath .env.development -Encoding utf8
```

### 3. Démarrer l'environnement Docker

```bash
npm run docker:start
```

Cette commande démarre **11 services** :

- 🌐 **Frontend React** : http://localhost:3000
- 🗄️ **PostgreSQL** : localhost:54322
- 🎨 **Supabase Studio** : http://localhost:54323
- 🔐 **Auth (GoTrue)** : localhost:54324
- 📡 **REST API (PostgREST)** : localhost:54321
- ⚡ **Realtime** : localhost:54325
- 📦 **Storage API** : localhost:54326
- 🔧 **Postgres Meta** : localhost:54327
- 🚪 **Kong Gateway** : localhost:8000
- 📧 **Inbucket (Email testing)** : http://localhost:54324

### 4. Initialiser la base de données

Une fois les conteneurs démarrés, accédez à Supabase Studio sur http://localhost:54323 et exécutez les scripts SQL :

1. **Structure de base** : Consultez [DATABASE_STRUCTURE.md](src/DATABASE_STRUCTURE.md)
2. **Types de soins** : `src/scripts/init-care-types.sql`
3. **Champs médicaux** : `src/scripts/add-patient-medical-fields.sql`
4. **Données de démonstration** (optionnel) : `src/demo-data-script.sql`

### Commandes Docker utiles

```bash
# Démarrer les conteneurs
npm run docker:start

# Arrêter les conteneurs
npm run docker:stop

# Voir les logs
npm run docker:logs

# Nettoyer complètement (attention : supprime les volumes)
npm run docker:clean

# Se connecter au conteneur frontend
docker exec -it careway-frontend sh

# Se connecter à PostgreSQL
docker exec -it careway-db psql -U postgres
```

### Avantages de Docker

✅ **Installation rapide** : Tout est automatisé, pas besoin de configurer Supabase manuellement  
✅ **Environnement isolé** : Pas de conflits avec d'autres projets  
✅ **Portable** : Fonctionne à l'identique sur tous les systèmes  
✅ **Hot reload** : Les modifications du code sont immédiatement visibles  
✅ **Stack Supabase complète** : Auth, Storage, Realtime, Studio inclus  

### Résolution des problèmes

**Port 3000 déjà utilisé** :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Modifier le port dans docker-compose.yml
ports:
  - "3001:3000"  # Utiliser le port 3001 au lieu de 3000
```

**Les modifications ne sont pas prises en compte** :
```bash
# Reconstruire les conteneurs
docker-compose -f docker/docker-compose.yml build --no-cache
npm run docker:start
```

**Problèmes de volumes** :
```bash
# Nettoyer et redémarrer
npm run docker:clean
npm run docker:start
```

## 🎮 Utilisation

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build pour la production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`

### Prévisualiser le build de production

```bash
npm run preview
```

### Linter le code

```bash
npm run lint
```

## 🏗️ Architecture

```
CareWay/
├── src/
│   ├── components/          # Composants React
│   │   ├── ui/             # Composants UI réutilisables (shadcn/ui)
│   │   ├── figma/          # Composants spécifiques au design Figma
│   │   ├── Dashboard.tsx   # Tableau de bord principal
│   │   ├── PatientDashboard.tsx
│   │   ├── NurseDashboard.tsx
│   │   └── ...
│   ├── services/           # Services et API
│   │   └── api.tsx        # Configuration API Supabase
│   ├── constants/          # Constantes de l'application
│   │   └── careTypes.ts   # Types de soins
│   ├── utils/             # Utilitaires
│   │   └── supabase/      # Configuration Supabase
│   ├── styles/            # Styles globaux
│   │   └── globals.css
│   ├── scripts/           # Scripts SQL
│   ├── guidelines/        # Directives du projet
│   ├── App.tsx            # Composant racine
│   └── main.tsx           # Point d'entrée
├── public/                # Fichiers statiques
├── index.html            # Template HTML
├── vite.config.ts        # Configuration Vite
├── tsconfig.json         # Configuration TypeScript
├── tailwind.config.js    # Configuration Tailwind CSS
└── package.json          # Dépendances npm
```

## 📚 Documentation

Pour plus d'informations détaillées, consultez :

- [🚀 Guide de démarrage rapide](src/QUICK_START_GUIDE.md)
- [📖 Documentation complète du projet](src/PROJECT_DOCUMENTATION.md)
- [🗄️ Structure de la base de données](src/DATABASE_STRUCTURE.md)
- [🔧 Guide de migration SQL](src/MIGRATION_SQL_GUIDE.md)
- [🔐 Guide de correction du login](src/FIX_LOGIN_GUIDE.md)
- [📄 Guide de stockage des documents](src/STOCKAGE_DOCUMENTS_GUIDE.md)
- [🏥 Guide d'ajout de champs médicaux](src/GUIDE_AJOUT_CHAMPS_MEDICAUX.md)
- [📝 Résumé de l'implémentation finale](src/FINAL_IMPLEMENTATION_SUMMARY.md)
- [🎓 Présentation bilan du projet](src/PRESENTATION_BILAN_PROJET.md)
- [📋 Changelog migration SQL](src/CHANGELOG_SQL_MIGRATION.md)
- [🙏 Attributions](src/Attributions.md)

## 📜 Scripts disponibles

### Scripts de développement

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement (sans Docker) |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |

### Scripts Docker

| Script | Description |
|--------|-------------|
| `npm run docker:start` | Démarre tous les conteneurs Docker (stack Supabase complète) |
| `npm run docker:stop` | Arrête tous les conteneurs Docker |
| `npm run docker:logs` | Affiche les logs de tous les conteneurs |
| `npm run docker:clean` | ⚠️ Arrête et supprime tous les conteneurs et volumes |

## 👥 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Directives de développement

Consultez le fichier [Guidelines.md](src/guidelines/Guidelines.md) pour les bonnes pratiques de développement.

## 🏆 Équipe

Développé par **NEXUS AI Innovation Lab for Health**

## 📄 Licence

Ce projet a été développé dans le cadre du projet SAE#16 - FrontEnd - DW.

## 🆘 Support

Pour toute question ou problème :
- Consultez la [documentation](src/PROJECT_DOCUMENTATION.md)
- Ouvrez une [issue](https://github.com/NEXUS-AI-Innovation-lab-for-Health/CareWay/issues)

---