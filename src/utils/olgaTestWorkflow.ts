export type OlgaTestStatus = 'none' | 'pending_nurse' | 'pending_doctor' | 'completed';

export interface OlgaTestPayload {
  formId: string;
  values: Record<string, string | boolean>;
  from: string; // user email or name
  notes?: string;
}

export interface OlgaTestState {
  status: OlgaTestStatus;
  payload?: OlgaTestPayload;
  nurseValidatedAt?: string;
  doctorValidatedAt?: string;
}

const STORAGE_KEY = 'olga_test_workflow';

export const getOlgaTestState = (): OlgaTestState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: 'none' };
    const parsed = JSON.parse(raw);
    if (!parsed.status) return { status: 'none' };
    return parsed as OlgaTestState;
  } catch {
    return { status: 'none' };
  }
};

export const setOlgaTestState = (state: OlgaTestState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearOlgaTestState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
