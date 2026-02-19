# 🎥 Configuration Visio WebRTC

## Vue d'ensemble

Le composant `VisioModal` utilise WebRTC pour les appels vidéo peer-to-peer entre l'infirmière et le patient. Un serveur WebSocket gère la signalisation.

## ⚡ Démarrage rapide

### Étape 1 : Lancer le serveur WebSocket

```bash
cd prototype-visio-main/prototype-visio-main/visio-server
npm install
node server.js
```

**Résultat attendu:**
```
Serveur WebSocket lancé sur port 8080
```

### Étape 2 : Lancer CareWay

Dans un autre terminal:

```bash
npm run dev
```

**Résultat attendu:**
```
Application disponible sur http://localhost:3000
```

### Étape 3 : Tester

1. Allez sur http://localhost:3000
2. Accédez au NurseDashboard
3. Cliquez sur **"Live visio connect"** d'un rendez-vous

## 🏗️ Architecture

```
Navigateur (http://localhost:3000)
     ↓
Proxy Vite: /ws → ws://localhost:8080
     ↓
Serveur WebSocket (port 8080)
     ├→ Signalisation SDP
     ├→ ICE Candidates
     └→ Messages Chat

Connexion WebRTC P2P directe
(flux vidéo/audio)
```

## 🐳 Production (Docker)

Ajoutez à votre `docker-compose.yml`:

```yaml
visio-server:
  build:
    context: ./prototype-visio-main/prototype-visio-main/visio-server
  container_name: careway-visio-server
  ports:
    - "8080:8080"
  environment:
    - NODE_ENV=production
  networks:
    - careway-network
  restart: unless-stopped
```

## 🔧 Configuration Vite

Le proxy WebSocket est configuré dans `vite.config.ts`:

```typescript
proxy: {
  '/ws': {
    target: 'ws://localhost:8080',
    ws: true,
    rewrite: (path) => path.replace(/^\/ws/, '/ws'),
  },
}
```

Cela redirige toutes les requêtes `/ws` vers le serveur WebSocket.

## ❌ Dépannage

### Erreur: "Erreur de connexion"

**Cause:** Le serveur WebSocket n'est pas lancé

```bash
# 1. Vérifiez que le serveur est lancé sur le port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Mac/Linux

# 2. Sinon, lancez-le:
cd prototype-visio-main/prototype-visio-main/visio-server
node server.js
```

### Erreur: "Permission refusée pour caméra/micro"

- Vérifiez les permissions du navigateur
- En production, utilisez HTTPS (WebRTC l'exige)
- Vérifiez les permissions système de votre OS

### Pas de vidéo

1. Vérifiez que caméra/micro fonctionne
2. Testez dans un autre navigateur
3. Vérifiez que le firewall n'est pas bloquant
4. Vérifiez les logs (F12 → Console)

## 📋 Fichiers

- **[vite.config.ts](vite.config.ts)** - Configuration proxy
- **[src/components/VisioModal.tsx](src/components/VisioModal.tsx)** - Composant visio
- **[src/components/NurseDashboard.tsx](src/components/NurseDashboard.tsx)** - Intégration
- **[prototype-visio-main/](prototype-visio-main/prototype-visio-main/)** - Serveur + code prototype

## ✨ Fonctionnalités

- ✅ Vidéo bidirectionnelle (WebRTC P2P)
- ✅ Chat en direct via WebSocket
- ✅ Contrôle caméra/micro
- ✅ Gestion d'erreurs détaillée
- ✅ Interface responsive
