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
  type: 'patient' | 'nurse';
}

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