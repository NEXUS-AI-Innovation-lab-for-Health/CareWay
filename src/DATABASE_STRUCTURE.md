# Structure de la Base de Données

Ce document décrit la structure des données stockées dans la table KV (Key-Value) Supabase.

## 📊 Organisation des Clés

### 👤 **Utilisateurs Patients**

**Clé :** `user:patient:${email}`

**Structure :**
```json
{
  "id": "patient_1234567890",
  "name": "Jean Dupont",
  "email": "jean.dupont@example.fr",
  "password": "hash_sha256_du_mot_de_passe",
  "type": "patient",
  "phone": "06 12 34 56 78",
  "address": "12 Rue de la République, 75001 Paris",
  "createdAt": "2026-01-05T12:00:00.000Z"
}
```

**Remarques :**
- Le mot de passe est hashé avec SHA-256
- Les patients s'authentifient avec email + mot de passe
- Les champs `phone` et `address` sont optionnels

---

### 👨‍⚕️ **Utilisateurs Infirmiers**

**Clé :** `user:nurse:${email}`

**Structure :**
```json
{
  "id": "nurse_1234567890",
  "name": "Dr. Marie Dubois",
  "email": "marie.dubois@infirmier.fr",
  "type": "nurse",
  "franceConnectId": "fc_impots_1234567890",
  "createdAt": "2026-01-05T12:00:00.000Z"
}
```

**Remarques :**
- PAS de mot de passe (authentification uniquement via FranceConnect)
- Le `franceConnectId` est unique et provient de FranceConnect
- Lors de la première connexion FranceConnect, le compte infirmier est créé automatiquement

---

### ⚙️ **Paramètres Infirmier**

**Clé :** `nurse:${nurseId}:settings`

**Structure :**
```json
{
  "workingHours": {
    "start": "08:00",
    "end": "18:00"
  },
  "maxAppointmentsPerDay": 8,
  "maxDistanceKm": 30,
  "homeAddress": "15 Avenue des Champs, 75008 Paris",
  "preferredAreas": ["75001", "75008", "92100"],
  "breakDuration": 30,
  "avgAppointmentDuration": 45
}
```

**Remarques :**
- Créé automatiquement avec des valeurs par défaut lors de l'inscription de l'infirmier
- Utilisé par l'optimiseur IA pour calculer les tournées optimales
- Peut être modifié par l'infirmier dans ses paramètres

---

### 🚫 **Indisponibilités Infirmier**

**Clé :** `unavailabilities:${nurseId}`

**Structure :** (Array)
```json
[
  {
    "id": "unavail_1234567890",
    "date": "2026-01-10",
    "startTime": "14:00",
    "endTime": "16:00",
    "reason": "Rendez-vous médical",
    "createdAt": "2026-01-05T12:00:00.000Z"
  }
]
```

**Remarques :**
- Liste des périodes d'indisponibilité de l'infirmier
- Utilisé pour bloquer les créneaux lors de la prise de rendez-vous
- L'infirmier peut ajouter/supprimer des indisponibilités

---

### 📅 **Rendez-vous (À VENIR)**

**Clé :** `appointment:${appointmentId}`

**Structure prévue :**
```json
{
  "id": "appt_1234567890",
  "patientEmail": "jean.dupont@example.fr",
  "patientName": "Jean Dupont",
  "nurseId": "nurse_1234567890",
  "nurseName": "Dr. Marie Dubois",
  "date": "2026-01-15",
  "time": "10:00",
  "duration": 45,
  "address": "12 Rue de la République, 75001 Paris",
  "careType": "pansement",
  "status": "pending | confirmed | cancelled",
  "notes": "Patient âgé, accès difficile",
  "createdAt": "2026-01-05T12:00:00.000Z",
  "updatedAt": "2026-01-05T12:00:00.000Z"
}
```

---

### 📋 **Rendez-vous par Patient (À VENIR)**

**Clé :** `patient:${email}:appointments`

**Structure prévue :** (Array d'IDs)
```json
["appt_1234567890", "appt_1234567891", "appt_1234567892"]
```

---

### 📋 **Rendez-vous par Infirmier (À VENIR)**

**Clé :** `nurse:${nurseId}:appointments`

**Structure prévue :** (Array d'IDs)
```json
["appt_1234567893", "appt_1234567894", "appt_1234567895"]
```

---

### ⏳ **Demandes en attente (À VENIR)**

**Clé :** `pending:${nurseId}`

**Structure prévue :** (Array d'IDs)
```json
["appt_1234567896", "appt_1234567897"]
```

**Remarques :**
- Liste des rendez-vous avec status "pending" pour un infirmier
- L'infirmier peut accepter ou refuser ces demandes

---

## 🔐 Authentification

### Patients
1. **Inscription** → Route : `/api/patient/signup`
   - Stocke : `user:patient:${email}` avec mot de passe hashé
2. **Connexion** → Route : `/api/patient/login`
   - Vérifie : email + mot de passe hashé

### Infirmiers
1. **Connexion FranceConnect** → Route : `/api/nurse/franceconnect`
   - Si nouveau : Crée `user:nurse:${email}` + `nurse:${nurseId}:settings`
   - Si existant : Retourne les infos du compte

---

## 📝 Notes Importantes

- **Pas de tables SQL** : Tout est stocké dans la table KV `kv_store_1b83ce4c`
- **Hashing des mots de passe** : SHA-256 (pour démo, en production utiliser bcrypt)
- **Pas de mot de passe pour les infirmiers** : Authentification uniquement via FranceConnect
- **Structure flexible** : Le KV store permet de stocker des objets JSON complexes
- **Scalabilité** : Adapté pour le prototypage, à migrer vers SQL pour production à grande échelle

---

## 🚀 Routes API Actuelles

### Patients
- `POST /make-server-1b83ce4c/api/patient/signup` - Inscription patient
- `POST /make-server-1b83ce4c/api/patient/login` - Connexion patient

### Infirmiers
- `POST /make-server-1b83ce4c/api/nurse/franceconnect` - Connexion FranceConnect

### Indisponibilités
- `GET /make-server-1b83ce4c/unavailabilities/:nurseId` - Liste des indisponibilités
- `POST /make-server-1b83ce4c/unavailabilities/:nurseId` - Ajouter une indisponibilité
- `DELETE /make-server-1b83ce4c/unavailabilities/:nurseId/:unavailabilityId` - Supprimer

### Santé
- `GET /make-server-1b83ce4c/health` - Health check

---

**Dernière mise à jour :** 5 janvier 2026
