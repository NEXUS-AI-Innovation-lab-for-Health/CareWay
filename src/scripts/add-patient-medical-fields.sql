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
