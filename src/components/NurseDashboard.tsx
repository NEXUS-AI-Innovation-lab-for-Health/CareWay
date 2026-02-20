import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  User, 
  LogOut, 
  Settings,
  List,
  CalendarDays,
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Navigation,
  Search,
  ChevronRight,
  FileCheck,
  FileText
} from 'lucide-react';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { AppointmentConfirmDialog } from './AppointmentConfirmDialog';
import { AIRouteOptimizer } from './AIRouteOptimizer';
import { NurseSettings } from './NurseSettings';
import { VisitRecapModal } from './VisitRecapModal';
import { MedecinValidationsModal } from './MedecinValidationsModal';
import type { User as UserType } from '../App';
import * as api from '../services/api';
import { toast } from 'sonner';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface NurseDashboardProps {
  user: UserType;
  onLogout: () => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;  // Horaire assigné par l'IA (ou vide si pas encore optimisé)
  timeSlot?: 'morning' | 'afternoon' | 'evening';  // Créneau demandé par le patient
  timeSlotLabel?: string;  // Label du créneau (Matin, Après-midi, Soirée)
  patientName: string;
  location: string;
  type: string;
  careTypeId?: string;  // ID du type de soin
  duration?: number;  // Durée en minutes
  status: 'pending' | 'confirmed' | 'done' | 'cancelled';
  isUrgent: boolean;
  // Backend fields
  patient_id?: string;
  infirmier_id?: string | null;
  patient_comment?: string | null;
}

interface OlgaField {
  unique_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_required?: boolean;
  field_hint?: string;
}

interface OlgaFormSummary {
  form_id: string;
  form_label: string;
  form_category?: string;
}

interface OlgaFormFull extends OlgaFormSummary {
  form: OlgaField[];
  form_version?: string;
}

export function NurseDashboard({ user, onLogout }: NurseDashboardProps) {
  const { t, language } = useLanguage();
  const [activeView, setActiveView] = useState<'today' | 'week'>('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [olgaForms, setOlgaForms] = useState<OlgaFormSummary[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormData, setSelectedFormData] = useState<OlgaFormFull | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [formsLoading, setFormsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formsSearch, setFormsSearch] = useState('');
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [recapAppointment, setRecapAppointment] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidations, setShowValidations] = useState(false);


  // Charger la liste des formulaires Olga
  useEffect(() => {
    if (!showForms || olgaForms.length > 0) return;
    setFormsLoading(true);
    fetch('http://localhost:9091/forms/getAll')
      .then(r => r.json())
      .then((data: OlgaFormFull[]) =>
        setOlgaForms(
          data.map(f => ({ form_id: f.form_id, form_label: f.form_label, form_category: f.form_category }))
        )
      )
      .catch(() => setOlgaForms([]))
      .finally(() => setFormsLoading(false));
  }, [showForms, olgaForms.length]);

  const handleSelectForm = async (formId: string) => {
    setSelectedFormId(formId);
    setFormLoading(true);
    setFormValues({});
    try {
      const res = await fetch(`http://localhost:9091/forms/getFromID/${formId}`);
      const data: OlgaFormFull = await res.json();
      setSelectedFormData(data);
      const init: Record<string, string | boolean> = {};
      (data.form || []).forEach(f => { init[f.unique_id] = f.field_type === 'checkbox' ? false : ''; });
      setFormValues(init);
    } catch {
      // API unreachable
    } finally {
      setFormLoading(false);
    }
  };

  const renderOlgaField = (field: OlgaField) => {
    const base = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    const label = field.field_label || field.field_key || 'Champ';
    const val = formValues[field.unique_id];
    const onChange = (v: string | boolean) => setFormValues(prev => ({ ...prev, [field.unique_id]: v }));

    if (field.field_type === 'checkbox') {
      return (
        <div key={field.unique_id} className='flex items-center gap-2'>
          <input type='checkbox' id={field.unique_id} checked={val as boolean} onChange={e => onChange(e.target.checked)} className='h-4 w-4 accent-blue-600' />
          <label htmlFor={field.unique_id} className='text-sm text-gray-700'>{label}</label>
          {field.field_required && <span className='text-red-500 text-xs'>*</span>}
        </div>
      );
    }
    if (field.field_type === 'textarea') {
      return (
        <div key={field.unique_id} className='space-y-1'>
          <label className='text-sm font-medium text-gray-700'>{label}{field.field_required && <span className='text-red-500 ml-1'>*</span>}</label>
          <textarea value={val as string} onChange={e => onChange(e.target.value)} className={`${base} min-h-[80px] resize-y`} placeholder={field.field_hint} />
        </div>
      );
    }
    const inputType = field.field_type.startsWith('input:') ? field.field_type.split(':')[1] : field.field_type;
    return (
      <div key={field.unique_id} className='space-y-1'>
        <label className='text-sm font-medium text-gray-700'>{label}{field.field_required && <span className='text-red-500 ml-1'>*</span>}</label>
        <input type={inputType} value={val as string} onChange={e => onChange(e.target.value)} className={base} placeholder={field.field_hint} />
      </div>
    );
  };

  // Charger les rendez-vous depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les rendez-vous confirmés de l'infirmier
        const confirmed = await api.getInfirmierAppointments(user.id);
        
        // Charger les demandes en attente (toutes les demandes sans infirmier)
        const pending = await api.getPendingAppointments('all');
        
        // Charger les types de soins
        await api.getCareTypes();
        
        console.log('📋 Confirmed appointments from backend:', confirmed);
        console.log('📋 Pending appointments from backend:', pending);
        
        // Transformer les rendez-vous confirmés
        const transformedConfirmed: Appointment[] = confirmed.map(apt => {
          // Extract patient name if available
          let patientName = 'Patient';
          if ((apt as any).patient?.user) {
            const patientUser = (apt as any).patient.user;
            patientName = `${patientUser.first_name} ${patientUser.last_name}`;
            console.log('✅ Found patient name:', patientName, 'for appointment:', apt.id);
          } else {
            console.log('⚠️ No patient data for appointment:', apt.id);
          }
          
          // Extract care type name
          let careTypeName = 'Soin';
          if ((apt as any).care_type?.name) {
            careTypeName = (apt as any).care_type.name;
          }
          
          console.log(`📅 Confirmed appointment: ${careTypeName} on ${apt.date} for ${patientName}`);
          
          return {
            id: apt.id,
            date: apt.date,
            time: '',
            timeSlot: apt.slot,
            timeSlotLabel: apt.slot === 'morning' ? t('common.morning') : apt.slot === 'afternoon' ? t('common.afternoon') : t('common.evening'),
            patientName,
            location: apt.address,
            type: careTypeName,
            careTypeId: apt.care_type_id,
            duration: apt.duration_minutes || undefined,
            status: apt.status as any,
            isUrgent: false, // TODO: Déterminer l'urgence
            patient_id: apt.patient_id,
            infirmier_id: apt.infirmier_id,
            patient_comment: apt.patient_comment
          };
        });
        
        // Transformer les demandes en attente
        const transformedPending: Appointment[] = pending.map(apt => {
          // Extract patient name if available
          let patientName = 'Patient';
          if ((apt as any).patient?.user) {
            const patientUser = (apt as any).patient.user;
            patientName = `${patientUser.first_name} ${patientUser.last_name}`;
          }
          
          // Extract care type name
          let careTypeName = 'Soin';
          if ((apt as any).care_type?.name) {
            careTypeName = (apt as any).care_type.name;
          }
          
          return {
            id: apt.id,
            date: apt.date,
            time: '',
            timeSlot: apt.slot,
            timeSlotLabel: apt.slot === 'morning' ? t('common.morning') : apt.slot === 'afternoon' ? t('common.afternoon') : t('common.evening'),
            patientName,
            location: apt.address,
            type: careTypeName,
            careTypeId: apt.care_type_id,
            duration: apt.duration_minutes || undefined,
            status: 'pending',
            isUrgent: false, // TODO: Déterminer l'urgence
            patient_id: apt.patient_id,
            patient_comment: apt.patient_comment
          };
        });
        
        console.log(`✅ Total confirmed appointments: ${transformedConfirmed.length}`);
        console.log(`✅ Total pending appointments: ${transformedPending.length}`);
        
        setAppointments(transformedConfirmed);
        setPendingAppointments(transformedPending);
      } catch (error) {
        console.error('Error fetching nurse data:', error);
      } finally {
        // data loaded
      }
    };

    fetchData();
  }, [user.id]);

  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const completedAppointments = appointments.filter(apt => apt.status === 'done');

  // Get today's date - Wednesday, January 28, 2026
  const today = new Date(); // Use current system date
  const todayStr = today.toISOString().split('T')[0];

  // Get appointments for today
  const todayAppointments = confirmedAppointments.filter(apt => apt.date === todayStr);

  // Get week range
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();
  // Simple day names based on language, though for now hardcoded 3 letters is fine or we can use Date API
  const dayNames = language === 'fr' 
    ? ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Get appointments for the week
  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return confirmedAppointments.filter(apt => apt.date === dateStr);
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{t('dashboard.pending')}</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{t('dashboard.confirmed')}</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{t('dashboard.completed')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{t('dashboard.cancelled')}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleAcceptAppointment = async (id: string) => {
    const appointment = pendingAppointments.find(apt => apt.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string, _customDuration: number) => {
    try {
      console.log('🔄 Accepting appointment:', appointmentId, 'by nurse:', user.id);
      
      // Accepter la demande dans le backend
      await api.acceptAppointment(appointmentId, user.id);
      
      console.log('✅ Appointment accepted, reloading data from backend...');
      
      // Recharger les données depuis le backend pour avoir l'état à jour
      const confirmed = await api.getInfirmierAppointments(user.id);
      const pending = await api.getPendingAppointments('all');
      
      // Transformer les données comme dans useEffect
      const transformedConfirmed: Appointment[] = confirmed.map(apt => {
        let patientName = 'Patient';
        if ((apt as any).patient?.user) {
          const patientUser = (apt as any).patient.user;
          patientName = `${patientUser.first_name} ${patientUser.last_name}`;
        }
        
        let careTypeName = 'Soin';
        if ((apt as any).care_type?.name) {
          careTypeName = (apt as any).care_type.name;
        }
        
        return {
          id: apt.id,
          date: apt.date,
          time: '',
          timeSlot: apt.slot,
          timeSlotLabel: apt.slot === 'morning' ? t('common.morning') : apt.slot === 'afternoon' ? t('common.afternoon') : t('common.evening'),
          patientName,
          location: apt.address,
          type: careTypeName,
          careTypeId: apt.care_type_id,
          duration: apt.duration_minutes || undefined,
          status: apt.status as any,
          isUrgent: false,
          patient_id: apt.patient_id,
          infirmier_id: apt.infirmier_id,
          patient_comment: apt.patient_comment
        };
      });
      
      const transformedPending: Appointment[] = pending.map(apt => {
        let patientName = 'Patient';
        if ((apt as any).patient?.user) {
          const patientUser = (apt as any).patient.user;
          patientName = `${patientUser.first_name} ${patientUser.last_name}`;
        }
        
        let careTypeName = 'Soin';
        if ((apt as any).care_type?.name) {
          careTypeName = (apt as any).care_type.name;
        }
        
        return {
          id: apt.id,
          date: apt.date,
          time: '',
          timeSlot: apt.slot,
          timeSlotLabel: apt.slot === 'morning' ? t('common.morning') : apt.slot === 'afternoon' ? t('common.afternoon') : t('common.evening'),
          patientName,
          location: apt.address,
          type: careTypeName,
          careTypeId: apt.care_type_id,
          duration: apt.duration_minutes || undefined,
          status: 'pending',
          isUrgent: false,
          patient_id: apt.patient_id,
          patient_comment: apt.patient_comment
        };
      });
      
      console.log(`✅ Reloaded: ${transformedConfirmed.length} confirmed, ${transformedPending.length} pending`);
      
      setAppointments(transformedConfirmed);
      setPendingAppointments(transformedPending);
      
      setShowConfirmDialog(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('❌ Error accepting appointment:', error);
      alert('Erreur lors de l\'acceptation du rendez-vous');
    }
  };

  const handleRejectAppointment = async (id: string) => {
    try {
      // Refuser la demande dans le backend
      await api.rejectAppointment(id);
      
      // Retirer localement
      setPendingAppointments(pendingAppointments.filter(apt => apt.id !== id));
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Erreur lors du refus du rendez-vous');
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    // Ouvrir le formulaire de compte-rendu au lieu de marquer directement
    const apt = appointments.find(a => a.id === id);
    if (apt) {
      setRecapAppointment(apt);
      setShowRecapModal(true);
    }
  };

  const handleRecapSuccess = async (appointmentId: string) => {
    try {
      // Mettre à jour le statut dans la base de données
      await api.updateAppointment(appointmentId, { status: 'done' });
      
      // Marquer localement comme 'done'
      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentId ? { ...apt, status: 'done' as const } : apt)
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rendez-vous:', error);
      toast.error('Le compte-rendu est créé, mais le statut du rendez-vous n\'a pas pu être mis à jour');
    }
    
    setShowRecapModal(false);
    setRecapAppointment(null);
  };

  const handleApplyOptimizedRoute = (optimizedAppointments: Appointment[]) => {
    // Mettre à jour l'ordre des rendez-vous avec l'ordre optimisé
    const otherAppointments = appointments.filter(
      apt => !optimizedAppointments.find(opt => opt.id === apt.id)
    );
    setAppointments([...otherAppointments, ...optimizedAppointments]);
    setShowRouteOptimizer(false);
  };

  if (showSettings) {
    return <NurseSettings user={user} onBack={() => setShowSettings(false)} />;
  }

  if (showForms) {
    const filteredForms = olgaForms.filter(f =>
      (f.form_label || f.form_id).toLowerCase().includes(formsSearch.toLowerCase())
    );
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => { setShowForms(false); setSelectedFormId(null); setSelectedFormData(null); setFormValues({}); }}>
                  ← {t('common.back')}
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-900 font-medium">Formulaires</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Liste des formulaires */}
            <div className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-2">Formulaires disponibles</h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={formsSearch}
                    onChange={e => setFormsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {formsLoading ? (
                  <div className="p-4 text-center text-sm text-gray-400">Chargement...</div>
                ) : filteredForms.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    {olgaForms.length === 0 ? 'Aucun formulaire. Vérifie que le conteneur Olga API (port 9091) est démarré.' : 'Aucun résultat.'}
                  </div>
                ) : (
                  filteredForms.map(f => (
                    <button
                      key={f.form_id}
                      onClick={() => handleSelectForm(f.form_id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors flex items-center justify-between group ${
                        selectedFormId === f.form_id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-medium ${ selectedFormId === f.form_id ? 'text-blue-700' : 'text-gray-900' }`}>
                          {f.form_label || f.form_id}
                        </p>
                        <p className="text-xs text-gray-400">{f.form_id}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Affichage du formulaire */}
            <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
              {!selectedFormData && !formLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <FileText className="h-12 w-12 mb-3 text-gray-200" />
                  <p className="text-sm">Sélectionne un formulaire dans la liste</p>
                </div>
              ) : formLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedFormData ? (
                <>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">{selectedFormData.form_label}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedFormData.form_id}{selectedFormData.form_category ? ` • ${selectedFormData.form_category}` : ''}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-4">
                      {(selectedFormData.form || []).map(field => renderOlgaField(field))}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => {
                      const init: Record<string, string | boolean> = {};
                      (selectedFormData.form || []).forEach(f => { init[f.unique_id] = f.field_type === 'checkbox' ? false : ''; });
                      setFormValues(init);
                    }}>Réinitialiser</Button>
                    <Button onClick={() => {
                      alert(`Formulaire "${selectedFormData.form_label}" soumis !\n\n${JSON.stringify(formValues, null, 2)}`);
                    }} className="bg-blue-600 hover:bg-blue-700 text-white">Soumettre</Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showRouteOptimizer) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setShowRouteOptimizer(false)}>
                  ← {t('common.back')}
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-900">{t('dashboard.nurse.ai_optimization')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AIRouteOptimizer
            appointments={appointments}
            selectedDate={todayStr}
            onApplyRoute={handleApplyOptimizedRoute as any}
            nurseId={user.id}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xl">DW</span>
                <span className="text-xl">™</span>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <span className="text-gray-600 hidden sm:inline">{t('dashboard.nurse_space')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {user.type === 'medecin' && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowValidations(true)} className="hidden sm:flex">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Validations
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowValidations(true)} className="sm:hidden">
                    <FileCheck className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="hidden sm:flex">
                <Settings className="h-4 w-4 mr-2" />
                {t('common.settings')}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="sm:hidden">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
              <LanguageSwitcher />
              <div className="items-center gap-2 hidden md:flex">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <Button onClick={onLogout} variant="outline" size="sm" className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </Button>
              <Button onClick={onLogout} variant="outline" size="icon" className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">{t('dashboard.welcome')} Dr. {user.name.split(' ')[1] || user.name}</h1>
          <p className="text-gray-600">
            {t('dashboard.nurse.stats_summary_part1')} {pendingAppointments.length} {t('dashboard.nurse.stats_summary_part2')} {confirmedAppointments.length} {t('dashboard.nurse.stats_summary_part3')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('dashboard.pending')}</p>
                  <p className="text-2xl text-gray-900 mt-1">{pendingAppointments.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('dashboard.confirmed')}</p>
                  <p className="text-2xl text-gray-900 mt-1">{confirmedAppointments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('dashboard.completed')}</p>
                  <p className="text-2xl text-gray-900 mt-1">{completedAppointments.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="pending">{t('dashboard.pending_requests')}</TabsTrigger>
            <TabsTrigger value="confirmed">{t('dashboard.confirmed')}</TabsTrigger>
            <TabsTrigger value="completed">{t('dashboard.completed')}</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {/* Pending Requests */}
            {pendingAppointments.length > 0 && (
              <div className="space-y-4">
                {pendingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{appointment.type}</CardTitle>
                            {appointment.isUrgent && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                {t('dashboard.urgent')}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{t('dashboard.patient')}: {appointment.patientName}</CardDescription>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{appointment.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{appointment.location}</span>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAcceptAppointment(appointment.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('dashboard.accept')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectAppointment(appointment.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('dashboard.reject')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="confirmed">
            {/* View Toggle */}
            <div className="mb-4 flex justify-end gap-2">
              <Button
                variant={activeView === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('today')}
              >
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.today')}</span>
              </Button>
              <Button
                variant={activeView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('week')}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.this_week')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRouteOptimizer(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.nurse.optimize_routes')}</span>
              </Button>
            </div>

            {/* Confirmed Appointments */}
            {activeView === 'today' ? (
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">{appointment.type}</CardTitle>
                              {appointment.isUrgent && (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                  {t('dashboard.urgent')}
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{t('dashboard.patient')}: {appointment.patientName}</CardDescription>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">
                            {appointment.time || (
                              <span className="flex items-center gap-1">
                                {appointment.timeSlot === 'morning' && <Sunrise className="h-3 w-3 text-orange-500" />}
                                {appointment.timeSlot === 'afternoon' && <Sun className="h-3 w-3 text-yellow-500" />}
                                {appointment.timeSlot === 'evening' && <Moon className="h-3 w-3 text-indigo-500" />}
                                <span className="text-gray-500">{appointment.timeSlotLabel} {t('dashboard.to_schedule')}</span>
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm">{appointment.location}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(appointment.location)}`, '_blank')}
                          >
                            <Navigation className="h-3 w-3 mr-2" />
                            {t('dashboard.appointments.gps')}
                          </Button>
                        </div>
                        <div className="pt-2 flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                          >
                            {t('dashboard.appointments.details')}
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-black hover:bg-gray-800 text-white"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                          >
                            {t('dashboard.mark_completed')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">{t('dashboard.nurse.no_confirmed_today')}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weekDays.map((day, index) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isToday = day.toISOString().split('T')[0] === todayStr;
                  return (
                    <Card 
                      key={day.toISOString().split('T')[0]} 
                      className={`hover:shadow-lg transition-shadow ${isToday ? 'border-2 border-blue-500' : ''}`}
                    >
                      <CardHeader className={isToday ? 'bg-blue-50' : ''}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm text-gray-600">{dayNames[index]}</p>
                              {isToday && (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                  {t('dashboard.today')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-900">{day.getDate()}</p>
                            <p className="text-sm text-gray-500">
                              {day.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' })}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl">{dayAppointments.length}</p>
                            <p className="text-xs text-gray-500">{t('dashboard.appointment_short')}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {dayAppointments.length > 0 ? (
                          <div className="space-y-3">
                            {dayAppointments.map((appointment) => (
                              <div 
                                key={appointment.id} 
                                className="border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50 transition-colors rounded-r"
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                      <span className="text-sm">{appointment.time}</span>
                                      {appointment.isUrgent && (
                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                                          {t('dashboard.urgent')}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm">{appointment.type}</p>
                                    <p className="text-xs text-gray-500">{appointment.patientName}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">{t('dashboard.nurse.no_appointments')}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="completed">
            {/* Past Appointments */}
            {completedAppointments.length > 0 ? (
              <div className="space-y-3">
                {completedAppointments.map((appointment) => (
                  <Card key={appointment.id} className="bg-gray-50">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-gray-900">{appointment.type}</span>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{formatDate(appointment.date)}</span>
                            <span>•</span>
                            <span>{appointment.time}</span>
                            <span>•</span>
                            <span>{appointment.patientName}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}>
                          {t('dashboard.appointments.details')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600">{t('dashboard.appointments.no_past')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirm Dialog */}
      {showConfirmDialog && selectedAppointment && (
        <AppointmentConfirmDialog
          appointment={selectedAppointment}
          onConfirm={handleConfirmAppointment}
          onCancel={() => {
            setShowConfirmDialog(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onComplete={() => {
            handleCompleteAppointment(selectedAppointment.id);
            setShowDetailsModal(false);
          }}
          patientId={selectedAppointment.patient_id}
        />
      )}

      {/* Visit Recap Modal */}
      {showRecapModal && recapAppointment && (
        <VisitRecapModal
          open={showRecapModal}
          onClose={() => { setShowRecapModal(false); setRecapAppointment(null); }}
          appointmentId={recapAppointment.id}
          pmId={user.id}
          pmRole={user.type === 'medecin' ? 'medecin' : 'infirmier'}
          patientName={recapAppointment.patientName}
          careType={recapAppointment.type}
          onSuccess={handleRecapSuccess}
        />
      )}

      {/* Medecin Validations Modal */}
      {showValidations && user.type === 'medecin' && (
        <MedecinValidationsModal
          medecinId={user.id}
          onClose={() => setShowValidations(false)}
        />
      )}
    </div>
  );
}