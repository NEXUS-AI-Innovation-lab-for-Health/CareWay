-- schéma SQL complet mis à jour pour Supabase
BEGIN;

-- Required for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------
-- ENUM TYPES
-- ---------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('patient', 'infirmier', 'medecin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_mode') THEN
        CREATE TYPE public.transport_mode AS ENUM ('car', 'bike', 'walk', 'public_transport');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_slot') THEN
        CREATE TYPE public.time_slot AS ENUM ('morning', 'afternoon', 'evening');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'refused', 'cancelled', 'done');
    END IF;
END $$;

-- ---------------------------
-- TABLES DE BASE
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role public.user_role NOT NULL,
    email text UNIQUE,
    phone text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patients (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    default_address text,
    preferred_language text,
    birthdate date,
    blood_type varchar,
    allergies text[], -- Changé ARRAY en text[] pour la compatibilité
    chronic_conditions text[],
    medical_notes text
);

CREATE TABLE IF NOT EXISTS public.infirmiers (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.care_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);

-- ---------------------------
-- PARAMÈTRES ET DISPONIBILITÉS
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.infirmier_care_durations (
    infirmier_id uuid NOT NULL REFERENCES public.infirmiers(user_id) ON DELETE CASCADE,
    care_type_id uuid NOT NULL REFERENCES public.care_types(id) ON DELETE CASCADE,
    duration_minutes integer NOT NULL,
    PRIMARY KEY (infirmier_id, care_type_id)
);

CREATE TABLE IF NOT EXISTS public.infirmier_settings (
    infirmier_id uuid PRIMARY KEY REFERENCES public.infirmiers(user_id) ON DELETE CASCADE,
    start_address text,
    start_lat double precision,
    start_lng double precision,
    transport public.transport_mode NOT NULL DEFAULT 'car',
    max_distance_km integer NOT NULL DEFAULT 10,
    working_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
    preferred_slots public.time_slot[] NOT NULL DEFAULT '{morning,afternoon}',
    disliked_slots public.time_slot[] NOT NULL DEFAULT '{}',
    break_every_minutes integer,
    break_duration_minutes integer,
    safety_margin_minutes integer NOT NULL DEFAULT 10,
    notifications_enabled boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.infirmier_unavailability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    infirmier_id uuid NOT NULL REFERENCES public.infirmiers(user_id) ON DELETE CASCADE,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT infirmier_unavailability_time_check CHECK (end_at > start_at)
);

-- ---------------------------
-- RENDEZ-VOUS ET SUIVI
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    infirmier_id uuid REFERENCES public.infirmiers(user_id) ON DELETE SET NULL,
    status public.appointment_status NOT NULL DEFAULT 'pending',
    date date NOT NULL,
    slot public.time_slot NOT NULL,
    care_type_id uuid NOT NULL REFERENCES public.care_types(id),
    language text,
    address text NOT NULL,
    duration_minutes integer,
    patient_comment text,
    infirmier_comment text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visit_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    actes_realises text,
    observations text,
    medicaments_administres text,
    suite_a_donner text,
    workflow_data jsonb,
    pm_role text NOT NULL CHECK (pm_role IN ('infirmier', 'medecin')),
    pm_id uuid NOT NULL,
    workflow_step text NOT NULL DEFAULT 'awaiting_medecin' CHECK (workflow_step IN ('awaiting_medecin', 'awaiting_patient', 'completed')),
    medecin_validated_at timestamptz,
    medecin_validator_id uuid REFERENCES public.users(id),
    patient_approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------
-- DOSSIER MÉDICAL ET DOCUMENTS
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.medical_records (
    patient_id uuid PRIMARY KEY REFERENCES public.patients(user_id) ON DELETE CASCADE,
    content text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    instructions text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    infirmier_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    prescription_date date NOT NULL,
    file_path varchar,
    notes text
);

CREATE TABLE IF NOT EXISTS public.prescription_medications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medication_name varchar NOT NULL,
    dosage varchar,
    frequency varchar,
    duration varchar,
    instructions text
);

CREATE TABLE IF NOT EXISTS public.health_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name varchar NOT NULL,
    document_type varchar NOT NULL,
    file_path varchar,
    file_size_bytes integer,
    mime_type varchar,
    uploaded_at timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- ---------------------------
-- OPTIMISATION ET UTILITAIRES
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.route_optimizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    infirmier_id uuid NOT NULL REFERENCES public.infirmiers(user_id) ON DELETE CASCADE,
    date date NOT NULL,
    input jsonb NOT NULL,
    output jsonb,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kv_store_1b83ce4c (
    key text PRIMARY KEY,
    value jsonb NOT NULL
);

-- ---------------------------
-- SEED DATA : Docteur Sophie Martin
-- ---------------------------
DO $$
DECLARE
    sophie_id uuid := 'a1b2c3d4-0000-4000-8000-000000000002';
BEGIN
    INSERT INTO public.users (id, role, email, first_name, last_name)
    VALUES (sophie_id, 'medecin', 'dr.sophie.martin@medecin.fr', 'Sophie', 'Martin')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.infirmiers (user_id)
    VALUES (sophie_id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.infirmier_settings (infirmier_id)
    VALUES (sophie_id)
    ON CONFLICT (infirmier_id) DO NOTHING;
END $$;

-- ---------------------------
-- INDEXES
-- ---------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments (patient_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_infirmier_date ON public.appointments (infirmier_id, date);
CREATE INDEX IF NOT EXISTS idx_infirmier_unavailability_infirmier ON public.infirmier_unavailability (infirmier_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date ON public.prescriptions (patient_id, prescription_date);
CREATE INDEX IF NOT EXISTS idx_route_optimizations_infirmier_date ON public.route_optimizations (infirmier_id, date);
CREATE INDEX IF NOT EXISTS idx_visit_reports_appointment ON public.visit_reports (appointment_id);

-- ---------------------------
-- TRIGGERS (Auto-update updated_at)
-- ---------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_infirmier_settings_updated_at ON public.infirmier_settings;
CREATE TRIGGER trg_infirmier_settings_updated_at BEFORE UPDATE ON public.infirmier_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_visit_reports_updated_at ON public.visit_reports;
CREATE TRIGGER trg_visit_reports_updated_at BEFORE UPDATE ON public.visit_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;