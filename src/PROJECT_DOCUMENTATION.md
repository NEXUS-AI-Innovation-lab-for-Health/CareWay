# 🏥 InfirMeet - Plateforme de Rendez-vous Médicaux à Domicile

## 📋 Table des Matières

1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Objectifs principaux](#objectifs-principaux)
3. [Fonctionnalités détaillées](#fonctionnalités-détaillées)
4. [Architecture technique](#architecture-technique)
5. [Structure des pages et composants](#structure-des-pages-et-composants)
6. [Base de données et backend](#base-de-données-et-backend)
7. [Intelligence Artificielle - Optimiseur de tournées](#intelligence-artificielle---optimiseur-de-tournées)
8. [Technologies utilisées](#technologies-utilisées)
9. [Feuille de route - Développement](#feuille-de-route---développement)
10. [Prochaines étapes pour finaliser le projet](#prochaines-étapes-pour-finaliser-le-projet)

---

## 🎯 Vue d'ensemble du projet

**InfirMeet** est une plateforme web moderne de prise de rendez-vous médicaux à domicile qui met en relation des patients avec des infirmiers libéraux. Le projet se distingue par son approche innovante de l'optimisation des tournées de soins grâce à un système d'intelligence artificielle qui minimise les distances parcourues et maximise l'efficacité des déplacements.

### Vision du projet

Le système répond à un besoin crucial du secteur de la santé à domicile : permettre aux infirmiers d'optimiser leurs tournées tout en offrant aux patients un service de qualité avec des rendez-vous flexibles. L'application s'adresse à deux types d'utilisateurs distincts avec des besoins et des workflows différents.

### Public cible

- **Patients** : Personnes nécessitant des soins infirmiers à domicile (personnes âgées, patients post-opératoires, malades chroniques, etc.)
- **Infirmiers libéraux** : Professionnels de santé effectuant des soins à domicile et cherchant à optimiser leurs déplacements

---

## 🎯 Objectifs principaux

### 1. Optimisation intelligente des tournées (Objectif Principal)

Le cœur du projet est l'**agent IA d'optimisation de tournées** qui :
- Analyse les rendez-vous confirmés d'une journée
- Calcule les distances entre chaque point de visite
- Génère un itinéraire optimisé minimisant les kilomètres parcourus
- Réorganise les horaires tout en respectant les créneaux horaires demandés par les patients
- Prend en compte les indisponibilités de l'infirmier
- S'adapte au mode de transport utilisé (voiture, vélo, transports en commun, marche)
- Propose des pauses automatiques entre les rendez-vous

**Impact attendu :**
- Réduction de 30-40% des distances parcourues
- Économie de temps significative (jusqu'à 1h par jour)
- Réduction des coûts de carburant et de l'empreinte carbone
- Amélioration de la qualité de vie des infirmiers
- Possibilité de prendre plus de patients sans augmenter le temps de travail

### 2. Expérience utilisateur moderne et intuitive

- Design minimaliste et élégant sans images de fond inutiles
- Interface responsive adaptée mobile, tablette et desktop
- Formulaires épurés avec validation en temps réel
- Navigation fluide entre les différentes vues
- Feedback visuel immédiat pour toutes les actions

### 3. Système d'authentification sécurisé et adapté

- **Pour les patients** : Inscription classique avec email/mot de passe
- **Pour les infirmiers** : Authentification uniquement via FranceConnect (garantit l'identité professionnelle)
- Gestion des sessions utilisateur
- Protection des données sensibles

### 4. Gestion complète des rendez-vous

- Prise de rendez-vous par les patients avec choix du type de soin
- Système de demandes en attente pour les infirmiers
- Confirmation ou refus des demandes
- Annulation possible (mais pas de modification)
- Historique complet des rendez-vous
- Notifications visuelles

---

## ✨ Fonctionnalités détaillées

### 🏠 Page d'accueil

**Composant :** `HomePage.tsx`

- Présentation claire et concise du service
- Deux boutons d'accès principaux :
  - "Je suis un patient" → Redirection vers authentification patient
  - "Je suis un infirmier" → Redirection vers authentification FranceConnect
- Design minimaliste avec hiérarchie visuelle claire
- Responsive sur tous les appareils

---

### 👤 Espace Patient

#### Authentification

**Composants :** `ModernLoginForm.tsx` et `ModernRegisterForm.tsx`

**Inscription :**
- Formulaire avec validation en temps réel
- Champs : Nom complet, Email, Mot de passe (avec confirmation), Téléphone (optionnel), Adresse complète (optionnel)
- Hachage sécurisé du mot de passe (SHA-256)
- Messages d'erreur contextuels
- Lien vers la connexion si compte existant

**Connexion :**
- Formulaire simple : Email + Mot de passe
- Vérification backend avec mot de passe hashé
- Gestion des erreurs (compte inexistant, mot de passe incorrect)
- Lien vers l'inscription si pas de compte

#### Tableau de bord patient

**Composant :** `PatientDashboard.tsx`

**Vue d'ensemble :**
- En-tête avec nom de l'utilisateur et bouton de déconnexion
- Navigation par onglets : Mes rendez-vous | Prendre rendez-vous | Mon profil

**Onglet "Mes rendez-vous" :**
- **Rendez-vous à venir** :
  - Affichage en cartes avec toutes les informations (date, heure, infirmier, type de soin, adresse)
  - Bouton "Annuler" pour chaque rendez-vous
  - Badge de statut (En attente / Confirmé)
  - Tri chronologique
  
- **Historique des rendez-vous** :
  - Liste des rendez-vous passés ou annulés
  - Affichage en format réduit avec statut
  - Possibilité de consulter les détails

**Onglet "Prendre rendez-vous" :**
- **Sélection du type de soin** :
  - Grid de cartes avec icônes pour chaque type de soin
  - 8 types disponibles : Injection, Prise de sang, Administration de médicaments, Gestion des pansements, Suivi maladie chronique, Vaccination, Soins post-opératoires, Perfusion
  - Affichage de la durée estimée pour chaque soin
  
- **Formulaire de réservation** :
  - Adresse du rendez-vous (pré-remplie avec l'adresse du profil si disponible)
  - Sélection de la date (pas de dates passées)
  - Choix du créneau horaire (Matin 8h-12h / Après-midi 14h-18h / Soir 18h-20h)
  - Notes additionnelles (optionnel)
  - Recherche d'infirmier disponible
  - Confirmation de la demande

**Onglet "Mon profil" :**
- Affichage des informations personnelles
- Modification possible : Nom, Email, Téléphone, Adresse
- Bouton de sauvegarde des modifications

---

### 👨‍⚕️ Espace Infirmier

#### Authentification

**Composant :** `FranceConnectLogin.tsx`

- Bouton "Se connecter avec FranceConnect"
- Simulation du processus FranceConnect (dans un contexte réel, redirection vers le portail officiel)
- Récupération des données d'identité depuis FranceConnect
- Création automatique du compte si première connexion
- Initialisation des paramètres par défaut

#### Tableau de bord infirmier

**Composant :** `NurseDashboard.tsx`

**Navigation principale :**
- Onglet "Rendez-vous" : Gestion des demandes et calendrier
- Onglet "Paramètres" : Configuration du profil et des préférences

**Onglet "Rendez-vous" - Vue principale :**

**Section "Demandes en attente" :**
- Liste des nouvelles demandes de rendez-vous des patients
- Affichage complet : Patient, Date, Heure souhaitée, Type de soin, Adresse, Notes
- Actions disponibles :
  - Bouton "Accepter" → Confirme le rendez-vous
  - Bouton "Refuser" → Rejette la demande
- Badge de comptage des demandes en attente
- Actualisation en temps réel

**Section "Mes rendez-vous confirmés" :**

**Sélecteur de vue :**
- Bouton bascule : "Aujourd'hui" / "Cette semaine"
- Sélecteur de date pour naviguer

**Vue "Aujourd'hui" (Liste détaillée) :**
- Affichage chronologique des rendez-vous du jour
- Pour chaque rendez-vous :
  - Heure précise
  - Nom du patient
  - Type de soin avec durée
  - Adresse complète
  - Notes éventuelles
  - Badge de statut
- Séparation visuelle entre rendez-vous passés et à venir
- Possibilité d'annuler un rendez-vous

**🚀 Module IA - Optimiseur de tournées :**
- Bouton "✨ Optimiser ma tournée avec l'IA"
- Déclenchement de l'analyse intelligente
- Affichage de la solution optimisée :
  - Nouveau parcours avec horaires ajustés
  - Carte interactive du trajet
  - Statistiques d'optimisation :
    - Distance totale du parcours
    - Temps total de trajet
    - Économies réalisées (km et minutes)
    - Réduction en pourcentage
  - Pauses automatiques insérées
- Bouton "Appliquer cette tournée" pour valider
- Visualisation avant/après
- Prise en compte du mode de transport configuré

**Vue "Cette semaine" (Calendrier) :**
- Grille hebdomadaire avec 7 colonnes (Lun à Dim)
- Plages horaires de 8h à 20h
- Rendez-vous affichés en blocs colorés selon leur statut
- Hauteur des blocs proportionnelle à la durée
- Vue d'ensemble pour anticiper la charge de travail
- Indicateur de charge par jour (nombre de rendez-vous)

**Onglet "Paramètres" - Configuration :**

**Section "Informations personnelles" :**
- Nom complet
- Email
- Mode édition possible

**Section "Paramètres de tournée" (utilisés par l'IA) :**
- **Horaires de travail** : Heure de début et de fin (ex: 8h - 18h)
- **Rendez-vous max/jour** : Limite de patients par jour
- **Distance maximale** : Rayon d'intervention en km
- **Adresse de départ** : Point de départ pour les tournées
- **Durée de pause** : Temps de pause entre rendez-vous (en minutes)
- **Durée moyenne RDV** : Temps moyen par rendez-vous (en minutes)
- **Mode de transport** : Voiture / Vélo / Transports en commun / À pied
  - Impact direct sur le calcul des temps de trajet par l'IA

**Section "Mes indisponibilités" :**

**Composant :** `UnavailabilityManager.tsx`

- Gestion des périodes d'indisponibilité (congés, formation, rendez-vous personnels)
- Bouton "Ajouter une indisponibilité"
- Formulaire modal :
  - Date (pas de dates passées)
  - Heure de début
  - Heure de fin
  - Raison (optionnel)
- Affichage en deux sections :
  - **À venir** : Indisponibilités futures (fond orange, suppression possible)
  - **Passées** : Historique (affichage en grisé, lecture seule)
- Icônes contextuelles (calendrier, horloge, alerte)
- Suppression possible pour les indisponibilités futures

---

## 🏗️ Architecture technique

### Stack technologique

**Frontend :**
- **React 18** avec hooks (useState, useEffect)
- **TypeScript** pour le typage fort
- **Tailwind CSS v4** pour le styling
- **Radix UI** pour les composants accessibles (Dialog, Tabs, Select, etc.)
- **Lucide React** pour les icônes
- **Sonner** pour les notifications toast
- **React Hook Form** pour la validation des formulaires

**Backend :**
- **Supabase** (BaaS - Backend as a Service)
- **Supabase Edge Functions** avec Deno runtime
- **Hono** (framework web léger pour Edge Functions)
- **KV Store** (système de stockage clé-valeur Postgres)

**Cartes et géolocalisation :**
- **Google Maps API** (Places, Geocoding, Distance Matrix)
- Calcul des distances et temps de trajet réels
- Affichage des itinéraires optimisés

**Sécurité :**
- Hachage des mots de passe avec SHA-256
- CORS configuré pour toutes les routes
- Validation des entrées côté serveur
- Protection contre les injections

### Architecture applicative

**Modèle : Single Page Application (SPA)**

L'application suit une architecture SPA avec gestion d'état côté client :

```
App.tsx (Routeur principal)
├── HomePage (Vue d'accueil)
├── ModernLoginForm (Connexion patient)
├── ModernRegisterForm (Inscription patient)
├── FranceConnectLogin (Authentification infirmier)
├── PatientDashboard (Espace patient)
│   ├── Onglet Mes rendez-vous
│   ├── Onglet Prendre rendez-vous
│   └── Onglet Mon profil
└── NurseDashboard (Espace infirmier)
    ├── Onglet Rendez-vous
    │   ├── Demandes en attente
    │   ├── Vue Aujourd'hui (avec optimiseur IA)
    │   └── Vue Cette semaine (calendrier)
    └── Onglet Paramètres
        ├── Informations personnelles
        ├── Paramètres de tournée
        └── Mes indisponibilités
```

**Flux de données :**

```
Frontend (React) 
    ↓ fetch API
Backend (Hono/Supabase Edge Function)
    ↓ kv.get() / kv.set()
Base de données (KV Store Postgres)
```

**Gestion d'état :**
- **État local** : useState pour les composants (formulaires, modales, onglets)
- **Props drilling** : Passage de données parent → enfant
- **Contexte utilisateur** : Stocké dans App.tsx et transmis aux dashboards
- **localStorage** : Sauvegarde temporaire (mode de transport, préférences UI)

---

## 📁 Structure des pages et composants

### Pages principales

| Page | Route | Composant | Description |
|------|-------|-----------|-------------|
| Accueil | `/` | `HomePage.tsx` | Page de landing avec choix du type d'utilisateur |
| Connexion Patient | `/patient/login` | `ModernLoginForm.tsx` | Formulaire de connexion patient |
| Inscription Patient | `/patient/register` | `ModernRegisterForm.tsx` | Formulaire d'inscription patient |
| Authentification Infirmier | `/nurse/auth` | `FranceConnectLogin.tsx` | Authentification via FranceConnect |
| Dashboard Patient | `/patient/dashboard` | `PatientDashboard.tsx` | Espace personnel patient |
| Dashboard Infirmier | `/nurse/dashboard` | `NurseDashboard.tsx` | Espace personnel infirmier |

### Composants réutilisables

**UI Components** (`/components/ui/`) :
- `button.tsx` : Boutons avec variantes (default, destructive, outline, ghost, link)
- `card.tsx` : Cartes pour structurer le contenu
- `input.tsx` : Champs de saisie
- `label.tsx` : Labels pour les formulaires
- `badge.tsx` : Badges de statut
- `tabs.tsx` : Navigation par onglets
- `dialog.tsx` : Modales
- `select.tsx` : Menus déroulants
- `textarea.tsx` : Zones de texte multilignes
- `calendar.tsx` : Sélecteur de date
- `switch.tsx` : Interrupteurs
- `table.tsx` : Tableaux
- `alert.tsx` : Messages d'alerte
- `sonner.tsx` : Notifications toast

**Composants métier** (`/components/`) :
- `AIRouteOptimizer.tsx` : Module IA d'optimisation des tournées ⭐
- `AppointmentScheduler.tsx` : Formulaire de prise de rendez-vous
- `AppointmentDetailsModal.tsx` : Détails d'un rendez-vous en modal
- `AppointmentConfirmDialog.tsx` : Confirmation d'actions sur rendez-vous
- `CareTypeSelector.tsx` : Sélecteur de type de soin
- `InteractiveMap.tsx` : Carte interactive avec Google Maps
- `UnavailabilityManager.tsx` : Gestion des indisponibilités
- `NurseSettings.tsx` : Paramètres de l'infirmier
- `PatientProfile.tsx` : Profil du patient
- `PatientProfileContent.tsx` : Contenu éditable du profil

**Composants système** :
- `ImageWithFallback.tsx` : Gestion des images avec fallback (protégé)

---

## 💾 Base de données et backend

### Architecture de données

Le projet utilise un **système KV (Key-Value) Store** basé sur Postgres de Supabase. Ce choix permet une flexibilité maximale pour le prototypage tout en restant performant.

**Table principale :** `kv_store_1b83ce4c`

Structure :
```sql
CREATE TABLE kv_store_1b83ce4c (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modèle de données

**1. Utilisateurs Patients**

Clé : `user:patient:${email}`

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

**2. Utilisateurs Infirmiers**

Clé : `user:nurse:${email}`

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

⚠️ Pas de mot de passe pour les infirmiers (authentification FranceConnect uniquement)

**3. Paramètres Infirmier**

Clé : `nurse:${nurseId}:settings`

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
  "avgAppointmentDuration": 45,
  "transportMode": "car"
}
```

Ces paramètres sont **critiques pour l'optimiseur IA** qui les utilise pour :
- Respecter les horaires de travail
- Limiter le nombre de rendez-vous par jour
- Restreindre la zone géographique
- Calculer les temps de trajet selon le mode de transport
- Insérer des pauses automatiques

**4. Indisponibilités**

Clé : `unavailabilities:${nurseId}`

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

**5. Rendez-vous (À IMPLÉMENTER)**

Clé : `appointment:${appointmentId}`

```json
{
  "id": "appt_1234567890",
  "patientId": "patient_1234567890",
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

**6. Index des rendez-vous par patient (À IMPLÉMENTER)**

Clé : `patient:${email}:appointments`

```json
["appt_1234567890", "appt_1234567891", "appt_1234567892"]
```

**7. Index des rendez-vous par infirmier (À IMPLÉMENTER)**

Clé : `nurse:${nurseId}:appointments`

```json
["appt_1234567893", "appt_1234567894", "appt_1234567895"]
```

**8. Demandes en attente (À IMPLÉMENTER)**

Clé : `pending:${nurseId}`

```json
["appt_1234567896", "appt_1234567897"]
```

### Routes API Backend

**Fichier principal :** `/supabase/functions/server/index.tsx`

**Routes actuellement implémentées :**

| Méthode | Route | Description | Status |
|---------|-------|-------------|--------|
| GET | `/make-server-1b83ce4c/health` | Health check | ✅ Implémenté |
| POST | `/make-server-1b83ce4c/api/patient/signup` | Inscription patient | ✅ Implémenté |
| POST | `/make-server-1b83ce4c/api/patient/login` | Connexion patient | ✅ Implémenté |
| POST | `/make-server-1b83ce4c/api/nurse/franceconnect` | Auth FranceConnect | ✅ Implémenté |
| GET | `/make-server-1b83ce4c/unavailabilities/:nurseId` | Liste indisponibilités | ✅ Implémenté |
| POST | `/make-server-1b83ce4c/unavailabilities/:nurseId` | Ajouter indisponibilité | ✅ Implémenté |
| DELETE | `/make-server-1b83ce4c/unavailabilities/:nurseId/:id` | Supprimer indisponibilité | ✅ Implémenté |

**Routes à implémenter :**

| Méthode | Route | Description | Priorité |
|---------|-------|-------------|----------|
| POST | `/make-server-1b83ce4c/appointments` | Créer un rendez-vous | 🔴 Haute |
| GET | `/make-server-1b83ce4c/appointments/patient/:email` | Liste RDV patient | 🔴 Haute |
| GET | `/make-server-1b83ce4c/appointments/nurse/:nurseId` | Liste RDV infirmier | 🔴 Haute |
| GET | `/make-server-1b83ce4c/appointments/pending/:nurseId` | Demandes en attente | 🔴 Haute |
| PATCH | `/make-server-1b83ce4c/appointments/:id/status` | Modifier statut RDV | 🔴 Haute |
| DELETE | `/make-server-1b83ce4c/appointments/:id` | Annuler un RDV | 🔴 Haute |
| GET | `/make-server-1b83ce4c/nurse/:nurseId/settings` | Récupérer paramètres | 🟡 Moyenne |
| PUT | `/make-server-1b83ce4c/nurse/:nurseId/settings` | Modifier paramètres | 🟡 Moyenne |
| GET | `/make-server-1b83ce4c/patient/:email/profile` | Récupérer profil patient | 🟡 Moyenne |
| PUT | `/make-server-1b83ce4c/patient/:email/profile` | Modifier profil patient | 🟡 Moyenne |

---

## 🤖 Intelligence Artificielle - Optimiseur de tournées

### Concept et fonctionnement

**Composant :** `AIRouteOptimizer.tsx`

L'optimiseur IA est le **cœur innovant** du projet. Il résout un problème classique d'optimisation combinatoire : le **problème du voyageur de commerce (TSP - Traveling Salesman Problem)** adapté au contexte médical.

### Algorithme d'optimisation

**Approche utilisée :** Algorithme glouton (Greedy Nearest Neighbor) avec heuristiques métier

**Étapes du processus :**

1. **Collecte des données** :
   - Récupération des rendez-vous confirmés du jour sélectionné
   - Récupération des paramètres de l'infirmier (horaires, mode transport, etc.)
   - Filtrage des rendez-vous annulés

2. **Géocodage des adresses** :
   - Conversion de chaque adresse en coordonnées GPS (latitude/longitude)
   - Utilisation de l'API Google Maps Geocoding
   - Gestion des erreurs de géocodage

3. **Calcul de la matrice de distances** :
   - Calcul de la distance entre chaque paire de rendez-vous
   - Utilisation de l'API Google Maps Distance Matrix
   - Distance réelle (pas à vol d'oiseau) selon les routes
   - Temps de trajet selon le mode de transport

4. **Tri par créneau horaire** :
   - Séparation des rendez-vous par créneau demandé :
     - Matin (8h-12h)
     - Après-midi (14h-18h)
     - Soir (18h-20h)
   - Optimisation séparée pour chaque créneau

5. **Application de l'algorithme glouton** :
   - Pour chaque créneau :
     - Priorisation des rendez-vous urgents
     - Sélection du rendez-vous le plus proche du point actuel
     - Affectation d'un horaire dans la plage du créneau
     - Ajout du temps de soin + temps de trajet
     - Insertion automatique de pauses si nécessaire

6. **Insertion des pauses** :
   - Détection des périodes sans rendez-vous
   - Insertion de pauses si l'intervalle > durée de pause configurée
   - Icône spécifique (☕ Coffee) pour les pauses

7. **Calcul des métriques** :
   - **Distance totale** : Somme de toutes les distances entre les points
   - **Temps total de trajet** : Somme des temps de déplacement
   - **Comparaison avec l'ordre original** :
     - Économies de distance (km et %)
     - Économies de temps (minutes et %)

8. **Génération de la carte** :
   - Affichage des points sur Google Maps
   - Tracé de l'itinéraire optimisé
   - Marqueurs numérotés pour chaque arrêt
   - Couleurs différentes selon le statut

### Paramètres pris en compte

| Paramètre | Source | Impact sur l'optimisation |
|-----------|--------|---------------------------|
| Horaires de travail | `nurse:${id}:settings` | Plage horaire disponible |
| Mode de transport | `nurse:${id}:settings` | Vitesse moyenne, temps de trajet |
| Durée de pause | `nurse:${id}:settings` | Insertion de pauses automatiques |
| Distance max | `nurse:${id}:settings` | Exclusion des RDV trop éloignés |
| Créneau demandé | `appointment.timeSlot` | Contrainte de plage horaire |
| Urgence | `appointment.isUrgent` | Priorité dans l'ordonnancement |
| Durée du soin | `careTypes` | Calcul du temps total |

### Modes de transport et vitesses

```typescript
const transportSpeeds = {
  car: 50,      // 50 km/h en ville → 1.2 min/km
  bike: 15,     // 15 km/h → 4 min/km
  transit: 20,  // 20 km/h → 3 min/km
  walking: 5    // 5 km/h → 12 min/km
};
```

Ces vitesses réalistes permettent un calcul précis des temps de trajet et une optimisation adaptée au mode de déplacement de l'infirmier.

### Exemple concret d'optimisation

**Situation initiale :**
- 5 rendez-vous confirmés le 15 janvier 2026
- Ordre chronologique d'acceptation :
  1. 09:00 - M. Dupont - 15 Rue Victor Hugo, Paris
  2. 10:00 - Mme Martin - 45 Avenue Mozart, Paris
  3. 11:00 - M. Bernard - 8 Rue Balzac, Paris
  4. 14:00 - Mme Petit - 23 Boulevard Haussmann, Paris
  5. 15:00 - M. Robert - 12 Rue de Rivoli, Paris
- Distance totale : 28 km
- Temps de trajet total : 58 minutes

**Après optimisation IA :**
- Réorganisation par proximité géographique :
  1. 09:00 - M. Dupont - 15 Rue Victor Hugo
  2. 09:50 - M. Robert - 12 Rue de Rivoli (inversé avec Mme Martin)
  3. 10:40 - Mme Petit - 23 Boulevard Haussmann (inversé)
  4. 11:30 - PAUSE (30 min automatique) ☕
  5. 14:00 - Mme Martin - 45 Avenue Mozart
  6. 14:50 - M. Bernard - 8 Rue Balzac
- Distance totale : 18 km
- Temps de trajet total : 37 minutes
- **Économies : 10 km (36%) et 21 minutes (36%)**

### Interface utilisateur de l'optimiseur

**Déclenchement :**
- Bouton "✨ Optimiser ma tournée avec l'IA" dans la vue "Aujourd'hui"
- Disponible uniquement si au moins 2 rendez-vous confirmés

**Affichage des résultats :**
- **Carte interactive** :
  - Points de départ et d'arrivée
  - Trajet optimisé en couleur
  - Marqueurs numérotés
  - InfoWindow avec détails au clic

- **Liste des rendez-vous réorganisés** :
  - Ordre séquentiel avec numéros
  - Nouveaux horaires calculés
  - Icône de pause pour les temps de repos
  - Distance et temps jusqu'au prochain point

- **Statistiques d'optimisation** :
  - Badge "Distance totale" avec icône Route
  - Badge "Temps de trajet" avec icône Clock
  - Badge "Économies" avec flèches vers le bas (TrendingDown)
  - Pourcentages de réduction
  - Code couleur (vert si économies significatives)

- **Actions** :
  - Bouton "Appliquer cette tournée" → Met à jour les horaires dans la BDD
  - Bouton "Annuler" → Conserve l'ordre original
  - Toggle "Afficher la comparaison" → Vue avant/après côte à côte

### Limitations et améliorations futures

**Limitations actuelles :**
- Algorithme glouton (pas optimal à 100%, mais rapide et efficace)
- Pas de prise en compte du trafic en temps réel
- Pas d'optimisation multi-jours
- Pas de gestion des contraintes complexes (pause déjeuner obligatoire à heure fixe)

**Améliorations envisageables :**
- Utilisation d'algorithmes plus sophistiqués (Simulated Annealing, Genetic Algorithm)
- Intégration du trafic temps réel via Google Maps Traffic API
- Optimisation hebdomadaire/mensuelle
- Machine Learning pour apprendre des préférences de l'infirmier
- Suggestion proactive de nouveaux créneaux pour accepter plus de patients
- Co-optimisation entre plusieurs infirmiers pour une même zone

---

## 🛠️ Technologies utilisées

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.x | Framework UI principal |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4.0 | Framework CSS utilitaire |
| Radix UI | Latest | Composants accessibles |
| Lucide React | 0.554.0 | Bibliothèque d'icônes |
| Sonner | 2.0.3 | Notifications toast |
| React Hook Form | 7.55.0 | Validation de formulaires |
| class-variance-authority | 0.7.1 | Gestion des variantes CSS |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Supabase | Latest | Backend as a Service |
| Deno | Latest | Runtime JavaScript/TypeScript |
| Hono | Latest | Framework web Edge Functions |
| Postgres | Latest | Base de données (via Supabase) |

### APIs externes

| API | Usage |
|-----|-------|
| Google Maps Geocoding API | Conversion adresse → coordonnées GPS |
| Google Maps Distance Matrix API | Calcul distances et temps de trajet |
| Google Maps JavaScript API | Affichage de cartes interactives |
| FranceConnect | Authentification infirmiers |

### Outils de développement

- **ESM.sh** : CDN pour les modules ES6
- **Git** : Contrôle de version
- **VS Code** : Éditeur recommandé
- **Chrome DevTools** : Débogage

### Hébergement et déploiement

- **Supabase** : Hébergement backend + BDD + Edge Functions
- **Vercel / Netlify** (recommandé) : Hébergement frontend
- **Domaine personnalisé** (optionnel)

---

## 📊 Feuille de route - Développement

### Phase 1 : Fondations (✅ TERMINÉ)

**Durée estimée : 2 semaines**

- [x] Mise en place de l'environnement React + TypeScript
- [x] Configuration Tailwind CSS v4
- [x] Création des composants UI de base (button, card, input, etc.)
- [x] Design de la page d'accueil (HomePage)
- [x] Formulaires d'authentification patient (login/register)
- [x] Formulaire FranceConnect pour infirmiers
- [x] Structure de base des dashboards

### Phase 2 : Backend et authentification (✅ TERMINÉ)

**Durée estimée : 1 semaine**

- [x] Configuration Supabase
- [x] Création de la table KV Store
- [x] Implémentation du serveur Hono
- [x] Routes d'inscription patient (POST /api/patient/signup)
- [x] Routes de connexion patient (POST /api/patient/login)
- [x] Route FranceConnect (POST /api/nurse/franceconnect)
- [x] Hachage des mots de passe
- [x] Gestion des erreurs et logs
- [x] Configuration CORS

### Phase 3 : Gestion des paramètres (✅ TERMINÉ)

**Durée estimée : 3 jours**

- [x] Composant NurseSettings
- [x] Formulaire de modification des paramètres
- [x] Routes GET/PUT pour les paramètres infirmier
- [x] Composant UnavailabilityManager
- [x] Routes CRUD pour les indisponibilités
- [x] Affichage des indisponibilités futures/passées

### Phase 4 : Module IA d'optimisation (✅ TERMINÉ)

**Durée estimée : 1 semaine**

- [x] Composant AIRouteOptimizer
- [x] Intégration Google Maps APIs
- [x] Algorithme glouton d'optimisation
- [x] Calcul de la matrice de distances
- [x] Gestion des créneaux horaires
- [x] Insertion automatique de pauses
- [x] Calcul des économies (distance/temps)
- [x] Affichage de la carte interactive
- [x] Vue avant/après optimisation
- [x] Prise en compte du mode de transport

### Phase 5 : Responsive design (✅ TERMINÉ)

**Durée estimée : 2 jours**

- [x] Adaptation mobile de tous les composants
- [x] Breakpoints Tailwind (sm, md, lg, xl)
- [x] Navigation mobile optimisée
- [x] Formulaires responsive
- [x] Cartes et tableaux adaptables
- [x] Tests sur différents appareils

### Phase 6 : Gestion des rendez-vous (🔴 EN COURS)

**Durée estimée : 1 semaine**

- [ ] Routes backend pour les rendez-vous (CRUD)
- [ ] Connexion PatientDashboard au backend
- [ ] Connexion NurseDashboard au backend
- [ ] Création de rendez-vous par les patients
- [ ] Affichage des demandes en attente pour infirmiers
- [ ] Acceptation/refus des demandes
- [ ] Annulation de rendez-vous
- [ ] Mise à jour des statuts
- [ ] Historique des rendez-vous

**Tâches détaillées :**

1. **Routes backend** (priorité haute) :
   ```
   POST /appointments - Créer un RDV
   GET /appointments/patient/:email - Liste RDV patient
   GET /appointments/nurse/:nurseId - Liste RDV infirmier
   GET /appointments/pending/:nurseId - Demandes en attente
   PATCH /appointments/:id/status - Modifier statut
   DELETE /appointments/:id - Annuler
   ```

2. **Intégration PatientDashboard** :
   - Fetch des rendez-vous au chargement
   - Affichage dynamique à venir/historique
   - Action "Annuler" fonctionnelle
   - Création de nouvelle demande via AppointmentScheduler

3. **Intégration NurseDashboard** :
   - Fetch des demandes en attente
   - Fetch des rendez-vous confirmés
   - Actions "Accepter"/"Refuser"
   - Vue Aujourd'hui avec données réelles
   - Vue Cette semaine avec données réelles
   - Application des tournées optimisées

### Phase 7 : Recherche et matching (🟡 PROCHAINEMENT)

**Durée estimée : 3 jours**

- [ ] Algorithme de recherche d'infirmier disponible
- [ ] Critères de matching :
  - Distance maximale
  - Disponibilité sur le créneau
  - Nombre de RDV déjà acceptés
  - Indisponibilités
- [ ] Affichage des infirmiers disponibles
- [ ] Système de préférence/notation (optionnel)

### Phase 8 : Notifications (🟡 PROCHAINEMENT)

**Durée estimée : 2 jours**

- [ ] Notifications toast pour toutes les actions importantes
- [ ] Badges de comptage (demandes en attente)
- [ ] Indicateurs visuels de changement
- [ ] Messages de confirmation
- [ ] Gestion des erreurs utilisateur

### Phase 9 : Tests et débogage (🟢 FINAL)

**Durée estimée : 3 jours**

- [ ] Tests end-to-end de tous les parcours utilisateur
- [ ] Tests de charge sur le backend
- [ ] Tests de responsive sur tous les appareils
- [ ] Correction de bugs
- [ ] Optimisation des performances
- [ ] Validation de l'accessibilité (WCAG)

### Phase 10 : Documentation et déploiement (🟢 FINAL)

**Durée estimée : 2 jours**

- [ ] Documentation technique complète
- [ ] Guide utilisateur (patient et infirmier)
- [ ] Configuration des variables d'environnement
- [ ] Déploiement sur Vercel/Netlify
- [ ] Configuration du domaine
- [ ] Monitoring et analytics

---

## 🚀 Prochaines étapes pour finaliser le projet

### Étape 1 : Implémenter les routes de gestion des rendez-vous (URGENT)

**Objectif :** Connecter les dashboards au backend pour une gestion complète des rendez-vous.

**Fichier à modifier :** `/supabase/functions/server/index.tsx`

**Actions :**

1. **Route de création de rendez-vous** :
```typescript
app.post("/make-server-1b83ce4c/appointments", async (c) => {
  // Récupérer les données du rendez-vous
  // Générer un ID unique
  // Créer l'objet appointment avec status "pending"
  // Stocker dans KV : appointment:${id}
  // Ajouter l'ID à patient:${email}:appointments
  // Ajouter l'ID à pending:${nurseId}
  // Retourner le rendez-vous créé
});
```

2. **Routes de récupération** :
```typescript
app.get("/make-server-1b83ce4c/appointments/patient/:email", async (c) => {
  // Récupérer patient:${email}:appointments (array d'IDs)
  // Pour chaque ID, récupérer appointment:${id}
  // Trier par date
  // Retourner le tableau complet
});

app.get("/make-server-1b83ce4c/appointments/nurse/:nurseId", async (c) => {
  // Récupérer nurse:${nurseId}:appointments
  // Récupérer chaque appointment complet
  // Filtrer par status (exclure cancelled)
  // Trier par date et heure
  // Retourner le tableau
});

app.get("/make-server-1b83ce4c/appointments/pending/:nurseId", async (c) => {
  // Récupérer pending:${nurseId}
  // Récupérer chaque appointment complet
  // Retourner uniquement ceux avec status "pending"
});
```

3. **Route de modification de statut** :
```typescript
app.patch("/make-server-1b83ce4c/appointments/:id/status", async (c) => {
  // Récupérer appointment:${id}
  // Modifier le status (pending → confirmed ou cancelled)
  // Si confirmed : déplacer de pending:${nurseId} vers nurse:${nurseId}:appointments
  // Mettre à jour updatedAt
  // Stocker les modifications
  // Retourner l'appointment mis à jour
});
```

4. **Route d'annulation** :
```typescript
app.delete("/make-server-1b83ce4c/appointments/:id", async (c) => {
  // Récupérer appointment:${id}
  // Modifier status → cancelled
  // Retirer de pending:${nurseId} si présent
  // Conserver dans les listes pour l'historique
  // Mettre à jour
});
```

### Étape 2 : Connecter PatientDashboard

**Fichier à modifier :** `/components/PatientDashboard.tsx`

**Actions :**

1. **Récupérer les rendez-vous au montage** :
```typescript
useEffect(() => {
  const fetchAppointments = async () => {
    const response = await fetch(
      `${baseUrl}/appointments/patient/${user.email}`,
      { headers: { 'Authorization': `Bearer ${publicAnonKey}` }}
    );
    const data = await response.json();
    setAppointments(data.appointments);
  };
  fetchAppointments();
}, [user.email]);
```

2. **Implémenter la création de rendez-vous** :
```typescript
const handleCreateAppointment = async (appointmentData) => {
  const response = await fetch(`${baseUrl}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({
      ...appointmentData,
      patientEmail: user.email,
      patientName: user.name
    })
  });
  if (response.ok) {
    toast.success("Demande de rendez-vous envoyée !");
    fetchAppointments(); // Rafraîchir
  }
};
```

3. **Implémenter l'annulation** :
```typescript
const handleCancelAppointment = async (appointmentId) => {
  const response = await fetch(`${baseUrl}/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  if (response.ok) {
    toast.success("Rendez-vous annulé");
    fetchAppointments();
  }
};
```

### Étape 3 : Connecter NurseDashboard

**Fichier à modifier :** `/components/NurseDashboard.tsx`

**Actions :**

1. **Récupérer les demandes en attente** :
```typescript
const fetchPendingAppointments = async () => {
  const response = await fetch(
    `${baseUrl}/appointments/pending/${nurseId}`,
    { headers: { 'Authorization': `Bearer ${publicAnonKey}` }}
  );
  const data = await response.json();
  setPendingAppointments(data.appointments);
};
```

2. **Récupérer les rendez-vous confirmés** :
```typescript
const fetchConfirmedAppointments = async () => {
  const response = await fetch(
    `${baseUrl}/appointments/nurse/${nurseId}`,
    { headers: { 'Authorization': `Bearer ${publicAnonKey}` }}
  );
  const data = await response.json();
  setConfirmedAppointments(data.appointments);
};
```

3. **Implémenter acceptation/refus** :
```typescript
const handleAcceptAppointment = async (appointmentId) => {
  const response = await fetch(
    `${baseUrl}/appointments/${appointmentId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    }
  );
  if (response.ok) {
    toast.success("Rendez-vous confirmé !");
    fetchPendingAppointments();
    fetchConfirmedAppointments();
  }
};

const handleRejectAppointment = async (appointmentId) => {
  await fetch(`${baseUrl}/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  toast.success("Demande refusée");
  fetchPendingAppointments();
};
```

4. **Appliquer la tournée optimisée** :
```typescript
const handleApplyOptimizedRoute = async (optimizedAppointments) => {
  // Pour chaque rendez-vous optimisé
  for (const appt of optimizedAppointments) {
    await fetch(`${baseUrl}/appointments/${appt.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ 
        time: appt.time // Nouvel horaire calculé par l'IA
      })
    });
  }
  toast.success("Tournée optimisée appliquée !");
  fetchConfirmedAppointments();
};
```

### Étape 4 : Tests end-to-end

**Scénarios à tester :**

1. **Parcours patient complet** :
   - Inscription → Connexion → Prise de RDV → Consultation de l'état → Annulation

2. **Parcours infirmier complet** :
   - Connexion FranceConnect → Consultation demandes → Acceptation → Vue Aujourd'hui → Optimisation IA → Application de la tournée

3. **Scénarios d'erreur** :
   - Email déjà utilisé
   - Mot de passe incorrect
   - Créneaux non disponibles
   - Géocodage échoué
   - Serveur indisponible

### Étape 5 : Optimisations finales

**Performance :**
- Mise en cache des rendez-vous (éviter les appels répétés)
- Lazy loading des composants lourds
- Optimisation des images (si ajoutées)
- Minification du code

**UX :**
- Loading spinners pendant les appels API
- Messages d'erreur contextuels
- Confirmation avant actions destructives
- Auto-refresh après modifications

**Sécurité :**
- Validation des inputs côté serveur
- Rate limiting sur les routes sensibles
- Logging des actions importantes
- Protection CSRF (si nécessaire)

### Étape 6 : Déploiement

**Checklist :**

1. **Variables d'environnement** :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `FRANCECONNECT_CLIENT_ID` (si FranceConnect réel)
   - `FRANCECONNECT_CLIENT_SECRET`

2. **Configuration Vercel/Netlify** :
   - Build command : `npm run build`
   - Output directory : `dist`
   - Environment variables configurées
   - Domaine personnalisé (optionnel)

3. **Configuration Supabase** :
   - Edge Function déployée
   - CORS configuré pour le domaine de production
   - Rate limits activés

4. **Configuration Google Maps** :
   - API Key restreinte au domaine
   - APIs activées : Geocoding, Distance Matrix, Maps JavaScript
   - Quota surveillé

5. **Tests post-déploiement** :
   - Toutes les routes fonctionnelles
   - Authentification OK
   - Optimiseur IA opérationnel
   - Responsive sur mobile

---

## 📝 Notes importantes

### Limites du prototype actuel

1. **Authentification simplifiée** :
   - SHA-256 pour les mots de passe (utiliser bcrypt en production)
   - FranceConnect simulé (intégration réelle nécessaire en production)
   - Pas de système de sessions persistantes (utiliser JWT ou cookies sécurisés)

2. **Base de données KV Store** :
   - Adapté pour le prototypage
   - Performances limitées à grande échelle
   - Migration vers Postgres relationnel recommandée pour production

3. **Optimiseur IA** :
   - Algorithme glouton (pas optimal à 100%)
   - Pas de prise en compte du trafic temps réel
   - Amélioration possible avec des algorithmes plus sophistiqués

4. **Pas de système de paiement** :
   - À intégrer si monétisation (Stripe, PayPal)

5. **Pas de notifications push** :
   - Uniquement notifications toast in-app
   - Intégrer email/SMS pour production

### Évolutions futures possibles

1. **Fonctionnalités avancées** :
   - Messagerie patient-infirmier
   - Visioconférence pour consultations
   - Gestion des ordonnances
   - Historique médical sécurisé
   - Signature électronique

2. **Intelligence artificielle** :
   - Prédiction de la demande par zone
   - Suggestion proactive de créneaux
   - Machine Learning sur les préférences
   - Co-optimisation multi-infirmiers

3. **Intégrations** :
   - Agenda Google/Outlook
   - Waze/Google Maps pour navigation
   - Carte Vitale (pour facturation CPAM)
   - Dossier Médical Partagé (DMP)

4. **Gamification** :
   - Système de points pour infirmiers actifs
   - Badges de récompense
   - Classement des meilleurs optimiseurs
   - Programme de fidélité patients

---

## 👥 Contributeurs

- **Développeur principal** : [Votre nom]
- **Design** : [Votre nom]
- **Algorithme IA** : [Votre nom]

---

## 📄 Licence

Ce projet est un prototype éducatif. Pour une utilisation commerciale, veuillez respecter les licences des dépendances utilisées et les réglementations RGPD.

---

## 📞 Contact

Pour toute question ou suggestion, contactez : [votre.email@example.com]

---

**Dernière mise à jour : 23 janvier 2026**

**Version du document : 1.0**

**Statut du projet : 🟡 En développement - Phase 6 (Gestion des rendez-vous)**
