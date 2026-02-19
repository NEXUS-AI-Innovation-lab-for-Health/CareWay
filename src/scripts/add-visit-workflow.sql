-- Migration : table visit_reports pour le workflow de validation de visite
-- À exécuter dans Supabase SQL Editor APRÈS le schema.sql principal

-- Table principale de compte-rendu de visite
CREATE TABLE IF NOT EXISTS public.visit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE,

  -- Champs du compte-rendu (remplis par l'infirmier/médecin)
  actes_realises text,
  observations text,
  medicaments_administres text,
  suite_a_donner text,

  -- Qui a effectué la visite
  pm_role text NOT NULL CHECK (pm_role IN ('infirmier', 'medecin')),
  pm_id uuid NOT NULL,

  -- Workflow :
  --   awaiting_medecin  → en attente de validation médecin (si pm_role='infirmier')
  --   awaiting_patient  → en attente d'approbation patient
  --   completed         → validé par tous
  workflow_step text NOT NULL DEFAULT 'awaiting_medecin'
    CHECK (workflow_step IN ('awaiting_medecin', 'awaiting_patient', 'completed')),

  -- Validation médecin
  medecin_validated_at timestamptz,
  medecin_validator_id uuid,   -- peut être différent du pm_id

  -- Approbation patient
  patient_approved_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT visit_reports_appointment_id_fkey
    FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_visit_reports_pm_id
  ON public.visit_reports (pm_id, workflow_step);

CREATE INDEX IF NOT EXISTS idx_visit_reports_appointment
  ON public.visit_reports (appointment_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_visit_reports_updated_at ON public.visit_reports;
CREATE TRIGGER trg_visit_reports_updated_at
BEFORE UPDATE ON public.visit_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- S'assurer que le rôle 'medecin' est bien dans l'enum user_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'medecin'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'medecin';
  END IF;
END $$;
