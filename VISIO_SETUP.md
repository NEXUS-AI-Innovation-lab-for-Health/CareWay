# Intégration Visio WebRTC

## Configuration

Le composant `VisioModal` dans le NurseDashboard utilise WebRTC pour les appels vidéo en direct. Le serveur de signalisation WebSocket doit être accessible pour que cela fonctionne.

### Prérequis

1. **Serveur WebSocket de signalisation** (`visio-server/`)
   - Port : `8080`
   - Doit être accessible depuis votre application
   - Le composant VisioModal se connecte à `ws://localhost:8080/ws` ou `wss://localhost:8080/ws`

### Configuration en développement local

```bash
# Terminal 1 - Démarrer le serveur de signalisation
cd prototype-visio-main/prototype-visio-main/visio-server
npm install
node server.js
# Écoute sur ws://localhost:8080
```

```bash
# Terminal 2 - Démarrer l'application CareWay
npm run dev
# Application sur http://localhost:5173
```

### Configuration en production (Docker)

Le `docker-compose.yml` de CareWay doit inclure le service du serveur WebSocket :

```yaml
version: '3'
services:
  # ... autres services ...

  visio-server:
    build:
      context: ./prototype-visio-main/prototype-visio-main/visio-server
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    networks:
      - careway-network

networks:
  careway-network:
    driver: bridge
```

### Utilisation

Quand une infirmière clique sur le bouton "Live visio connect" d'un rendez-vous:

1. Le modal `VisioModal` s'ouvre
2. La connexion WebSocket est établie avec le serveur de signalisation
3. Les flux vidéo/audio sont initialisés
4. Une salle de visio unique est créée avec l'ID du rendez-vous comme `roomId`

### Dépannage

**Erreur: "Erreur lors de l'initialisation"**
- Vérifiez que le serveur WebSocket est en cours d'exécution sur le port 8080
- Vérifiez les logs du navigateur (F12 → Console)
- Assurez-vous que le navigateur autorise l'accès à la caméra et au micro

**Erreur: "Websocket failed to connect"**
- Le serveur WebSocket n'est pas accessible
- Vérifiez la configuration du firewall
- En développement, assurez-vous que le port 8080 est disponible

### Architecture

```
NurseDashboard
    ↓
   [Clic bouton "Live visio connect"]
    ↓
VisioModal (s'ouvre)
    ├→ Demande accès caméra/micro
    ├→ Connexion WebSocket
    ├→ WebRTC Peer Connection
    └→ Affichage vidéo bidirectionnel + chat
```

### Fichiers concernés

- **[VisioModal.tsx](src/components/VisioModal.tsx)** - Composant modal de visio
- **[NurseDashboard.tsx](src/components/NurseDashboard.tsx)** - Intégration du bouton et modal
