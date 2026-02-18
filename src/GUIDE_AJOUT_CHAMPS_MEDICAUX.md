# 🏥 Guide d'ajout des champs médicaux

## ✅ Ce qui a été fait

### 1. **Backend modifié** ✅
- ✅ Ajout des champs dans l'interface `Patient` (`/supabase/functions/server/database.tsx`)
- ✅ Route API GET `/api/patient/:patientId/profile` modifiée pour retourner les données médicales
- ✅ Route API PATCH `/api/patient/:patientId/profile` modifiée pour permettre la mise à jour
- ✅ Nouvelle route GET `/api/patient/:patientId/medical-info` pour l'infirmier

### 2. **Script SQL créé** ✅
Fichier : `/scripts/add-patient-medical-fields.sql`

## 🔧 Actions à effectuer

### ÉTAPE 1 : Exécuter le script SQL dans Supabase

1. Ouvrez votre **dashboard Supabase**
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `/scripts/add-patient-medical-fields.sql` :

```sql
-- Ajouter les champs médicaux à la table patients

-- Ajouter les nouvelles colonnes
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10),
ADD COLUMN IF NOT EXISTS allergies TEXT[],
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[],
ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Mettre à jour les commentaires sur les colonnes
COMMENT ON COLUMN patients.blood_type IS 'Groupe sanguin du patient (ex: A+, O-, AB+)';
COMMENT ON COLUMN patients.allergies IS 'Liste des allergies du patient';
COMMENT ON COLUMN patients.chronic_conditions IS 'Liste des pathologies chroniques du patient';
COMMENT ON COLUMN patients.medical_notes IS 'Notes médicales générales du patient';
```

4. Cliquez sur **Run** pour exécuter

### ÉTAPE 2 : Modifications frontendà faire (je vais les faire maintenant)

#### A. Modifier `AppointmentDetailsModal.tsx`
- Supprimer les mock data (lignes 59-85)
- Charger les vraies données depuis `/api/patient/:patientId/medical-info`

#### B. Modifier `PatientProfileContent.tsx`  
- Ajouter les champs :
  - Groupe sanguin (select)
  - Allergies (input chips)
  - Pathologies chroniques (input chips)
  - Notes médicales (textarea)

## 📋 Nouveaux champs disponibles

| Champ | Type | Description |
|-------|------|-------------|
| `blood_type` | VARCHAR(10) | Groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-) |
| `allergies` | TEXT[] | Liste des allergies |
| `chronic_conditions` | TEXT[] | Liste des pathologies chroniques |
| `medical_notes` | TEXT | Notes médicales générales |

## 🎯 Résultat attendu

### Pour les patients :
Dans "Informations personnelles", ils pourront renseigner :
- Leur groupe sanguin
- Leurs allergies
- Leurs pathologies chroniques  
- Des notes médicales

### Pour les infirmiers :
Quand ils cliquent sur "Voir détails" d'un rendez-vous, ils verront les **vraies données** du patient au lieu des données mockées.

---

**Prochaine étape** : Je vais maintenant modifier les composants frontend ! 🚀
