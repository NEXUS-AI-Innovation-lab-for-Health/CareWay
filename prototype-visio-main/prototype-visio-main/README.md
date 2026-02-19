# Prototype Visio WebRTC

Prototype de visioconférence peer-to-peer utilisant WebRTC, un serveur de signalisation WebSocket et un serveur TURN Coturn pour traverser les NAT.

## Architecture

```
[Navigateur A] <--COTURN--> [Navigateur B]
      |                               |
      +--------[WebSocket]------------+
                    |
           [Serveur signalisation]    (Node.js, port 8080)

```

**Trois composants à lancer :**
1. `visio-server` — serveur WebSocket de signalisation (Node.js)
2. `visio-app` — frontend React/Vite (HTTPS obligatoire pour accès caméra)
3. `Coturn` — serveur TURN via Docker (pour les flux vidéo)

---

## Lancement en local (réseau local, pas de Coturn nécessaire)

### 1. Serveur de signalisation

```bash
cd visio-server
npm install
node server.js
# Écoute sur ws://votre_ip:8080
```

### 2. Frontend

```bash
cd visio-app
npm install
npm run dev
# Accessible sur https://votre_ip:5173 (HTTPS auto-signé généré par Vite)
```

> Le navigateur affichera un avertissement de certificat non fiable — cliquez "Avancer quand même". C'est normal, le HTTPS est obligatoire pour que le navigateur autorise l'accès à la caméra et au micro.

Le proxy Vite redirige automatiquement les requêtes `/ws` vers `ws://localhost:8080`, donc les deux services tournent depuis la même origine côté navigateur.

### 3. Rejoindre une salle

Ouvrez `https://votre_ip:5173` dans deux onglets (ou deux machines du même réseau), entrez un nom d'utilisateur, le même ID de salle, et cliquez "Rejoindre".

---

## Lancement avec Coturn

### 1. Configurer l'IP publique

Éditez le fichier `.env` à la racine :

```env
EXTERNAL_IP=x.x.x.x   # votre IP
```

Pour trouver votre IP : `ipconfig`

### 2. Démarrer Coturn

```bash
docker compose up -d
```

Vérifiez que le conteneur tourne :

```bash
docker compose logs coturn
# Doit afficher : "Listener address to use: 0.0.0.0" ou quelques choses de similaire
```

### 3. Lancer le serveur et le frontend

Même procédure que pour le local. Le frontend lit automatiquement `window.location.hostname` pour construire l'adresse TURN :

```js
// App.jsx — ICE Servers configurés dans le frontend
const turnHost = window.location.hostname;
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },        // STUN Google (gratuit)
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: `turn:${turnHost}:3478`,                  // votre Coturn
      username: 'admin',
      credential: 'password',
    },
  ]
};
```

Donc si l'app tourne sur `https://monserveur.com`, elle essaiera automatiquement `turn:monserveur.com:3478`.

---

## Comment fonctionne WebRTC avec Coturn

### Flux de connexion entre deux peers

```
1. Adam ouvre l'app → rejoint la salle "room-42"
   └─ WebSocket: { type: "join", roomId: "room-42", username: "Adam" }

2. Hugo rejoint "room-42"
   └─ Le serveur notifie Adam: { type: "user-joined", username: "Hugo" }

3. Adam crée une RTCPeerConnection et envoie une OFFRE SDP
   └─ WebSocket: { type: "offer", offer: <SDP>, from: "Adam", to: "Hugo" }

4. Hugo reçoit l'offre, crée une RTCPeerConnection et envoie une RÉPONSE SDP
   └─ WebSocket: { type: "answer", answer: <SDP>, from: "Hugo", to: "Adam" }

5. Les deux côtés échangent des ICE candidates (adresses réseau candidates)
   └─ WebSocket: { type: "ice-candidate", candidate: <ICE>, from: ..., to: ... }

6. WebRTC teste chaque paire d'adresses dans l'ordre :
   b. Via STUN      (IP publique connue)  → traversée NAT simple
   c. Via TURN      (relais Coturn)       → fallback universel

7. La meilleure connexion est sélectionnée → flux audio/vidéo P2P établi
```

### Rôle de chaque serveur

**Serveur de signalisation (`visio-server/server.js`)**
- Il ne touche **jamais** aux flux audio/vidéo
- Il transmet uniquement les messages d'établissement de connexion (SDP + ICE) entre les peers via WebSocket
- Sans lui, les peers ne peuvent pas se "trouver" pour initialiser WebRTC

**STUN (Google ou Coturn)**
- Permet à chaque peer de découvrir sa propre IP publique et son port NAT
- La réponse STUN est incluse dans les ICE candidates envoyés via le serveur de signalisation
- Aucun trafic media ne passe par le serveur STUN

**TURN (Coturn)**
- **tout le trafic audio/vidéo transite par le serveur Coturn**
- Credentials configurés dans `docker-compose.yml` : `admin` / `password`
- Attention : le relais TURN consomme de la bande passante sur votre serveur (faire attention si en 4g/5g)

### Changer les identifiants Coturn

Modifiez le `docker-compose.yml` :
```yaml
--user=monuser:monpassword
```

Et mettez à jour les credentials dans `visio-app/src/App.jsx` :
```js
{
  urls: `turn:${turnHost}:3478`,
  username: 'monuser',
  credential: 'monpassword',
}
```

---

## Structure du projet

```
prototype-visio/
├── docker-compose.yml       # Coturn via Docker
├── turnserver.conf          # Config Coturn alternative (non utilisée par Docker)
├── .env                     # EXTERNAL_IP=x.x.x.x
│
├── visio-server/
│   ├── server.js            # Serveur WebSocket de signalisation (port 8080)
│   └── package.json
│
└── visio-app/
    ├── vite.config.js       # HTTPS auto-signé + proxy /ws → votre_ip:8080
    ├── src/
    │   └── App.jsx          # Logique WebRTC complète (ICE, SDP, tracks)
    └── package.json
```

---

## Dépannage

**La caméra ne s'active pas**
→ HTTPS obligatoire. Vérifiez que vous accédez via `https://` et non `http://`.

**"Impossible de se connecter au serveur"**
→ `visio-server` n'est pas démarré. Lancez `node server.js` dans `visio-server/`.

**Vidéo locale visible mais pas la vidéo distante**
→ Démarrez Coturn et vérifiez que les ports 3478 et 50000-50020/udp sont ouverts.

**Tester que Coturn répond**
```bash
docker compose logs -f coturn
```