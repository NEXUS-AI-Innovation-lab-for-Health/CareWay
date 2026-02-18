# Guide : Stockage des Documents de Santé et Ordonnances

## ✅ ÉTAT DE VOTRE BASE DE DONNÉES

Après analyse de votre schéma :
- ✅ `health_documents` - Déjà créée et conforme
- ✅ `prescription_medications` - Déjà créée et conforme  
- ⚠️ `prescriptions` - Existe mais nécessite des colonnes supplémentaires

## 🔧 MIGRATION REQUISE

### Script SQL à exécuter dans Supabase UI

Copiez-collez ce script complet dans l'éditeur SQL de Supabase :

```sql
-- Ajouter les colonnes manquantes à la table prescriptions existante
ALTER TABLE public.prescriptions 
  ADD COLUMN IF NOT EXISTS infirmier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prescription_date DATE,
  ADD COLUMN IF NOT EXISTS file_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Mettre à jour prescription_date pour les prescriptions existantes (basé sur created_at)
UPDATE public.prescriptions 
SET prescription_date = created_at::DATE 
WHERE prescription_date IS NULL;

-- Rendre prescription_date NOT NULL après avoir rempli les valeurs
ALTER TABLE public.prescriptions 
  ALTER COLUMN prescription_date SET NOT NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prescriptions_infirmier ON public.prescriptions(infirmier_id);

-- Optionnel : Rendre instructions NULLABLE si vous ne voulez pas forcer ce champ
-- ALTER TABLE public.prescriptions ALTER COLUMN instructions DROP NOT NULL;
```

### Structure finale de la table `prescriptions`

Après migration, voici la structure complète :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `patient_id` | UUID | Référence au patient |
| **`appointment_id`** | UUID | Référence au rendez-vous (existant) |
| **`infirmier_id`** | UUID | Référence à l'infirmier (nouveau) |
| **`prescription_date`** | DATE | Date de l'ordonnance (nouveau) |
| **`file_path`** | VARCHAR(500) | Chemin du PDF scanné (nouveau) |
| **`instructions`** | TEXT | Instructions textuelles (existant) |
| **`notes`** | TEXT | Notes supplémentaires (nouveau) |
| `created_at` | TIMESTAMPTZ | Date de création |

### ⚠️ Notes importantes

1. **`appointment_id`** : Votre table lie déjà les prescriptions aux rendez-vous, ce qui est logique
2. **`instructions`** : Champ existant (TEXT NOT NULL) - on le garde
3. **Nouvelles colonnes** :
   - `infirmier_id` : Pour savoir quel infirmier a créé l'ordonnance
   - `prescription_date` : Date de l'ordonnance (important pour l'historique)
   - `file_path` : Pour stocker le PDF de l'ordonnance scannée
   - `notes` : Notes supplémentaires

## 📡 API Routes Disponibles

### Documents de Santé

#### GET `/make-server-1b83ce4c/health-documents/:patientId`
Récupère tous les documents de santé d'un patient avec URLs signées

#### POST `/make-server-1b83ce4c/health-documents/:patientId`
Upload un nouveau document (multipart/form-data)
- `file` : Le fichier (max 10MB)
- `name` : Nom du document
- `documentType` : Type ('assurance', 'resultat', 'certificat', 'autre')
- `notes` : Notes optionnelles

#### DELETE `/make-server-1b83ce4c/health-documents/:patientId/:documentId`
Supprime un document (fichier + métadonnées)

### Ordonnances

#### GET `/make-server-1b83ce4c/prescriptions/:patientId`
Récupère toutes les ordonnances avec médicaments et infirmier

#### POST `/make-server-1b83ce4c/prescriptions/:patientId`
Crée une ordonnance avec médicaments (JSON)
```json
{
  "infirmierId": "uuid-optional",
  "prescriptionDate": "2026-01-28",
  "medications": [
    {
      "name": "Paracétamol 1g",
      "dosage": "1g",
      "frequency": "3x/jour",
      "duration": "pendant 7 jours",
      "instructions": "À prendre pendant les repas"
    }
  ],
  "notes": "Notes optionnelles"
}
```

#### DELETE `/make-server-1b83ce4c/prescriptions/:patientId/:prescriptionId`
Supprime une ordonnance (cascade sur médicaments)

## 💾 Structure des Données

### HealthDocument
```typescript
{
  id: string;
  patient_id: string;
  name: string;
  document_type: string;
  file_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
  downloadUrl?: string; // Ajouté par l'API
}
```

### Prescription avec Médicaments
```typescript
{
  id: string;
  patient_id: string;
  infirmier_id: string | null;
  prescription_date: string;
  file_path: string | null;
  notes: string | null;
  created_at: string;
  downloadUrl?: string; // Ajouté par l'API
  medications: Array<{
    id: string;
    prescription_id: string;
    medication_name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
  }>;
  infirmier?: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}
```

## 🔒 Sécurité

- Les buckets Storage sont **privés**
- Les URLs sont **signées** avec expiration de 1 heure
- Les fichiers sont organisés par patient : `{patientId}/{timestamp}-{uuid}.{ext}`
- Suppression en cascade : supprimer un patient supprime ses documents
- Taille max des fichiers : 10MB

## 📝 Exemple d'utilisation Frontend

```typescript
// Upload un document
const uploadDocument = async (patientId: string, file: File, name: string, type: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('documentType', type);
  formData.append('notes', 'Notes optionnelles');
  
  const response = await fetch(
    `${baseUrl}/health-documents/${patientId}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      body: formData
    }
  );
  
  return await response.json();
};

// Récupérer les documents
const getDocuments = async (patientId: string) => {
  const response = await fetch(
    `${baseUrl}/health-documents/${patientId}`,
    { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
  );
  
  const data = await response.json();
  return data.documents; // Contient downloadUrl pour chaque document
};

// Créer une ordonnance
const createPrescription = async (patientId: string, data: any) => {
  const response = await fetch(
    `${baseUrl}/prescriptions/${patientId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(data)
    }
  );
  
  return await response.json();
};
```

## ✅ Prochaines étapes

1. **Exécuter le script SQL** dans Supabase UI pour mettre à jour la table `prescriptions`
2. Les buckets seront créés automatiquement au premier upload
3. Implémenter l'UI frontend pour :
   - Upload de documents avec glisser-déposer
   - Liste des documents avec téléchargement
   - Formulaire de création d'ordonnance
   - Affichage des ordonnances et médicaments

Le backend est prêt à utiliser dès que les tables sont créées ! 🚀