# Modèle de Données — CareWay

> Base de données : **PostgreSQL 15** (via Supabase)  
> Source : `db/schema.sql`  
> Date de rédaction : Février 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [ENUMs](#2-enums)
3. [Tables](#3-tables)
4. [Relations — Schéma logique ASCII](#4-relations--schéma-logique-ascii)
5. [Index](#5-index)
6. [Triggers](#6-triggers)
7. [Exemple complet — Un RDV et ses liaisons](#7-exemple-complet--un-rdv-et-ses-liaisons)
8. [Tables utilisées dans le code mais absentes du SQL](#8-tables-utilisées-dans-le-code-mais-absentes-du-sql)

---

## 1. Vue d'ensemble

La base de données unique est hébergée sur **Supabase (PostgreSQL 15)**. Elle gère :

- L'ensemble des utilisateurs et leurs profils (patients, infirmiers, médecins)
- Les rendez-vous et leurs statuts
- Les prescriptions et médicaments
- Les documents de santé uploadés
- Les paramètres et indisponibilités des infirmiers
- Les optimisations de tournée (résultats IA)
- Un KV Store générique pour les configurations applicatives

**Extension activée :** `pgcrypto` (génération d'UUID v4 via `gen_random_uuid()`)

---

## 2. ENUMs

### `user_role`
```sql
ENUM ('patient', 'infirmier', 'medecin')
```
> Note : `medecin` est ajouté après la création initiale par un `ALTER TYPE`.

### `transport_mode`
```sql
ENUM ('car', 'bike', 'walk', 'public_transport')
```

### `time_slot`
```sql
ENUM ('morning', 'afternoon', 'evening')
```

### `appointment_status`
```sql
ENUM ('pending', 'confirmed', 'refused', 'cancelled', 'done')
```

---

## 3. Tables

### 3.1 `users` — Table centrale des utilisateurs

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| `role` | user_role | NOT NULL | Rôle : patient / infirmier / medecin |
| `email` | text | — | Adresse email |
| `phone` | text | — | Téléphone |
| `first_name` | text | NOT NULL | Prénom |
| `last_name` | text | NOT NULL | Nom de famille |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

---

### 3.2 `patients` — Profil médical du patient

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `user_id` | uuid | PK, FK → users(id) ON DELETE CASCADE | Lien vers users |
| `default_address` | text | — | Adresse domicile par défaut |
| `preferred_language` | text | — | Langue préférée (fr/en) |
| `birthdate` | date | — | Date de naissance |
| `blood_type` | varchar | — | Groupe sanguin |
| `allergies` | text[] | — | Tableau d'allergies |
| `chronic_conditions` | text[] | — | Maladies chroniques |
| `medical_notes` | text | — | Notes libres |

---

### 3.3 `infirmiers` — Identité professionnelle infirmier/médecin

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `user_id` | uuid | PK, FK → users(id) ON DELETE CASCADE | Lien vers users |

> Cette table sert de point d'ancrage pour infirmiers ET médecins. Les paramètres professionnels sont dans `infirmier_settings`.

---

### 3.4 `care_types` — Types de soins disponibles

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Identifiant |
| `name` | text | NOT NULL, UNIQUE | Nom du soin (ex : "Pansement", "Injection") |

---

### 3.5 `infirmier_care_durations` — Durée par type de soin

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `infirmier_id` | uuid | PK partielle, FK → infirmiers(user_id) CASCADE | Infirmier concerné |
| `care_type_id` | uuid | PK partielle, FK → care_types(id) CASCADE | Type de soin |
| `duration_minutes` | integer | NOT NULL | Durée en minutes |

> Clé primaire composite : `(infirmier_id, care_type_id)`

---

### 3.6 `infirmier_settings` — Paramètres de l'infirmier

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `infirmier_id` | uuid | PK, FK → infirmiers(user_id) CASCADE | Infirmier |
| `start_address` | text | — | Adresse de départ de tournée |
| `start_lat` / `start_lng` | double precision | — | Coordonnées GPS du départ |
| `transport` | transport_mode | NOT NULL, DEFAULT 'car' | Mode de transport |
| `max_distance_km` | integer | NOT NULL, DEFAULT 10 | Rayon d'intervention |
| `working_days` | integer[] | NOT NULL, DEFAULT '{1,2,3,4,5}' | Jours travaillés (1=lundi) |
| `preferred_slots` | time_slot[] | DEFAULT '{morning,afternoon}' | Créneaux préférés |
| `disliked_slots` | time_slot[] | DEFAULT '{}' | Créneaux non souhaités |
| `break_every_minutes` | integer | — | Fréquence des pauses |
| `break_duration_minutes` | integer | — | Durée d'une pause |
| `safety_margin_minutes` | integer | NOT NULL, DEFAULT 10 | Marge de sécurité entre RDV |
| `notifications_enabled` | boolean | NOT NULL, DEFAULT false | Notifications actives |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Dernière modification |

---

### 3.7 `infirmier_unavailability` — Indisponibilités

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `infirmier_id` | uuid | FK → infirmiers(user_id) CASCADE | Infirmier concerné |
| `start_at` | timestamptz | NOT NULL | Début d'indisponibilité |
| `end_at` | timestamptz | NOT NULL, CHECK (end_at > start_at) | Fin d'indisponibilité |
| `reason` | text | — | Motif (optionnel) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

---

### 3.8 `appointments` — Rendez-vous (table centrale)

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant du RDV |
| `patient_id` | uuid | FK → patients(user_id) CASCADE | Patient |
| `infirmier_id` | uuid | FK → infirmiers(user_id) SET NULL | Infirmier (null si non attribué) |
| `status` | appointment_status | NOT NULL, DEFAULT 'pending' | Statut du RDV |
| `date` | date | NOT NULL | Date du RDV |
| `slot` | time_slot | NOT NULL | Créneau : matin/après-midi/soir |
| `care_type_id` | uuid | FK → care_types(id) | Type de soin demandé |
| `language` | text | — | Langue de préférence |
| `address` | text | NOT NULL | Adresse d'intervention |
| `duration_minutes` | integer | — | Durée planifiée |
| `patient_comment` | text | — | Commentaire patient |
| `infirmier_comment` | text | — | Commentaire infirmier |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Création |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Dernière modification (trigger) |

---

### 3.9 `medical_records` — Dossier médical textuel

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `patient_id` | uuid | PK, FK → patients(user_id) CASCADE | Patient (1 dossier par patient) |
| `content` | text | — | Contenu libre du dossier |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Dernière modification |

---

### 3.10 `prescriptions` — Ordonnances

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `patient_id` | uuid | FK → patients(user_id) CASCADE | Patient |
| `appointment_id` | uuid | FK → appointments(id) SET NULL | RDV associé (optionnel) |
| `infirmier_id` | uuid | FK → users(id) SET NULL | Prescripteur |
| `instructions` | text | NOT NULL | Instructions de soin |
| `prescription_date` | date | NOT NULL | Date de l'ordonnance |
| `file_path` | varchar | — | Chemin du fichier PDF (Supabase Storage) |
| `notes` | text | — | Notes complémentaires |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Création |

---

### 3.11 `prescription_medications` — Médicaments d'une ordonnance

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `prescription_id` | uuid | FK → prescriptions(id) CASCADE | Ordonnance parente |
| `medication_name` | varchar | NOT NULL | Nom du médicament |
| `dosage` | varchar | — | Posologie |
| `frequency` | varchar | — | Fréquence de prise |
| `duration` | varchar | — | Durée du traitement |
| `instructions` | text | — | Instructions spécifiques |

---

### 3.12 `health_documents` — Documents médicaux uploadés

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `patient_id` | uuid | FK → users(id) CASCADE | Patient |
| `name` | varchar | NOT NULL | Nom affiché |
| `document_type` | varchar | NOT NULL | Type (ordonnance, résultat, etc.) |
| `file_path` | varchar | — | Chemin dans Supabase Storage |
| `file_size_bytes` | integer | — | Taille du fichier |
| `mime_type` | varchar | — | Type MIME |
| `uploaded_at` | timestamptz | DEFAULT now() | Date d'upload |
| `notes` | text | — | Notes |
| `created_at` | timestamptz | DEFAULT now() | Création |

---

### 3.13 `route_optimizations` — Résultats IA de tournée

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | Identifiant |
| `infirmier_id` | uuid | FK → infirmiers(user_id) CASCADE | Infirmier |
| `date` | date | NOT NULL | Date de la tournée |
| `input` | jsonb | NOT NULL | Données d'entrée envoyées à l'IA |
| `output` | jsonb | — | Réponse de l'IA (ordre optimisé) |
| `status` | text | NOT NULL, DEFAULT 'pending' | État : pending / done / error |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Création |

---

### 3.14 `kv_store_1b83ce4c` — Clé-Valeur générique

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `key` | text | PK | Clé |
| `value` | jsonb | NOT NULL | Valeur JSON |

> Utilisé pour stocker des configurations applicatives côté serveur (Edge Functions Supabase).

---

## 4. Relations — Schéma logique ASCII

```
┌──────────────────────────────────────────────────────────────────────┐
│                            users                                     │
│  id (PK)  |  role  |  email  |  first_name  |  last_name  | ...     │
└──────┬─────────────────────────────────┬───────────────────────────┘
       │ 1:1 (patient)                   │ 1:1 (infirmier/medecin)
       ▼                                 ▼
┌─────────────────┐             ┌──────────────────────┐
│    patients     │             │      infirmiers       │
│  user_id (PK,FK)│             │  user_id (PK,FK)     │
│  default_address│             └───┬──────────────┬───┘
│  birthdate      │                 │              │
│  blood_type     │                 │              │
│  allergies[]    │         ┌───────┘              └────────────┐
│  chronic_cond[] │         ▼                                   ▼
└──────┬──────────┘ ┌───────────────────┐    ┌─────────────────────────┐
       │            │ infirmier_settings│    │infirmier_unavailability │
       │            │ infirmier_id (PK) │    │ id (PK)                 │
       │            │ transport         │    │ infirmier_id (FK)       │
       │            │ working_days[]    │    │ start_at / end_at       │
       │            └───────────────────┘    └─────────────────────────┘
       │
       │  1:N                     N:1
       ▼                           ▲
┌───────────────────────────────────────────────────────┐
│                     appointments                       │
│  id (PK)                                              │
│  patient_id (FK → patients)                           │
│  infirmier_id (FK → infirmiers) [nullable]            │
│  care_type_id (FK → care_types)                       │
│  status | date | slot | address | duration_minutes    │
└───────────────┬───────────────────────────────────────┘
                │ 1:N
                ▼
      ┌─────────────────┐           ┌──────────────────────┐
      │  prescriptions  │           │     care_types        │
      │  id (PK)        │           │  id (PK)             │
      │  patient_id(FK) │           │  name (UNIQUE)        │
      │  appointment_id │           └──────────────────────┘
      │  infirmier_id   │                    ▲  1:N
      │  file_path      │                    │
      └────────┬────────┘     ┌──────────────┴──────────────┐
               │ 1:N          │  infirmier_care_durations    │
               ▼              │  (infirmier_id, care_type_id)│
  ┌──────────────────────┐    │  duration_minutes            │
  │prescription_medications│  └─────────────────────────────┘
  │  id (PK)             │
  │  prescription_id (FK)│
  │  medication_name     │
  └──────────────────────┘

patients ──1:1──► medical_records
patients ──1:N──► health_documents
infirmiers ──1:N──► route_optimizations
```

---

## 5. Index

| Index | Table | Colonnes | Usage |
|---|---|---|---|
| `idx_appointments_patient_date` | `appointments` | `patient_id, date` | Récupération des RDV d'un patient |
| `idx_appointments_infirmier_date` | `appointments` | `infirmier_id, date` | Planning d'un infirmier |
| `idx_infirmier_unavailability_infirmier` | `infirmier_unavailability` | `infirmier_id` | Indisponibilités d'un infirmier |
| `idx_prescriptions_patient_date` | `prescriptions` | `patient_id, prescription_date` | Ordonnances d'un patient |
| `idx_route_optimizations_infirmier_date` | `route_optimizations` | `infirmier_id, date` | Tournées d'un infirmier |

---

## 6. Triggers

### `set_updated_at()` — Mise à jour automatique de `updated_at`

Fonction PL/pgSQL appliquée sur 3 tables :

| Trigger | Table |
|---|---|
| `trg_appointments_updated_at` | `appointments` |
| `trg_infirmier_settings_updated_at` | `infirmier_settings` |
| `trg_medical_records_updated_at` | `medical_records` |

---

## 7. Exemple complet — Un RDV et ses liaisons

### Contexte

Marie Dupont (patient) réserve une prise de sang le 10 mars 2026 matin, à son domicile. L'infirmier Jean Leclerc accepte le RDV.

### Enregistrement dans `appointments`

```json
{
  "id": "f3a1bc20-1234-4abc-9def-000000000001",
  "patient_id": "c5d2ef01-aaaa-4bbb-cccc-111111111111",
  "infirmier_id": "d9e3fa02-bbbb-4ccc-dddd-222222222222",
  "status": "confirmed",
  "date": "2026-03-10",
  "slot": "morning",
  "care_type_id": "e0f4ab03-cccc-4ddd-eeee-333333333333",
  "language": "fr",
  "address": "12 rue de la Paix, 75001 Paris",
  "duration_minutes": 30,
  "patient_comment": "Je suis à jeun depuis ce matin",
  "infirmier_comment": null,
  "created_at": "2026-03-05T09:15:00Z",
  "updated_at": "2026-03-06T11:00:00Z"
}
```

### Tables liées à ce RDV

| Table | Clé | Valeur exemple |
|---|---|---|
| `users` | `id = c5d2ef01-...` | Marie Dupont, role=patient |
| `users` | `id = d9e3fa02-...` | Jean Leclerc, role=infirmier |
| `patients` | `user_id = c5d2ef01-...` | blood_type=A+, allergies=[] |
| `infirmiers` | `user_id = d9e3fa02-...` | (présent) |
| `care_types` | `id = e0f4ab03-...` | name="Prise de sang" |
| `infirmier_care_durations` | `(d9e3fa02-..., e0f4ab03-...)` | duration_minutes=30 |

### Comment l'application récupère ces données

```typescript
// src/services/api.tsx
// 1. Récupérer les RDV du patient
const appointments = await getPatientAppointments(patientId);
// → GET /appointments/patient/:patientId

// 2. Chaque appointment contient les UUIDs liés
// L'UI les résout via les types CareType, utilisateur, etc.

// 3. Pour l'infirmier : récupérer ses RDV confirmés
const myAppointments = await getInfirmierAppointments(infirmierId);
// → GET /appointments/infirmier/:infirmierId
```

La jointure est effectuée côté **Edge Function Supabase** (backend), pas directement dans le frontend.

---

## 8. Tables utilisées dans le code mais absentes du SQL

| Table / Concept | Fichier source | Note |
|---|---|---|
| `auth.users` (Supabase Auth) | Authentification GoTrue | Non défini dans `schema.sql` — gérée automatiquement par Supabase GoTrue. La table `public.users` est une extension applicative. |
| `storage.objects` | Supabase Storage | Gestion des fichiers uploadés (health_documents, prescriptions). Gérée par Supabase Storage, non dans `schema.sql`. |
| Bucket `patient-documents` | `src/STOCKAGE_DOCUMENTS_GUIDE.md` | Doit être créé manuellement dans Supabase Studio. |

> Pour les scripts de données de démonstration, consulter `src/demo-data-script.sql` (référencé dans le README mais absent du dépôt lors de l'analyse — vérifier dans `src/`).

---

*Document généré pour le projet SAE#16 — NEXUS AI Innovation Lab for Health*
