// @ts-nocheck
/* Database helpers for SQL tables */
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const getClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ============================================
// USERS
// ============================================

export interface User {
  id: string;
  role: 'patient' | 'infirmier' | 'medecin';
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  created_at: string;
}

export const createUser = async (data: {
  id?: string;
  role: 'patient' | 'infirmier' | 'medecin';
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
}): Promise<User> => {
  const supabase = getClient();
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();
  
  if (error) throw new Error(`Error creating user: ${error.message}`);
  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (error) throw new Error(`Error fetching user: ${error.message}`);
  return data;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw new Error(`Error fetching user: ${error.message}`);
  return data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching users: ${error.message}`);
  return data || [];
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const supabase = getClient();
  const { data: user, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`Error updating user: ${error.message}`);
  return user;
};

// ============================================
// PATIENTS
// ============================================

export interface Patient {
  user_id: string;
  default_address: string | null;
  preferred_language: string | null;
  birthdate: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  medical_notes: string | null;
}

export interface PatientWithUser extends Patient {
  user: User;
}

export const createPatient = async (userId: string, data?: {
  default_address?: string;
  preferred_language?: string;
  birthdate?: string;
  blood_type?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  medical_notes?: string;
}): Promise<Patient> => {
  const supabase = getClient();
  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      ...data
    })
    .select()
    .single();
  
  if (error) throw new Error(`Error creating patient: ${error.message}`);
  return patient;
};

export const getPatientByUserId = async (userId: string): Promise<PatientWithUser | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*, user:users(*)')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw new Error(`Error fetching patient: ${error.message}`);
  return data;
};

export const getAllPatients = async (): Promise<PatientWithUser[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*, user:users(*)')
    .order('user(created_at)', { ascending: false });
  
  if (error) throw new Error(`Error fetching patients: ${error.message}`);
  return data || [];
};

export const updatePatient = async (userId: string, data: Partial<Patient>): Promise<Patient> => {
  const supabase = getClient();
  const { data: patient, error } = await supabase
    .from('patients')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw new Error(`Error updating patient: ${error.message}`);
  return patient;
};

// ============================================
// INFIRMIERS
// ============================================

export interface Infirmier {
  user_id: string;
}

export interface InfirmierWithUser extends Infirmier {
  user: User;
}

export const createInfirmier = async (userId: string): Promise<Infirmier> => {
  const supabase = getClient();
  const { data: infirmier, error } = await supabase
    .from('infirmiers')
    .insert({ user_id: userId })
    .select()
    .single();
  
  if (error) throw new Error(`Error creating infirmier: ${error.message}`);
  return infirmier;
};

export const getInfirmierByUserId = async (userId: string): Promise<InfirmierWithUser | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('infirmiers')
    .select('*, user:users(*)')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw new Error(`Error fetching infirmier: ${error.message}`);
  return data;
};

export const getAllInfirmiers = async (): Promise<InfirmierWithUser[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('infirmiers')
    .select('*, user:users(*)')
    .order('user(created_at)', { ascending: false });
  
  if (error) throw new Error(`Error fetching infirmiers: ${error.message}`);
  return data || [];
};

// ============================================
// INFIRMIER SETTINGS
// ============================================

export interface InfirmierSettings {
  infirmier_id: string;
  start_address: string | null;
  start_lat: number | null;
  start_lng: number | null;
  transport: 'car' | 'bike' | 'transit' | 'walking';
  max_distance_km: number;
  working_days: number[];
  preferred_slots: string[];
  disliked_slots: string[];
  break_every_minutes: number | null;
  break_duration_minutes: number | null;
  safety_margin_minutes: number;
  notifications_enabled: boolean;
  updated_at: string;
}

export const createInfirmierSettings = async (infirmierId: string): Promise<InfirmierSettings> => {
  const supabase = getClient();
  const { data: settings, error } = await supabase
    .from('infirmier_settings')
    .insert({
      infirmier_id: infirmierId,
      transport: 'car',
      max_distance_km: 10,
      working_days: [1, 2, 3, 4, 5],
      preferred_slots: ['morning', 'afternoon'],
      disliked_slots: [],
      safety_margin_minutes: 10,
      notifications_enabled: false
    })
    .select()
    .single();
  
  if (error) throw new Error(`Error creating infirmier settings: ${error.message}`);
  return settings;
};

export const getInfirmierSettings = async (infirmierId: string): Promise<InfirmierSettings | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('infirmier_settings')
    .select('*')
    .eq('infirmier_id', infirmierId)
    .maybeSingle();
  
  if (error) throw new Error(`Error fetching infirmier settings: ${error.message}`);
  return data;
};

export const updateInfirmierSettings = async (
  infirmierId: string, 
  data: Partial<InfirmierSettings>
): Promise<InfirmierSettings> => {
  const supabase = getClient();
  const { data: settings, error } = await supabase
    .from('infirmier_settings')
    .update(data)
    .eq('infirmier_id', infirmierId)
    .select()
    .single();
  
  if (error) throw new Error(`Error updating infirmier settings: ${error.message}`);
  return settings;
};

// ============================================
// INFIRMIER UNAVAILABILITY
// ============================================

export interface InfirmierUnavailability {
  id: string;
  infirmier_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_at: string;
}

export const createUnavailability = async (data: {
  infirmier_id: string;
  start_at: string;
  end_at: string;
  reason?: string;
}): Promise<InfirmierUnavailability> => {
  const supabase = getClient();
  const { data: unavailability, error } = await supabase
    .from('infirmier_unavailability')
    .insert(data)
    .select()
    .single();
  
  if (error) throw new Error(`Error creating unavailability: ${error.message}`);
  return unavailability;
};

export const getUnavailabilities = async (infirmierId: string): Promise<InfirmierUnavailability[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('infirmier_unavailability')
    .select('*')
    .eq('infirmier_id', infirmierId)
    .order('start_at', { ascending: true });
  
  if (error) throw new Error(`Error fetching unavailabilities: ${error.message}`);
  return data || [];
};

export const deleteUnavailability = async (id: string): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('infirmier_unavailability')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(`Error deleting unavailability: ${error.message}`);
};

// ============================================
// CARE TYPES
// ============================================

export interface CareType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
}

export const getAllCareTypes = async (): Promise<CareType[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('care_types')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw new Error(`Error fetching care types: ${error.message}`);
  return data || [];
};

export const getCareTypeByName = async (name: string): Promise<CareType | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('care_types')
    .select('*')
    .eq('name', name)
    .maybeSingle();
  
  if (error) throw new Error(`Error fetching care type: ${error.message}`);
  return data;
};

export const createCareType = async (name: string): Promise<CareType> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('care_types')
    .insert({ name })
    .select()
    .single();
  
  if (error) throw new Error(`Error creating care type: ${error.message}`);
  return data;
};

// ============================================
// APPOINTMENTS
// ============================================

export interface Appointment {
  id: string;
  patient_id: string;
  infirmier_id: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  date: string;
  slot: 'morning' | 'afternoon' | 'evening';
  care_type_id: string;
  language: string | null;
  address: string;
  duration_minutes: number | null;
  patient_comment: string | null;
  infirmier_comment: string | null;
  created_at: string;
  updated_at: string;
}

export const createAppointment = async (data: {
  patient_id: string;
  infirmier_id?: string;
  status?: 'pending' | 'confirmed';
  date: string;
  slot: 'morning' | 'afternoon' | 'evening';
  care_type_id: string;
  address: string;
  language?: string;
  duration_minutes?: number;
  patient_comment?: string;
}): Promise<Appointment> => {
  const supabase = getClient();
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      ...data,
      status: data.status || 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Error creating appointment: ${error.message}`);
  return appointment;
};

export const getAppointmentsByPatient = async (patientId: string): Promise<Appointment[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!appointments_patient_id_fkey (
        user:users!patients_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone
        )
      ),
      infirmier:infirmiers!appointments_infirmier_id_fkey (
        user:users!infirmiers_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone
        )
      ),
      care_type:care_types!appointments_care_type_id_fkey (
        id,
        name
      )
    `)
    .eq('patient_id', patientId)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching appointments by patient:', error);
    throw new Error(`Error fetching appointments: ${error.message}`);
  }
  return data || [];
};

export const getAppointmentsByInfirmier = async (infirmierId: string): Promise<Appointment[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!appointments_patient_id_fkey (
        user:users!patients_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone
        )
      ),
      care_type:care_types!appointments_care_type_id_fkey (
        id,
        name
      )
    `)
    .eq('infirmier_id', infirmierId)
    .order('date', { ascending: true })
    .order('slot', { ascending: true });
  
  if (error) {
    console.error('Error fetching appointments by infirmier:', error);
    throw new Error(`Error fetching appointments: ${error.message}`);
  }
  return data || [];
};

export const getPendingAppointments = async (infirmierId?: string): Promise<Appointment[]> => {
  const supabase = getClient();
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!appointments_patient_id_fkey (
        user:users!patients_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone
        )
      ),
      care_type:care_types!appointments_care_type_id_fkey (
        id,
        name
      )
    `)
    .eq('status', 'pending');
  
  if (infirmierId) {
    query = query.eq('infirmier_id', infirmierId);
  }
  
  const { data, error } = await query
    .order('date', { ascending: true })
    .order('slot', { ascending: true });
  
  if (error) {
    console.error('Error fetching pending appointments:', error);
    throw new Error(`Error fetching pending appointments: ${error.message}`);
  }
  return data || [];
};

export const updateAppointment = async (
  id: string, 
  data: Partial<Appointment>
): Promise<Appointment> => {
  const supabase = getClient();
  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`Error updating appointment: ${error.message}`);
  return appointment;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(`Error deleting appointment: ${error.message}`);
};

// ============================================
// HEALTH DOCUMENTS
// ============================================

export interface HealthDocument {
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
}

export const createHealthDocument = async (data: {
  patient_id: string;
  name: string;
  document_type: string;
  file_path?: string;
  file_size_bytes?: number;
  mime_type?: string;
  notes?: string;
}): Promise<HealthDocument> => {
  const supabase = getClient();
  const { data: document, error } = await supabase
    .from('health_documents')
    .insert(data)
    .select()
    .single();
  
  if (error) throw new Error(`Error creating health document: ${error.message}`);
  return document;
};

export const getHealthDocumentsByPatient = async (patientId: string): Promise<HealthDocument[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('health_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('uploaded_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching health documents: ${error.message}`);
  return data || [];
};

export const deleteHealthDocument = async (id: string): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('health_documents')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(`Error deleting health document: ${error.message}`);
};

// ============================================
// PRESCRIPTIONS
// ============================================

export interface Prescription {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  infirmier_id: string | null;
  prescription_date: string;
  file_path: string | null;
  instructions: string | null;
  notes: string | null;
  created_at: string;
}

export interface PrescriptionMedication {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface PrescriptionWithMedications extends Prescription {
  medications: PrescriptionMedication[];
  infirmier?: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  appointment?: {
    id: string;
    date: string;
    slot: string;
    care_type: {
      name: string;
    };
  };
}

export const createPrescription = async (data: {
  patient_id: string;
  appointment_id?: string;
  infirmier_id?: string;
  prescription_date: string;
  file_path?: string;
  instructions?: string;
  notes?: string;
}): Promise<Prescription> => {
  const supabase = getClient();
  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .insert(data)
    .select()
    .single();
  
  if (error) throw new Error(`Error creating prescription: ${error.message}`);
  return prescription;
};

export const addPrescriptionMedication = async (data: {
  prescription_id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}): Promise<PrescriptionMedication> => {
  const supabase = getClient();
  const { data: medication, error } = await supabase
    .from('prescription_medications')
    .insert(data)
    .select()
    .single();
  
  if (error) throw new Error(`Error adding medication: ${error.message}`);
  return medication;
};

export const getPrescriptionsByPatient = async (patientId: string): Promise<PrescriptionWithMedications[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      medications:prescription_medications(*),
      infirmier:users!prescriptions_infirmier_id_fkey(
        first_name,
        last_name
      ),
      appointment:appointments!prescriptions_appointment_id_fkey(
        id,
        date,
        slot,
        care_type:care_types(name)
      )
    `)
    .eq('patient_id', patientId)
    .order('prescription_date', { ascending: false });
  
  if (error) throw new Error(`Error fetching prescriptions: ${error.message}`);
  return data || [];
};

export const deletePrescription = async (id: string): Promise<void> => {
  const supabase = getClient();
  // Medications will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(`Error deleting prescription: ${error.message}`);
};

// ============================================
// VISIT REPORTS (workflow de validation de visite)
// ============================================

export interface VisitReport {
  id: string;
  appointment_id: string;
  actes_realises: string | null;
  observations: string | null;
  medicaments_administres: string | null;
  suite_a_donner: string | null;
  pm_role: 'infirmier' | 'medecin';
  pm_id: string;
  workflow_step: 'awaiting_medecin' | 'awaiting_patient' | 'completed';
  medecin_validated_at: string | null;
  medecin_validator_id: string | null;
  patient_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const createVisitReport = async (data: {
  appointment_id: string;
  actes_realises?: string;
  observations?: string;
  medicaments_administres?: string;
  suite_a_donner?: string;
  pm_role: 'infirmier' | 'medecin';
  pm_id: string;
  workflow_data?: any; // Données du workflow Olga
}): Promise<VisitReport> => {
  const supabase = getClient();
  // Si c'est un médecin, on saute l'étape de validation médecin
  const workflow_step = data.pm_role === 'medecin' ? 'awaiting_patient' : 'awaiting_medecin';
  // Si pm_role = 'medecin', la validation médecin est auto
  const medecin_validated_at = data.pm_role === 'medecin' ? new Date().toISOString() : null;
  const medecin_validator_id = data.pm_role === 'medecin' ? data.pm_id : null;

  const { data: report, error } = await supabase
    .from('visit_reports')
    .insert({
      ...data,
      workflow_step,
      medecin_validated_at,
      medecin_validator_id,
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating visit report: ${error.message}`);
  return report;
};

export const getVisitReportByAppointment = async (appointmentId: string): Promise<VisitReport | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('visit_reports')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (error) throw new Error(`Error fetching visit report: ${error.message}`);
  return data;
};

// Rapports en attente de validation médecin (pour le dashboard médecin)
export const getVisitReportsAwaitingMedecin = async (): Promise<(VisitReport & { appointment: any })[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('visit_reports')
    .select(`
      *,
      appointment:appointments(
        id, date, slot, address,
        patient:patients!appointments_patient_id_fkey(
          user:users(first_name, last_name)
        ),
        care_type:care_types(name)
      )
    `)
    .eq('workflow_step', 'awaiting_medecin')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching reports awaiting medecin: ${error.message}`);
  return data || [];
};

// Rapports en attente d'approbation patient
export const getVisitReportsForPatient = async (patientId: string): Promise<(VisitReport & { appointment: any })[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('visit_reports')
    .select(`
      *,
      appointment:appointments(
        id, date, slot, address,
        care_type:care_types(name)
      )
    `)
    .eq('workflow_step', 'awaiting_patient')
    .eq('appointment.patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching patient visit reports: ${error.message}`);
  return (data || []).filter(r => r.appointment !== null);
};

export const validateVisitReportByMedecin = async (reportId: string, medecinId: string): Promise<VisitReport> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('visit_reports')
    .update({
      workflow_step: 'awaiting_patient',
      medecin_validated_at: new Date().toISOString(),
      medecin_validator_id: medecinId,
    })
    .eq('id', reportId)
    .eq('workflow_step', 'awaiting_medecin')
    .select()
    .single();

  if (error) throw new Error(`Error validating visit report: ${error.message}`);
  return data;
};

export const approveVisitReportByPatient = async (reportId: string): Promise<VisitReport> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('visit_reports')
    .update({
      workflow_step: 'completed',
      patient_approved_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('workflow_step', 'awaiting_patient')
    .select()
    .single();

  if (error) throw new Error(`Error approving visit report: ${error.message}`);
  return data;
};