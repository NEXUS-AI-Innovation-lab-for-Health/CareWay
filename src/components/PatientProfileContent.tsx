import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User, Mail, Phone, MapPin, FileText, Download, Calendar, Pill, Trash2, Upload, Heart, AlertCircle, Droplet } from 'lucide-react';
import type { User as UserType } from '../App';
import * as api from '../services/api';
import { toast } from 'sonner@2.0.3';
import { DocumentUploadModal } from './DocumentUploadModal';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from './LanguageContext';
import { getOlgaTestState, setOlgaTestState, clearOlgaTestState } from '../utils/olgaTestWorkflow';

interface PatientProfileContentProps {
  user: UserType;
  onUpdateUser?: (updatedUser: UserType) => void;
}

interface PersonalInfo {
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  preferredLanguage: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  medicalNotes: string;
}

interface HealthDocument {
  id: string;
  name: string;
  document_type: string;
  uploaded_at: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  notes: string | null;
  downloadUrl?: string;
}

interface PrescriptionMedication {
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

interface Prescription {
  id: string;
  prescription_date: string;
  instructions: string | null;
  notes: string | null;
  downloadUrl?: string;
  medications: PrescriptionMedication[];
  infirmier?: {
    first_name: string;
    last_name: string;
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

// Olga form types
interface OlgaFormField {
  field_key: string;
  field_label: string;
  field_type: string;
  field_required?: boolean;
}

// Données mockées
const mockPersonalInfo: PersonalInfo = {
  email: 'patient@example.com',
  phone: '06 12 34 56 78',
  address: '123 Rue de la Santé, 75013 Paris',
  birthDate: '15/03/1985',
  preferredLanguage: 'fr',
  bloodType: 'A+',
  allergies: ['Pénicilline', 'Pollen'],
  chronicConditions: ['Diabète', 'Hypertension'],
  medicalNotes: 'Patient souffre de douleurs articulaires.'
};

const mockDocuments: HealthDocument[] = [
  {
    id: '1',
    name: 'Carte Vitale',
    document_type: 'Assurance',
    uploaded_at: '2024-01-15',
    file_size_bytes: 245000,
    mime_type: 'application/pdf',
    notes: 'Carte vitale de santé'
  },
  {
    id: '2',
    name: 'Résultats analyses sanguines',
    document_type: 'Résultats',
    uploaded_at: '2024-11-20',
    file_size_bytes: 512000,
    mime_type: 'application/pdf',
    notes: 'Résultats des analyses sanguines'
  },
  {
    id: '3',
    name: 'Certificat médical',
    document_type: 'Certificat',
    uploaded_at: '2024-10-10',
    file_size_bytes: 189000,
    mime_type: 'application/pdf',
    notes: 'Certificat médical'
  }
];

const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    prescription_date: '2024-11-20',
    instructions: 'Traitement pour 7 jours. À prendre pendant les repas.',
    notes: 'Traitement pour 7 jours. À prendre pendant les repas.',
    downloadUrl: 'https://example.com/prescription-1.pdf',
    medications: [
      {
        medication_name: 'Paracétamol 1g - 3x/jour',
        dosage: '1g',
        frequency: '3x/jour',
        duration: '7 jours',
        instructions: 'À prendre pendant les repas.'
      },
      {
        medication_name: 'Ibuprofène 400mg - 2x/jour si douleur',
        dosage: '400mg',
        frequency: '2x/jour si douleur',
        duration: '7 jours',
        instructions: 'À prendre pendant les repas.'
      }
    ],
    infirmier: {
      first_name: 'Sophie',
      last_name: 'Bernard'
    }
  },
  {
    id: '2',
    prescription_date: '2024-10-15',
    instructions: 'Traitement antibiotique - Ne pas interrompre avant la fin.',
    notes: 'Traitement antibiotique - Ne pas interrompre avant la fin.',
    downloadUrl: 'https://example.com/prescription-2.pdf',
    medications: [
      {
        medication_name: 'Amoxicilline 500mg - 3x/jour',
        dosage: '500mg',
        frequency: '3x/jour',
        duration: '7 jours',
        instructions: 'Ne pas interrompre avant la fin.'
      },
      {
        medication_name: 'Vitamine C 1000mg - 1x/jour',
        dosage: '1000mg',
        frequency: '1x/jour',
        duration: '7 jours',
        instructions: 'Ne pas interrompre avant la fin.'
      }
    ],
    infirmier: {
      first_name: 'Marie',
      last_name: 'Dupont'
    }
  }
];

export function PatientProfileContent({ user, onUpdateUser }: PatientProfileContentProps) {
  const { t } = useLanguage();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    birthDate: '',
    preferredLanguage: '',
    bloodType: '',
    allergies: [],
    chronicConditions: [],
    medicalNotes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [olgaFields, setOlgaFields] = useState<OlgaFormField[]>([]);
  const [olgaValues, setOlgaValues] = useState<Record<string, string | boolean>>({});
  const [isOlgaLoading, setIsOlgaLoading] = useState(false);
  const [olgaTestState, setOlgaTestStateLocal] = useState(getOlgaTestState());
  
  // États pour les documents et ordonnances
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Charger les données du profil depuis le backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await api.getPatientProfile(user.id);
        
        console.log('📋 Profile data from backend:', profile);
        
        setPersonalInfo({
          email: profile.email || user.email || '',
          phone: profile.phone || user.phone || '',
          address: profile.address || user.address || '',
          birthDate: profile.birthDate || '',
          preferredLanguage: profile.preferredLanguage || 'Français',
          bloodType: profile.bloodType || '',
          allergies: profile.allergies || [],
          chronicConditions: profile.chronicConditions || [],
          medicalNotes: profile.medicalNotes || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user.id, user.email, user.phone, user.address]);

  // Charger le formulaire Olga (Rapport_patient_ID) pour test
  useEffect(() => {
    const fetchOlgaForm = async () => {
      setIsOlgaLoading(true);
      try {
        const res = await fetch('http://localhost:9091/forms/getFromID/Rapport_patient_ID');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const fields: OlgaFormField[] = (data.form || []).map((f: any) => ({
          field_key: f.field_key,
          field_label: f.field_label,
          field_type: f.field_type,
          field_required: f.field_required,
        }));
        setOlgaFields(fields);
        const initial: Record<string, string | boolean> = {};
        fields.forEach((f) => {
          const normalized = (f.field_type || '').toLowerCase();
          initial[f.field_key] = normalized === 'checkbox' ? false : '';
        });
        setOlgaValues(initial);
      } catch (error) {
        console.error('Erreur chargement formulaire Olga:', error);
      } finally {
        setIsOlgaLoading(false);
      }
    };

    fetchOlgaForm();
    // sync test state from localStorage on mount
    setOlgaTestStateLocal(getOlgaTestState());
  }, []);

  // Sync test state periodically (same-tab localStorage setItem doesn't fire 'storage')
  useEffect(() => {
    const interval = setInterval(() => {
      setOlgaTestStateLocal(getOlgaTestState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Charger les documents de santé
  const fetchDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/health-documents/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement des documents');
      }

      console.log('📄 Documents loaded:', result.documents);
      setDocuments(result.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Charger les ordonnances
  const fetchPrescriptions = async () => {
    try {
      setIsLoadingPrescriptions(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/prescriptions/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement des ordonnances');
      }

      console.log('💊 Prescriptions loaded:', result.prescriptions);
      setPrescriptions(result.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Erreur lors du chargement des ordonnances');
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchPrescriptions();
  }, [user.id]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Mettre à jour le profil dans le backend
      await api.updatePatientProfile(user.id, {
        phone: personalInfo.phone,
        address: personalInfo.address,
        birthDate: personalInfo.birthDate,
        preferredLanguage: personalInfo.preferredLanguage,
        bloodType: personalInfo.bloodType,
        allergies: personalInfo.allergies,
        chronicConditions: personalInfo.chronicConditions,
        medicalNotes: personalInfo.medicalNotes
      });
      
      // Mettre à jour l'objet user local
      if (onUpdateUser) {
        onUpdateUser({ 
          ...user, 
          phone: personalInfo.phone,
          address: personalInfo.address 
        });
      }
      
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadDocument = (doc: HealthDocument) => {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
    } else {
      toast.error('URL de téléchargement non disponible');
    }
  };

  const handleDownloadPrescription = (prescription: Prescription) => {
    if (prescription.downloadUrl) {
      window.open(prescription.downloadUrl, '_blank');
    } else {
      toast.error('Aucun fichier PDF disponible pour cette ordonnance');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/health-documents/${user.id}/${docId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      toast.success('Document supprimé avec succès');
      fetchDocuments(); // Recharger la liste
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* User Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-gray-900">{user.name}</h2>
          <p className="text-gray-600">Patient</p>
        </div>
      </div>

      {/* Personal Information */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('dashboard.personal_info')}
              </CardTitle>
              <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" disabled={isLoading}>
                {t('common.edit')}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" disabled={isSaving}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSave} size="sm" className="bg-black hover:bg-gray-800" disabled={isSaving}>
                  {isSaving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.email')}
                </label>
                <p className="text-gray-900">{personalInfo.email || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.phone')}
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="Ex: 06 12 34 56 78"
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.phone || 'Non renseigné'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.address')}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    placeholder="Ex: 123 Rue de la Santé, 75013 Paris"
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.address || 'Non renseignée'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.birth_date')}
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={personalInfo.birthDate}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">
                    {personalInfo.birthDate 
                      ? new Date(personalInfo.birthDate).toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Non renseignée'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.preferred_language')}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.preferredLanguage}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, preferredLanguage: e.target.value })}
                    placeholder="Ex: Français"
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.preferredLanguage || 'Non renseignée'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Droplet className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.blood_type')}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.bloodType}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, bloodType: e.target.value })}
                    placeholder="Ex: A+"
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.bloodType || 'Non renseigné'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">
                  <AlertCircle className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.allergies')}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.allergies.join(', ')}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, allergies: e.target.value.split(',').map(a => a.trim()) })}
                    placeholder="Ex: Pénicilline, Pollen"
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.allergies.join(', ') || 'Non renseignées'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">
                  <AlertCircle className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.chronic_conditions')}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.chronicConditions.join(', ')}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, chronicConditions: e.target.value.split(',').map(a => a.trim()) })}
                    placeholder="Ex: Diabète, Hypertension"
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.chronicConditions.join(', ') || 'Non renseignées'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2 text-gray-400" />
                  {t('profile.medical_notes')}
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.medicalNotes}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, medicalNotes: e.target.value })}
                    placeholder="Ex: Patient souffre de douleurs articulaires."
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.medicalNotes || 'Non renseignées'}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Formulaire Olga (test) */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Formulaire Olga – Rapport Patient (test)
                </CardTitle>
                <CardDescription>
                  Chargé depuis /forms/getFromID/Rapport_patient_ID et rendu en champs éditables.
                </CardDescription>
              </div>
              <Badge variant="outline">ID: Rapport_patient_ID</Badge>
            </div>
            {olgaTestState.status !== 'none' && (
              <div className="text-xs text-gray-600">
                Workflow test: {olgaTestState.status}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isOlgaLoading ? (
              <p className="text-gray-500 text-sm">Chargement du formulaire...</p>
            ) : olgaFields.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun champ trouvé dans le formulaire.</p>
            ) : (
              <div className="space-y-4">
                {olgaFields.map((field) => {
                  const normalizedType = (field.field_type || '').toLowerCase();
                  const label = field.field_label || field.field_key;
                  const value = olgaValues[field.field_key];
                  const updateValue = (v: string | boolean) => setOlgaValues((prev) => ({ ...prev, [field.field_key]: v }));
                  const isInput = normalizedType.startsWith('input:');
                  const inputKind = isInput ? normalizedType.split(':')[1] || 'text' : 'text';
                  const allowedTypes = ['text', 'number', 'email', 'date', 'datetime-local', 'time', 'tel', 'url'];
                  const inputType = allowedTypes.includes(inputKind) ? inputKind : 'text';

                  return (
                    <div key={field.field_key} className="space-y-2">
                      <label className="block text-sm text-gray-700">
                        {label}
                        {field.field_required ? <span className="text-red-500 ml-1">*</span> : null}
                      </label>
                      {normalizedType === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <input
                            id={field.field_key}
                            type="checkbox"
                            className="h-4 w-4 accent-blue-600 rounded border-gray-300"
                            checked={Boolean(value)}
                            onChange={(e) => updateValue(e.target.checked)}
                          />
                          <label htmlFor={field.field_key} className="text-sm text-gray-700 cursor-pointer">
                            {label || field.field_key}
                          </label>
                        </div>
                      ) : (
                        <Input
                          type={isInput ? inputType : 'text'}
                          value={(value as string) ?? ''}
                          onChange={(e) => updateValue(e.target.value)}
                          placeholder={label}
                          inputMode={isInput && inputType === 'number' ? 'decimal' : undefined}
                        />
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex gap-2">
                  <Button
                    className="bg-black hover:bg-gray-800"
                    onClick={() => console.log('Valeurs Olga test ->', olgaValues)}
                  >
                    Tester l&apos;enregistrement (console)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const reset: Record<string, string | boolean> = {};
                      olgaFields.forEach((f) => {
                        const normalized = (f.field_type || '').toLowerCase();
                        reset[f.field_key] = normalized === 'checkbox' ? false : '';
                      });
                      setOlgaValues(reset);
                    }}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const payload = {
                        formId: 'Rapport_patient_ID',
                        values: olgaValues,
                        from: user.email || user.name || 'patient'
                      };
                      const state = { status: 'pending_nurse' as const, payload };
                      setOlgaTestState(state);
                      setOlgaTestStateLocal(state);
                      toast.success('Envoyé à l\'infirmier (test local)');
                    }}
                  >
                    Envoyer à l&apos;infirmier (test)
                  </Button>
                  {olgaTestState.status !== 'none' && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        clearOlgaTestState();
                        setOlgaTestStateLocal({ status: 'none' });
                        toast.success('Workflow test réinitialisé');
                      }}
                    >
                      Reset workflow test
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {olgaTestState.status === 'completed' && olgaTestState.payload && (
          <Card className="mb-8 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Formulaire validé (retour médecin)
              </CardTitle>
              <CardDescription>Validé par infirmier puis médecin (test local)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(olgaTestState.payload.values || {}).map(([k, v]) => (
                <div key={k} className="text-sm text-gray-800">
                  <span className="font-medium">{k}</span>: {String(v)}
                </div>
              ))}
              <div className="text-xs text-gray-500 pt-2">
                Infirmier: {olgaTestState.nurseValidatedAt ? new Date(olgaTestState.nurseValidatedAt).toLocaleString('fr-FR') : '—'} • Médecin: {olgaTestState.doctorValidatedAt ? new Date(olgaTestState.doctorValidatedAt).toLocaleString('fr-FR') : '—'}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Health Documents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('dashboard.documents.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.documents.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingDocuments ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common.loading')}</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')} • {formatFileSize(doc.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('dashboard.documents.add')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'upload */}
      <DocumentUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={fetchDocuments}
        patientId={user.id}
      />

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            {t('dashboard.prescriptions.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.prescriptions.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingPrescriptions ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common.loading')}</p>
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-gray-900 mb-1">
                        {new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-600">{prescription.infirmier?.first_name} {prescription.infirmier?.last_name}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      {t('common.valid')}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg mb-2">
                    <p className="text-sm text-gray-700 mb-2">{t('dashboard.prescriptions.medications')}</p>
                    <ul className="space-y-1">
                      {prescription.medications.map((med, index) => (
                        <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                          <Pill className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {med.medication_name}
                          {med.dosage && ` - ${med.dosage}`}
                          {med.frequency && ` - ${med.frequency}`}
                          {med.duration && ` - ${med.duration}`}
                          {med.instructions && ` - ${med.instructions}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-600 italic">{prescription.notes}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPrescription(prescription)}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('common.download')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}