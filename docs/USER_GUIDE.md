# Guide Utilisateur — CareWay

> Version : 0.1.0 | Date de rédaction : Février 2026  
> Application : CareWay — Gestion des soins infirmiers à domicile

---

## Table des matières

1. [Présentation de CareWay](#1-présentation-de-careway)
2. [Accès et connexion](#2-accès-et-connexion)
3. [Parcours Infirmier](#3-parcours-infirmier)
4. [Parcours Médecin](#4-parcours-médecin)
5. [Parcours Patient](#5-parcours-patient)
6. [Fonctionnalités clés détaillées](#6-fonctionnalités-clés-détaillées)
7. [Erreurs fréquentes et dépannage](#7-erreurs-fréquentes-et-dépannage)
8. [FAQ](#8-faq)

---

## 1. Présentation de CareWay

**CareWay** est une plateforme web de mise en relation entre **patients** et **infirmiers à domicile**. Elle permet :

- Aux **patients** de trouver un infirmier qualifié, de réserver un rendez-vous et de gérer leur dossier médical.
- Aux **infirmiers** de gérer leur planning, leurs disponibilités et d'optimiser leur tournée grâce à l'IA.
- Aux **médecins** de valider et superviser les prescriptions et interventions.

L'application est accessible depuis un navigateur web moderne (Chrome, Firefox, Edge). Aucune installation n'est requise côté utilisateur.

---

## 2. Accès et Connexion

### 2.1 URL d'accès

| Environnement | URL |
|---|---|
| Développement local | `http://localhost:5173` |
| Docker local | `http://localhost:3000` |
| Production | *(URL définie par l'équipe de déploiement)* |

### 2.2 Page d'accueil

À l'arrivée sur l'application, l'utilisateur voit la **page d'accueil** (`HomePage`) qui propose deux entrées :

- **"Je suis patient"** → vers la connexion/inscription patient
- **"Je suis infirmier/médecin"** → vers la connexion FranceConnect

> **Capture à insérer :** *Page d'accueil CareWay avec les deux boutons de sélection de rôle.*

### 2.3 Connexion Patient

1. Cliquer sur **"Je suis patient"**
2. Sur l'écran de connexion :
   - Saisir son **email** et son **mot de passe**
   - Cliquer sur **"Se connecter"**
3. Si premier accès : cliquer sur **"Créer un compte"** et remplir le formulaire d'inscription

> **Capture à insérer :** *Formulaire de connexion patient (ModernLoginForm).*

> **Capture à insérer :** *Formulaire d'inscription patient (ModernRegisterForm).*

### 2.4 Connexion Infirmier / Médecin — FranceConnect

Les infirmiers et médecins se connectent via **FranceConnect** :

1. Cliquer sur **"Je suis infirmier/médecin"**
2. La page FranceConnect s'affiche
3. Cliquer sur le bouton **"S'identifier avec FranceConnect"**
4. Suivre les étapes de FranceConnect (choix du fournisseur d'identité, saisie des identifiants)
5. Après validation, retour automatique sur CareWay avec le rôle détecté (`infirmier` ou `medecin`)

> **Capture à insérer :** *Page FranceConnect avec le bouton d'identification.*

### 2.5 Tableau des rôles

| Rôle | Méthode de connexion | Dashboard |
|---|---|---|
| `patient` | Email + mot de passe | `PatientDashboard` |
| `infirmier` | FranceConnect | `NurseDashboard` |
| `medecin` | FranceConnect | `NurseDashboard` (onglets spécifiques médecin) |

---

## 3. Parcours Infirmier

### 3.1 Vue d'ensemble du Dashboard

Après connexion, l'infirmier accède au **NurseDashboard** qui propose plusieurs sections accessibles via un menu latéral ou des onglets :

- **Mes rendez-vous** : liste des RDV confirmés, en attente, passés
- **Demandes en attente** : RDV patients non encore acceptés
- **Planning** : vue calendrier de la semaine
- **Ma tournée** : optimisation IA du trajet journalier
- **Indisponibilités** : gestion des créneaux bloqués
- **Paramètres** : réglages professionnels

> **Capture à insérer :** *NurseDashboard — vue principale avec menu latéral.*

### 3.2 Gérer les demandes de rendez-vous

1. Accéder à la section **"Demandes en attente"**
2. Chaque demande affiche : nom du patient, type de soin, date souhaitée, créneau (matin/après-midi/soir), adresse
3. Actions disponibles :
   - **Accepter** : le RDV passe au statut `confirmed`, l'infirmier est associé
   - **Refuser** : le RDV passe au statut `refused`
   - Optionnel : ajouter un **commentaire infirmier** avant de valider

> **Capture à insérer :** *Liste des demandes en attente avec boutons Accepter/Refuser.*

### 3.3 Gérer son planning

- La vue **Planning** affiche les rendez-vous confirmés par jour et créneau
- Les créneaux disponibles (matin / après-midi / soir) sont configurés dans les **Paramètres**
- Jours travaillés configurables (lundi=1 à dimanche=7)

> **Capture à insérer :** *Vue calendrier hebdomadaire du planning.*

### 3.4 Gérer les indisponibilités

1. Accéder à **"Indisponibilités"** (composant `UnavailabilityManager`)
2. Cliquer sur **"Ajouter une indisponibilité"**
3. Renseigner :
   - Date et heure de début / fin
   - Raison (optionnel)
4. Valider — le créneau est bloqué et ne peut plus recevoir de RDV

> **Capture à insérer :** *Formulaire d'ajout d'indisponibilité.*

### 3.5 Optimisation de la tournée (IA)

1. Accéder à la section **"Ma tournée"** (composant `AIRouteOptimizer`)
2. Sélectionner la **date** de tournée
3. Cliquer sur **"Optimiser la tournée"**
4. L'IA (OpenAI via Supabase Edge Functions) calcule l'ordre optimal des visites
5. Le résultat affiche : ordre des patients, temps de trajet estimé, carte interactive

> **Capture à insérer :** *Résultat d'optimisation de tournée avec carte et liste ordonnée.*

### 3.6 Paramètres professionnels

Accessibles dans **"Paramètres"** (composant `NurseSettings`) :

| Paramètre | Description |
|---|---|
| Adresse de départ | Point de départ pour le calcul de tournée |
| Mode de transport | Voiture / Vélo / Marche / Transport en commun |
| Distance max (km) | Rayon d'intervention |
| Jours travaillés | Sélection des jours de la semaine |
| Créneaux préférés | Matin / Après-midi / Soir |
| Marge de sécurité (min) | Temps tampon entre deux RDV |
| Notifications | Activer/désactiver les alertes |

---

## 4. Parcours Médecin

Le médecin utilise le même `NurseDashboard` que l'infirmier, avec des fonctionnalités supplémentaires de **supervision et validation**.

### 4.1 Validation des prescriptions

1. Accéder à la section **"Validations en attente"** (composant `MedecinValidationsModal`)
2. Chaque prescription affiche : patient, instructions, médicaments, fichier attaché
3. Actions disponibles :
   - **Valider** la prescription
   - **Rejeter** avec commentaire
   - **Télécharger** le fichier de prescription

> **Capture à insérer :** *Interface de validation des prescriptions médecin.*

### 4.2 Suivi des patients

- Consultation des dossiers médicaux des patients sous sa supervision
- Accès aux ordonnances et documents associés aux RDV

> **Note technique :** Le rôle `medecin` est défini dans l'ENUM `user_role` de la base de données. Le médecin Dr. Sophie Martin (UUID `a1b2c3d4-0000-4000-8000-000000000002`) est inséré par défaut lors de l'exécution du schéma.

---

## 5. Parcours Patient

### 5.1 Dashboard Patient

Après connexion, le patient accède au **PatientDashboard** avec les sections :

- **Mes rendez-vous** : historique et RDV à venir
- **Réserver un soin** : formulaire de prise de RDV
- **Mon profil médical** : informations de santé
- **Mes documents** : upload et consultation de documents médicaux

> **Capture à insérer :** *PatientDashboard — vue principale.*

### 5.2 Réserver un rendez-vous

1. Cliquer sur **"Réserver un soin"** (composant `AppointmentScheduler`)
2. Remplir le formulaire :
   - **Type de soin** : sélectionner dans la liste (ex : prise de sang, pansement, injection…)
   - **Date souhaitée** : sélecteur de date
   - **Créneau** : Matin / Après-midi / Soir
   - **Adresse** d'intervention (pré-remplie avec l'adresse par défaut)
   - **Commentaire** (optionnel)
3. Cliquer sur **"Confirmer la réservation"**
4. Le RDV passe en statut **"En attente"** jusqu'à l'acceptation d'un infirmier

> **Capture à insérer :** *Formulaire de réservation de soin (AppointmentScheduler).*

### 5.3 Suivi des rendez-vous

| Statut | Signification |
|---|---|
| `pending` | En attente d'acceptation par un infirmier |
| `confirmed` | Accepté par un infirmier |
| `refused` | Refusé |
| `cancelled` | Annulé |
| `done` | Effectué |

### 5.4 Gérer son profil médical

1. Accéder à **"Mon profil"** (composant `PatientProfile`)
2. Renseigner / modifier :
   - Date de naissance, groupe sanguin
   - Allergies (liste libre)
   - Maladies chroniques
   - Notes médicales
3. Cliquer sur **"Enregistrer"**

### 5.5 Gérer ses documents

1. Accéder à **"Mes documents"** (composant `DocumentUploadModal`)
2. Cliquer sur **"Ajouter un document"**
3. Sélectionner un fichier (PDF, image…)
4. Définir un nom et un type de document
5. Valider — le fichier est stocké dans le bucket Supabase `patient-documents`

---

## 6. Fonctionnalités clés détaillées

### 6.1 Carte interactive

Le composant `InteractiveMap` (Leaflet + React Leaflet) affiche :

- La position des infirmiers disponibles
- L'adresse du patient
- L'itinéraire de tournée optimisé

### 6.2 Optimisation IA des trajets

- Alimentée par **OpenAI API** via une Supabase Edge Function
- Prend en compte : mode de transport, horaires de travail, marges de sécurité, créneaux préférés
- Résultat stocké dans la table `route_optimizations`

### 6.3 Multilingue

L'interface est disponible en **français** et **anglais**.  
Le bouton de changement de langue (`LanguageSwitcher`) est accessible depuis toutes les pages.

### 6.4 Gestion des prescriptions

- Un infirmier ou médecin peut attacher une prescription à un RDV
- La prescription peut inclure une liste de médicaments (table `prescription_medications`)
- Un fichier PDF peut être joint (stocké dans Supabase Storage)

---

## 7. Erreurs fréquentes et Dépannage

### 7.1 "Impossible de charger les rendez-vous"

**Cause probable :** La clé Supabase (`VITE_SUPABASE_ANON_KEY`) est incorrecte ou le serveur Supabase est inaccessible.

**Solution :**
1. Vérifier le fichier `.env` ou `.env.development` à la racine du projet
2. Vérifier que `VITE_SUPABASE_URL` pointe vers la bonne instance
3. En mode Docker : s'assurer que les conteneurs sont démarrés avec `npm run docker:start`

### 7.2 "Page blanche au chargement"

**Cause probable :** Erreur de build ou de configuration TypeScript.

**Solution :**
```powershell
# Arrêter et relancer
npm run docker:stop
npm run docker:start

# Vérifier les logs
docker compose -f docker/docker-compose.yml logs frontend
```

### 7.3 Connexion FranceConnect échoue

**Cause probable :** En développement local, FranceConnect n'est pas configuré avec `localhost`.

**Solution :** Utiliser le compte de développement par défaut (Dr. Sophie Martin, UUID `a1b2c3d4-0000-4000-8000-000000000002`) ou configurer un mock FranceConnect.

### 7.4 Documents non téléchargés

**Cause probable :** Le bucket Supabase `patient-documents` n'a pas été créé ou les politiques d'accès (RLS) sont mal configurées.

**Solution :**
1. Dans Supabase Studio (`http://localhost:54323`) → Storage → Créer le bucket `patient-documents`
2. Configurer les politiques : voir `src/STOCKAGE_DOCUMENTS_GUIDE.md`

### 7.5 La carte ne s'affiche pas

**Cause probable :** Leaflet nécessite des tiles réseau (OpenStreetMap). En environnement hors-ligne, la carte ne se charge pas.

**Solution :** Vérifier la connexion internet du poste ou configurer des tiles locaux.

### 7.6 Port 3000 déjà utilisé

```powershell
# Identifier le processus
netstat -ano | findstr :3000
# Libérer le port
taskkill /PID <PID> /F
```

---

## 8. FAQ

**Q : Puis-je utiliser CareWay sans Docker ?**  
R : Oui. Lancez `npm run dev` après avoir configuré un projet Supabase Cloud dans le fichier `.env`. L'application sera accessible sur `http://localhost:5173`.

**Q : Comment changer la langue de l'interface ?**  
R : Utiliser le sélecteur de langue (bouton `FR` / `EN`) visible sur toutes les pages.

**Q : Un patient peut-il choisir son infirmier ?**  
R : Actuellement non. Le patient soumet une demande de RDV et un infirmier disponible l'accepte.

**Q : Les données médicales sont-elles sécurisées ?**  
R : Oui. Les données sont stockées dans une base PostgreSQL protégée par Row Level Security (RLS) de Supabase. L'authentification est gérée par GoTrue (service Supabase).

**Q : Comment annuler un rendez-vous ?**  
R : Depuis **"Mes rendez-vous"**, cliquer sur le RDV souhaité et sélectionner **"Annuler"**. Le statut passe à `cancelled`.

**Q : Où voir les emails envoyés en développement local ?**  
R : Inbucket est disponible sur `http://localhost:54324`. Tous les emails de confirmation y sont interceptés.

**Q : Le rôle médecin est-il différent du rôle infirmier dans l'interface ?**  
R : Les deux rôles utilisent le même dashboard (`NurseDashboard`). Le médecin a accès à des fonctionnalités supplémentaires de validation via `MedecinValidationsModal`.

---

*Document généré pour le projet SAE#16 — NEXUS AI Innovation Lab for Health*
