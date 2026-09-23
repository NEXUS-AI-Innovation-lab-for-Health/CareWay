# 🚀 Utilisation de la Visio - Guide simple

## ✨ C'est automatique maintenant!

Vous n'avez plus besoin de lancer deux terminaux différents. Tout se fait en une commande.

## 🎯 Démarrage rapide

### 1️⃣ Installer les dépendances (première fois)
```bash
npm install
```

### 2️⃣ Lancer tout
```bash
npm run dev
```

Vous verrez deux services démarrer:
```
➜  Local:   http://localhost:3000/
📡 Serveur WebSocket lancé sur port 8080
```

### 3️⃣ Utiliser la visio
1. Ouvrez http://localhost:3000
2. Allez au **NurseDashboard**
3. Cliquez sur **"Live visio connect"** d'un rendez-vous
4. C'est prêt!

## 📚 Détails techniques

### Ce qui se passe derrière les coulisses

```
npm run dev
    ↓
Launch deux services en parallèle:
    ├→ Serveur WebSocket (visio-server.js sur port 8080)
    └→ Application Vite (sur port 3000)
    
Proxy Vite (vite.config.ts):
    /ws → ws://localhost:8080/ws
```

### Fichiers importants
- **[visio-server.js](visio-server.js)** - Serveur WebSocket intégré
- **[src/components/VisioModal.tsx](src/components/VisioModal.tsx)** - Interface visio
- **[vite.config.ts](vite.config.ts)** - Configuration proxy
- **[package.json](package.json)** - Scripts npm

## 🔧 Scripts npm disponibles

```bash
npm run dev           # 👈 Lancer tout (serveur + app)
npm run dev:app      # Lancer seulement Vite
npm run dev:server   # Lancer seulement le serveur WebSocket
npm run build        # Compiler pour production
```

## ❌ Dépannage

**Problème: "Erreur de connexion"**
- ✅ Assurez-vous d'avoir lancé `npm run dev` (pas `npm run dev:app`)
- ✅ Vérifiez les logs pour des erreurs

**Problème: "Port 3000 ou 8080 déjà utilisé"**
```bash
# Windows
netstat -ano | findstr :3000    # ou :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000  # ou :8080
kill -9 <PID>
```

**Problème: "Pas de caméra/micro"**
- Vérifiez les permissions du navigateur
- Essayez un autre navigateur
- Redémarrez votre caméra/micro

## 🛠️ Scripts autorisés

Les autres scripts du projet continuent de fonctionner normalement:
```bash
npm run docker:start   # Démarrer les conteneurs Docker
npm run docker:stop    # Arrêter les conteneurs
npm run lint           # Vérifier le code
```

## 💡 Astuce

Si vous voulez développer sans la visio (pour aller plus vite):
```bash
npm run dev:app
```

Cela lance seulement Vite sans le serveur WebSocket.
