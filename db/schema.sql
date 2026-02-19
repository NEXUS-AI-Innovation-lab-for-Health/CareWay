-- schéma SQL du projet à exécuter dans supabase (dans SQL editor)

BEGIN;

-- Required for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------
-- ENUM TYPES (from your Supabase)
-- ---------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('patient', 'infirmier');
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
-- TABLES
-- ---------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.user_role NOT NULL,
  email text,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patients (
  user_id uuid PRIMARY KEY,
  default_address text,
  preferred_language text,
  birthdate date,
  blood_type varchar,
  allergies text[],
  chronic_conditions text[],
  medical_notes text,
  CONSTRAINT patients_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.infirmiers (
  user_id uuid PRIMARY KEY,
  CONSTRAINT infirmiers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.care_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.infirmier_care_durations (
  infirmier_id uuid NOT NULL,
  care_type_id uuid NOT NULL,
  duration_minutes integer NOT NULL,
  PRIMARY KEY (infirmier_id, care_type_id),
  CONSTRAINT infirmier_care_durations_infirmier_id_fkey
    FOREIGN KEY (infirmier_id) REFERENCES public.infirmiers(user_id) ON DELETE CASCADE,
  CONSTRAINT infirmier_care_durations_care_type_id_fkey
    FOREIGN KEY (care_type_id) REFERENCES public.care_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.infirmier_settings (
  infirmier_id uuid PRIMARY KEY,
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
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT infirmier_settings_infirmier_id_fkey
    FOREIGN KEY (infirmier_id) REFERENCES public.infirmiers(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.infirmier_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infirmier_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT infirmier_unavailability_infirmier_id_fkey
    FOREIGN KEY (infirmier_id) REFERENCES public.infirmiers(user_id) ON DELETE CASCADE,
  CONSTRAINT infirmier_unavailability_time_check
    CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  infirmier_id uuid,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  date date NOT NULL,
  slot public.time_slot NOT NULL,
  care_type_id uuid NOT NULL,
  language text,
  address text NOT NULL,
  duration_minutes integer,
  patient_comment text,
  infirmier_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(user_id) ON DELETE CASCADE,
  CONSTRAINT appointments_infirmier_id_fkey
    FOREIGN KEY (infirmier_id) REFERENCES public.infirmiers(user_id) ON DELETE SET NULL,
  CONSTRAINT appointments_care_type_id_fkey
    FOREIGN KEY (care_type_id) REFERENCES public.care_types(id)
);

CREATE TABLE IF NOT EXISTS public.medical_records (
  patient_id uuid PRIMARY KEY,
  content text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medical_records_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  appointment_id uuid,
  instructions text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  infirmier_id uuid,
  prescription_date date NOT NULL,
  file_path varchar,
  notes text,
  CONSTRAINT prescriptions_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(user_id) ON DELETE CASCADE,
  CONSTRAINT prescriptions_appointment_id_fkey
    FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
  CONSTRAINT prescriptions_infirmier_id_fkey
    FOREIGN KEY (infirmier_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.prescription_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL,
  medication_name varchar NOT NULL,
  dosage varchar,
  frequency varchar,
  duration varchar,
  instructions text,
  CONSTRAINT prescription_medications_prescription_id_fkey
    FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.health_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  name varchar NOT NULL,
  document_type varchar NOT NULL,
  file_path varchar,
  file_size_bytes integer,
  mime_type varchar,
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT health_documents_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.route_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infirmier_id uuid NOT NULL,
  date date NOT NULL,
  input jsonb NOT NULL,
  output jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT route_optimizations_infirmier_id_fkey
    FOREIGN KEY (infirmier_id) REFERENCES public.infirmiers(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.kv_store_1b83ce4c (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'medecin'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'medecin';
  END IF;
END $$;


-- ---------------------------
-- INDEXES
-- ---------------------------

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
  ON public.appointments (patient_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_infirmier_date
  ON public.appointments (infirmier_id, date);

CREATE INDEX IF NOT EXISTS idx_infirmier_unavailability_infirmier
  ON public.infirmier_unavailability (infirmier_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date
  ON public.prescriptions (patient_id, prescription_date);

CREATE INDEX IF NOT EXISTS idx_route_optimizations_infirmier_date
  ON public.route_optimizations (infirmier_id, date);

-- ---------------------------
-- updated_at trigger
-- ---------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_infirmier_settings_updated_at ON public.infirmier_settings;
CREATE TRIGGER trg_infirmier_settings_updated_at
BEFORE UPDATE ON public.infirmier_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER trg_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
