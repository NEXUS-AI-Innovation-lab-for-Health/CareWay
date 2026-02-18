# 🔄 Guide de Migration vers les Tables SQL

## ✅ Ce qui a été fait

J'ai complètement réécrit le backend pour utiliser tes **vraies tables SQL** au lieu du KV store :

### 1. Nouveau fichier `/supabase/functions/server/database.tsx`
Ce fichier contient toutes les fonctions pour interagir avec tes tables SQL :
- `createUser()`, `getUserByEmail()`, `getAllUsers()`
- `createPatient()`, `getPatientByUserId()`, `getAllPatients()`
- `createInfirmier()`, `getInfirmierByUserId()`, `getAllInfirmiers()`
- `createInfirmierSettings()`, `getInfirmierSettings()`, `updateInfirmierSettings()`
- `createUnavailability()`, `getUnavailabilities()`, `deleteUnavailability()`
- `getAllCareTypes()`, `getCareTypeByName()`, `createCareType()`
- `createAppointment()`, `getAppointmentsByPatient()`, `getAppointmentsByInfirmier()`
- Et plus encore...

### 2. Nouveau serveur `/supabase/functions/server/index.tsx`
Le serveur a été complètement réécrit pour utiliser :
- **Supabase Auth** pour l'authentification des patients (plus sécurisé)
- **Tables SQL** pour toutes les données
- Routes de debug pour vérifier les données

### 3. Frontend adapté
- `ModernRegisterForm` : Envoie maintenant `firstName` et `lastName` séparément
- `DatabaseDebug` : Affiche les données des vraies tables SQL

---

## 🚀 Étapes pour finaliser la migration

### Étape 1 : Initialiser les types de soins

Dans **Supabase Dashboard** → **SQL Editor**, exécute ce script :

```sql
-- Initialisation des types de soins
INSERT INTO care_types (name) VALUES
  ('Injection'),
  ('Prise de sang'),
  ('Administration de médicaments'),
  ('Gestion des pansements'),
  ('Suivi d''une maladie chronique'),
  ('Vaccination'),
  ('Soins post-opératoires'),
  ('Perfusion')
ON CONFLICT (name) DO NOTHING;
```

### Étape 2 : Vérifier que Supabase Auth est activé

1. Va dans **Supabase Dashboard** → **Authentication** → **Settings**
2. Assure-toi que **Enable email confirmations** est **DÉSACTIVÉ** (pour dev)
3. **Enable signup** doit être **ACTIVÉ**

### Étape 3 : Tester l'inscription patient

1. Ouvre ton application
2. Clique sur "Je suis un patient"
3. Clique sur "S'inscrire"
4. Remplis le formulaire :
   - Prénom : `Jean`
   - Nom : `Dupont`
   - Email : `jean.dupont@test.fr`
   - Mot de passe : `test123`
   - Confirmer : `test123`
5. Clique sur "S'inscrire"

### Étape 4 : Vérifier dans le panneau de debug

1. Clique sur le bouton "Actualiser les données" dans le panneau bleu en bas à droite
2. Tu devrais voir ton patient apparaître avec toutes ses infos

### Étape 5 : Vérifier dans Supabase Dashboard

1. Va dans **Authentication** → **Users** : Tu verras l'utilisateur Auth
2. Va dans **Database** → **Table Editor** → **users** : Tu verras l'entrée dans la table users
3. Va dans **Table Editor** → **patients** : Tu verras l'entrée patient liée

### Étape 6 : Tester la connexion

1. Utilise les mêmes identifiants : `jean.dupont@test.fr` / `test123`
2. Tu devrais être connecté et voir le dashboard patient

---

## 📊 Structure de ta base de données

### Tables principales

#### `users` (table mère)
- `id` (uuid, PK)
- `role` (enum : 'patient' | 'infirmier')
- `email` (text)
- `phone` (text)
- `first_name` (text)
- `last_name` (text)
- `created_at` (timestamp)

#### `patients` (hérite de users)
- `user_id` (uuid, FK → users.id)
- `default_address` (text)
- `preferred_language` (text)
- `birthdate` (date)

#### `infirmiers` (hérite de users)
- `user_id` (uuid, FK → users.id)

#### `infirmier_settings`
- `infirmier_id` (uuid, FK → infirmiers.user_id)
- `start_address` (text)
- `start_lat` (double)
- `start_lng` (double)
- `transport` (enum : 'car' | 'bike' | 'transit' | 'walking')
- `max_distance_km` (int)
- `working_days` (array int)
- `preferred_slots` (array time_slot)
- `disliked_slots` (array time_slot)
- `break_every_minutes` (int)
- `break_duration_minutes` (int)
- `safety_margin_minutes` (int)
- `notifications_enabled` (bool)

#### `infirmier_unavailability`
- `id` (uuid, PK)
- `infirmier_id` (uuid, FK)
- `start_at` (timestamp)
- `end_at` (timestamp)
- `reason` (text)

#### `appointments`
- `id` (uuid, PK)
- `patient_id` (uuid, FK)
- `infirmier_id` (uuid, FK)
- `status` (enum : 'pending' | 'confirmed' | 'cancelled' | 'completed')
- `date` (date)
- `slot` (enum : 'morning' | 'afternoon' | 'evening')
- `care_type_id` (uuid, FK)
- `address` (text)
- `duration_minutes` (int)
- `patient_comment` (text)
- `infirmier_comment` (text)

#### `care_types`
- `id` (uuid, PK)
- `name` (text, UNIQUE)

---

## 🔐 Authentification

### Patients : Supabase Auth

Les patients utilisent maintenant **Supabase Auth** :
- Inscription : `supabase.auth.signUp()`
- Connexion : `supabase.auth.signInWithPassword()`
- Les mots de passe sont hashés et stockés par Supabase (très sécurisé)
- Une entrée est créée dans **Authentication → Users**
- Une entrée liée est créée dans ta table **users**
- Une entrée liée est créée dans ta table **patients**

### Infirmiers : FranceConnect (simulation)

Les infirmiers utilisent FranceConnect :
- Pas de mot de passe stocké
- Authentification via `franceConnectId`
- Création automatique du compte à la première connexion

---

## 🧪 Routes API disponibles

### Debug (à retirer en production)
- `GET /debug/users` - Liste tous les utilisateurs
- `GET /debug/patients` - Liste tous les patients
- `GET /debug/infirmiers` - Liste tous les infirmiers

### Authentication
- `POST /api/patient/signup` - Inscription patient (Supabase Auth)
- `POST /api/patient/login` - Connexion patient (Supabase Auth)
- `POST /api/nurse/franceconnect` - Authentification infirmier

### Infirmier Settings
- `GET /infirmier/:id/settings` - Récupérer paramètres
- `PUT /infirmier/:id/settings` - Modifier paramètres

### Unavailabilities
- `GET /unavailabilities/:infirmierId` - Liste
- `POST /unavailabilities/:infirmierId` - Ajouter
- `DELETE /unavailabilities/:infirmierId/:id` - Supprimer

### Care Types
- `GET /care-types` - Liste tous les types de soins

### Appointments
- `GET /appointments/patient/:patientId` - RDV d'un patient
- `GET /appointments/infirmier/:infirmierId` - RDV d'un infirmier
- `GET /appointments/pending/:infirmierId` - Demandes en attente
- `POST /appointments` - Créer un RDV
- `PATCH /appointments/:id` - Modifier un RDV
- `DELETE /appointments/:id` - Annuler un RDV (change status)

---

## ⚠️ Points importants

### 1. Supabase Auth vs Tables SQL

**Supabase Auth** gère :
- Hachage des mots de passe
- Sessions et tokens JWT
- Confirmations d'email (si activé)
- Réinitialisation de mot de passe

**Tes tables SQL** gèrent :
- Toutes les données métier (profils, rendez-vous, etc.)
- Relations entre entités
- Logique métier complexe

### 2. Synchronisation Auth ↔ Database

Quand un patient s'inscrit :
1. Création dans **Supabase Auth** (email/password)
2. Création dans **table users** (id, role, email, first_name, last_name)
3. Création dans **table patients** (user_id, default_address)

**Important** : L'`id` dans Supabase Auth et l'`id` dans ta table users sont différents !
- Supabase Auth a son propre système d'ID
- Ta table users a des UUID générés par `gen_random_uuid()`

### 3. Sécurité

✅ **Bon** :
- Mots de passe hashés par Supabase Auth
- Tokens JWT pour les sessions
- Service Role Key utilisée côté serveur uniquement

❌ **À ne JAMAIS faire** :
- Exposer la Service Role Key au frontend
- Stocker des mots de passe en clair
- Utiliser l'Anon Key pour des opérations sensibles

---

## 🐛 Dépannage

### Erreur : "User already registered"
→ L'email existe déjà dans Supabase Auth. Va dans **Authentication → Users** et supprime l'utilisateur.

### Erreur : "Failed to create user"
→ Vérifie que tes tables existent et que les foreign keys sont correctes.

### Erreur : "permission denied"
→ Tu dois peut-être configurer les RLS (Row Level Security) policies. Pendant le dev, tu peux les désactiver :
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE infirmiers DISABLE ROW LEVEL SECURITY;
-- etc.
```

### Aucune donnée n'apparaît dans le panneau de debug
→ Ouvre la console du navigateur (F12) et regarde les erreurs. Vérifie aussi les logs Supabase.

---

## 🎉 Prochaines étapes

Une fois que l'authentification fonctionne, il faudra :

1. ✅ Connecter `PatientDashboard` au backend (afficher les vrais rendez-vous)
2. ✅ Connecter `NurseDashboard` au backend (afficher les vraies demandes)
3. ✅ Implémenter la création de rendez-vous
4. ✅ Implémenter l'acceptation/refus de demandes
5. ✅ Adapter l'optimiseur IA pour utiliser les vraies données
6. ✅ Tester tous les parcours utilisateur

---

## 📝 Aide supplémentaire

Si tu rencontres des problèmes :
1. Vérifie les logs dans la console du navigateur (F12)
2. Vérifie les logs Supabase : **Logs → Edge Functions**
3. Utilise le panneau de debug pour vérifier l'état de la base
4. Teste les routes API avec un outil comme Postman ou directement dans le panneau de debug

**Bon courage ! 🚀**
