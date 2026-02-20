import { projectId, publicAnonKey } from '../utils/supabase/info';

const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c`;

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string | null;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address?: string | null;
  type: 'patient' | 'nurse' | 'medecin';
}

export interface Appointment {
  id: string;
  patient_id: string;
  infirmier_id: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done';
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

export interface CareType {
  id: string;
  name: string;
}

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

export interface Unavailability {
  id: string;
  infirmier_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_at: string;
}

// ============================================
// HELPERS
// ============================================

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Une erreur est survenue' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// ============================================
// CARE TYPES
// ============================================

export const getCareTypes = async (): Promise<CareType[]> => {
  const response = await fetch(`${baseUrl}/care-types`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.careTypes;
};

// ============================================
// APPOINTMENTS - PATIENT
// ============================================

export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  const response = await fetch(`${baseUrl}/appointments/patient/${patientId}`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.appointments;
};

// ============================================
// PATIENT PROFILE
// ============================================

export interface PatientProfile {
  email: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  preferredLanguage: string | null;
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string[];
  medicalNotes: string | null;
}

export const getPatientProfile = async (patientId: string): Promise<PatientProfile> => {
  const response = await fetch(`${baseUrl}/api/patient/${patientId}/profile`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.profile;
};

export const updatePatientProfile = async (
  patientId: string,
  updates: {
    phone?: string;
    address?: string;
    birthDate?: string;
    preferredLanguage?: string;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medicalNotes?: string;
  }
): Promise<void> => {
  const response = await fetch(`${baseUrl}/api/patient/${patientId}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(updates)
  });
  await handleResponse(response);
};

// ============================================
// APPOINTMENTS - INFIRMIER
// ============================================

export const getInfirmierAppointments = async (infirmierId: string): Promise<Appointment[]> => {
  const response = await fetch(`${baseUrl}/appointments/infirmier/${infirmierId}`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.appointments;
};

export const getPendingAppointments = async (infirmierId?: string): Promise<Appointment[]> => {
  const url = infirmierId 
    ? `${baseUrl}/appointments/pending/${infirmierId}`
    : `${baseUrl}/appointments/pending/all`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.appointments;
};

export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<Appointment> => {
  const response = await fetch(`${baseUrl}/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(updates)
  });
  const data = await handleResponse(response);
  return data.appointment;
};

export const acceptAppointment = async (
  appointmentId: string,
  infirmierId: string,
  comment?: string
): Promise<Appointment> => {
  return updateAppointment(appointmentId, {
    status: 'confirmed',
    infirmier_id: infirmierId,
    infirmier_comment: comment || null
  });
};

export const rejectAppointment = async (
  appointmentId: string,
  reason?: string
): Promise<Appointment> => {
  return updateAppointment(appointmentId, {
    status: 'cancelled',
    infirmier_comment: reason || 'Demande refusée par l\'infirmier'
  });
};

export const cancelAppointment = async (appointmentId: string): Promise<Appointment> => {
  return updateAppointment(appointmentId, {
    status: 'cancelled'
  });
};

// ============================================
// INFIRMIER SETTINGS
// ============================================

export const getInfirmierSettings = async (infirmierId: string): Promise<InfirmierSettings> => {
  const response = await fetch(`${baseUrl}/infirmier/${infirmierId}/settings`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.settings;
};

export const updateInfirmierSettings = async (
  infirmierId: string,
  settings: Partial<InfirmierSettings>
): Promise<InfirmierSettings> => {
  const response = await fetch(`${baseUrl}/infirmier/${infirmierId}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(settings)
  });
  const data = await handleResponse(response);
  return data.settings;
};

// ============================================
// UNAVAILABILITIES
// ============================================

export const getUnavailabilities = async (infirmierId: string): Promise<Unavailability[]> => {
  const response = await fetch(`${baseUrl}/unavailabilities/${infirmierId}`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await handleResponse(response);
  return data.unavailabilities;
};

export const addUnavailability = async (
  infirmierId: string,
  unavailability: {
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }
): Promise<Unavailability> => {
  const response = await fetch(`${baseUrl}/unavailabilities/${infirmierId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(unavailability)
  });
  const data = await handleResponse(response);
  return data.unavailability;
};

export const deleteUnavailability = async (
  infirmierId: string,
  unavailabilityId: string
): Promise<void> => {
  await fetch(`${baseUrl}/unavailabilities/${infirmierId}/${unavailabilityId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
};

// ============================================
// VISIT REPORTS — Workflow de validation de visite
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
  workflow_data?: any; // Données du workflow Olga
  created_at: string;
  updated_at: string;
  // Joined fields (when queried with appointment)
  appointment?: {
    id: string;
    date: string;
    slot: string;
    address: string;
    care_type?: { name: string };
    patient?: { user?: { first_name: string; last_name: string } };
  };
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
  const response = await fetch(`${baseUrl}/visit-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(data)
  });
  const res = await handleResponse(response);
  return res.report;
};

export const getVisitReportsAwaitingMedecin = async (): Promise<VisitReport[]> => {
  const response = await fetch(`${baseUrl}/visit-reports/awaiting-medecin`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const res = await handleResponse(response);
  return res.reports || res.data || [];
};

export const getVisitReportByAppointment = async (appointmentId: string): Promise<VisitReport | null> => {
  const response = await fetch(`${baseUrl}/visit-reports/appointment/${appointmentId}`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const res = await handleResponse(response);
  return res.data;
};

export const getVisitReportsForPatient = async (patientId: string): Promise<VisitReport[]> => {
  const response = await fetch(`${baseUrl}/visit-reports/patient/${patientId}`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const res = await handleResponse(response);
  return res.reports;
};

export const validateVisitReportByMedecin = async (
  reportId: string, 
  medecinId: string,
  medecinFormData?: any
): Promise<VisitReport> => {
  const response = await fetch(`${baseUrl}/visit-reports/${reportId}/medecin-validate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ 
      medecin_id: medecinId,
      medecin_form_data: medecinFormData
    })
  });
  const res = await handleResponse(response);
  return res.report;
};

export const approveVisitReportByPatient = async (reportId: string): Promise<VisitReport> => {
  const response = await fetch(`${baseUrl}/visit-reports/${reportId}/patient-approve`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const res = await handleResponse(response);
  return res.report;
};

export const medecinFranceConnectLogin = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  franceConnectId: string;
}): Promise<{ id: string; name: string; email: string; type: 'medecin' }> => {
  const response = await fetch(`${baseUrl}/api/medecin/franceconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(data)
  });
  const res = await handleResponse(response);
  return res.medecin;
};