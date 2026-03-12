import { useState, useEffect } from 'react';
import { PatientProfileContent } from './PatientProfileContent';
import * as api from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  MapPin, 
  User, 
  UserCircle, 
  LogOut, 
  Plus,
  Pill,
  FileText
} from 'lucide-react';
import { BookingPage } from './BookingPage';
import { NurseResultsPage } from './NurseResultsPage';
import { AppointmentScheduler } from './AppointmentScheduler';
import { IncomingCallNotification, type IncomingCall } from './IncomingCallNotification';
import { VisioModal } from './VisioModal';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface UserType {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  type: 'patient' | 'nurse';
}

interface PatientDashboardProps {
  user: UserType;
  onLogout: () => void;
  onUpdateUser?: (updatedUser: UserType) => void;
}

type ViewType = 'dashboard' | 'booking' | 'results' | 'scheduler' | 'profile';

interface SearchCriteria {
  motif: string;
  langue: string;
  disponibilite: string;
  adresse: string;
  isUrgent: boolean;
}

interface SelectedNurse {
  id: string;
  name: string;
  avatar: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  nurseName: string;
  nurseId?: string;
  location: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  // Backend fields
  backendStatus?: 'pending' | 'confirmed' | 'cancelled' | 'done';
  slot?: 'morning' | 'afternoon' | 'evening';
  patient_comment?: string | null;
}

export function PatientDashboard({ user, onLogout, onUpdateUser }: PatientDashboardProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<ViewType>('dashboard');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    motif: '',
    langue: '',
    disponibilite: '',
    adresse: '',
    isUrgent: false
  });
  const [selectedNurse, setSelectedNurse] = useState<SelectedNurse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [careTypes, setCareTypes] = useState<api.CareType[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [showVisioModal, setShowVisioModal] = useState(false);
  const [visioAppointment, setVisioAppointment] = useState<Appointment | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const fetchAppointments = async () => {
    try {
      const dbAppointments = await api.getPatientAppointments(user.id);
      
      console.log('📋 Appointments from backend:', dbAppointments);
      
      // Transform backend appointments to frontend format
      const transformedAppointments: Appointment[] = dbAppointments.map(apt => {
        // Extract nurse name if available
        let nurseName = 'En attente d\'assignation';
        if (apt.infirmier_id && (apt as any).infirmier?.user) {
          const infUser = (apt as any).infirmier.user;
          nurseName = `${infUser.first_name} ${infUser.last_name}`;
          console.log('✅ Found nurse name:', nurseName, 'for appointment:', apt.id);
        } else {
          console.log('⚠️ No infirmier assigned for appointment:', apt.id);
        }
        
        // Extract care type name
        let careTypeName = 'Soin';
        if ((apt as any).care_type?.name) {
          careTypeName = (apt as any).care_type.name;
        }
        
        return {
          id: apt.id,
          date: apt.date,
          time: apt.slot === 'morning' ? '09:00' : apt.slot === 'afternoon' ? '14:00' : '18:00',
          nurseName,
          nurseId: apt.infirmier_id,
          location: apt.address,
          type: careTypeName,
          status: apt.status === 'pending' ? 'upcoming' : 
                  apt.status === 'confirmed' ? 'upcoming' :
                  apt.status === 'done' ? 'completed' : 'cancelled',
          backendStatus: apt.status,
          slot: apt.slot,
          patient_comment: apt.patient_comment
        };
      });
      
      console.log('✅ Transformed appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCareTypes = async () => {
      try {
        const response = await api.getCareTypes();
        setCareTypes(response);
      } catch (error) {
        console.error('Error fetching care types:', error);
      }
    };

    fetchAppointments();
    fetchCareTypes();

  }, [user.id]);

  // Setup WebSocket connection for incoming calls
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const wsUrl = `${wsProtocol}://${wsHost}:8080`;
    console.log('📡 Patient connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Patient WebSocket connected to:', wsUrl);
      console.log('📤 Sending join message with patient ID:', user.id);
      // Send join message with patient ID to register for incoming calls
      ws.send(JSON.stringify({
        type: 'join',
        patientId: user.id,
        role: 'patient',
        username: user.name
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📨 Patient received message:', message);

      if (message.type === 'incoming-call') {
        console.log('📞 INCOMING CALL DETECTED!', message);
        const incomingCallObj: IncomingCall = {
          id: message.appointmentId || `call_${Date.now()}`,
          from: message.from,
          fromUserId: message.nurseId,
          nurseName: message.from,
          appointmentId: message.appointmentId,
          timestamp: message.timestamp || Date.now()
        };
        console.log('📞 Setting incoming call notification:', incomingCallObj);
        setIncomingCall(incomingCallObj);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error on patient side:', error);
      console.error('⚠️ Could not connect to WebSocket at:', wsUrl);
    };

    ws.onclose = () => {
      console.log('👋 Patient WebSocket closed');
    };

    setWsConnection(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user.id]);

  const handleAcceptIncomingCall = (call: IncomingCall) => {
    console.log('📞 Accepting call:', call);
    
    // Fermer la notification immédiatement
    setIncomingCall(null);
    
    // Chercher le RDV correspondant, sinon en créer un temporaire
    const appointment = appointments.find(apt => apt.id === call.appointmentId);
    const visioData = appointment || {
      id: call.appointmentId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      nurseName: call.nurseName,
      nurseId: call.fromUserId,
      location: '',
      type: 'Visio',
      status: 'upcoming' as const,
    };
    
    console.log('📹 Opening visio with data:', visioData);
    setVisioAppointment(visioData);
    setShowVisioModal(true);
    
    // Envoyer l'acceptation à l'infirmière
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'call-accepted',
        appointmentId: call.appointmentId,
        patientId: user.id,
        to: call.fromUserId
      }));
    }
  };

  const handleRejectIncomingCall = (call: IncomingCall) => {
    setIncomingCall(null);
    
    // Send rejection message to nurse
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'call-rejected',
        appointmentId: call.appointmentId,
        patientId: user.id,
        to: call.fromUserId
      }));
    }
    
    toast.error('Appel refusé');
  };

  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'upcoming')
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
  const pastAppointments = appointments
    .filter(apt => apt.status === 'completed')
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Plus récent en premier
    });

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{t('dashboard.appointments.status_upcoming')}</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{t('dashboard.appointments.status_completed')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{t('dashboard.appointments.status_cancelled')}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      // Annuler le rendez-vous dans le backend
      await api.cancelAppointment(id);
      
      // Mettre à jour localement
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
      ));
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const handleSearchNurses = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    setView('results');
  };

  const handleBookAppointment = (nurse: any) => {
    setSelectedNurse({
      id: nurse.id,
      name: nurse.name,
      avatar: nurse.avatar
    });
    setView('scheduler');
  };

  const handleConfirmAppointment = async (selectedSlots: any[]) => {
    try {
      // Obtenir ou créer le care type basé sur le nom du motif
      let careTypeId = 'general-care'; // valeur par défaut
      
      if (searchCriteria.motif) {
        try {
          console.log('🔍 Recherche du care type pour:', searchCriteria.motif);
          
          // Appeler l'API pour obtenir ou créer le care type
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/care-types/get-or-create`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ name: searchCriteria.motif }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            careTypeId = result.careType.id;
            console.log('✅ Care type trouvé/créé:', result.careType);
          } else {
            console.warn('⚠️ Impossible de créer le care type, utilisation de la valeur par défaut');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération du care type:', error);
        }
      }

      // Créer les rendez-vous dans la base de données
      const appointmentPromises = selectedSlots.map(async (slot) => {
        // Déterminer le slot (morning, afternoon, evening)
        let timeSlot: 'morning' | 'afternoon' | 'evening' = 'morning';
        if (slot.startTime >= '14:00' && slot.startTime < '18:00') {
          timeSlot = 'afternoon';
        } else if (slot.startTime >= '18:00') {
          timeSlot = 'evening';
        }

        const appointmentData = {
          patient_id: user.id,
          infirmier_id: selectedNurse?.id,
          status: 'pending' as const,
          date: slot.date.toISOString().split('T')[0],
          slot: timeSlot,
          care_type_id: careTypeId,
          address: user.address || searchCriteria.adresse,
          language: searchCriteria.langue || 'Français',
          duration_minutes: 30,
          patient_comment: ''
        };

        console.log('📤 Envoi du rendez-vous:', appointmentData);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/appointments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(appointmentData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Erreur API:', errorData);
          throw new Error(errorData.error || 'Failed to create appointment');
        }

        const result = await response.json();
        console.log('✅ Rendez-vous créé:', result);
        return result.appointment;
      });

      await Promise.all(appointmentPromises);
      
      toast.success('Rendez-vous créé avec succès !');
      
      // Recharger les rendez-vous
      await fetchAppointments();
      
      setView('dashboard');
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      toast.error('Erreur lors de la création du rendez-vous');
    }
  };

  if (view === 'booking') {
    return <BookingPage user={user} onBack={() => setView('dashboard')} onSearch={handleSearchNurses} />;
  }

  if (view === 'results') {
    return (
      <NurseResultsPage
        user={user}
        searchCriteria={searchCriteria}
        onBack={() => setView('booking')}
        onBookAppointment={handleBookAppointment}
      />
    );
  }

  if (view === 'scheduler' && selectedNurse) {
    return (
      <AppointmentScheduler
        user={user}
        nurse={selectedNurse}
        isUrgent={searchCriteria.isUrgent}
        careType={searchCriteria.motif}
        onBack={() => setView('results')}
        onBookingComplete={handleConfirmAppointment}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xl">DW</span>
                <span className="text-xl">™</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-gray-600">{t('dashboard.patient_space')}</span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <Button onClick={onLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">{t('dashboard.welcome')} {user.name.split(' ')[0]}</h1>
          <p className="text-gray-600">
            {t('dashboard.appointments.empty_title')}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setView('dashboard')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                view === 'dashboard'
                  ? 'border-black text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-4 w-4 inline mr-2" />
              {t('dashboard.my_appointments')}
            </button>
            <button
              onClick={() => setView('profile')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                view === 'profile'
                  ? 'border-black text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCircle className="h-4 w-4 inline mr-2" />
              {t('dashboard.personal_info')}
            </button>
          </div>
        </div>

        {view === 'dashboard' ? (
          <>
            {/* Quick Action */}
            <div className="mb-8">
              <Button 
                size="lg" 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => setView('booking')}
              >
                <Plus className="h-5 w-5 mr-2" />
                {t('dashboard.appointments.new')}
              </Button>
            </div>

            {/* Upcoming Appointments */}
            <div className="mb-8">
              <h2 className="text-gray-900 mb-4">{t('dashboard.appointments.upcoming')}</h2>
              {upcomingAppointments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg mb-1">{appointment.type}</CardTitle>
                            <CardDescription>{appointment.nurseName}</CardDescription>
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
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            {t('dashboard.appointments.cancel')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">{t('dashboard.appointments.none')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('dashboard.appointments.empty_description')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Past Appointments */}
            <div>
              <h2 className="text-gray-900 mb-4">{t('dashboard.appointments.past')}</h2>
              {pastAppointments.length > 0 ? (
                <div className="space-y-3">
                  {pastAppointments.map((appointment) => (
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
                              <span>{appointment.nurseName}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsDetailsOpen(true);
                            }}
                          >
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
            </div>
          </>
        ) : (
          <PatientProfileContent user={user} onUpdateUser={onUpdateUser} />
        )}
      </main>

      {/* Appointment Details Dialog */}
      {isDetailsOpen && selectedAppointment && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('dashboard.appointments.details_title')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.appointments.consultation_ended')} {formatDate(selectedAppointment.date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              {/* Informations générales */}
              <div>
                <h3 className="text-sm text-gray-700 mb-2">{t('dashboard.appointments.general_info')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">{t('common.date')}</span>
                      <p className="text-sm">{formatDate(selectedAppointment.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">{t('common.time')}</span>
                      <p className="text-sm">{selectedAppointment.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">{t('common.nurse')}</span>
                      <p className="text-sm">{selectedAppointment.nurseName}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">{t('common.location')}</span>
                      <p className="text-sm">{selectedAppointment.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <Pill className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">{t('common.care_type')}</span>
                      <p className="text-sm">{selectedAppointment.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compte-rendu */}
              <div>
                <h3 className="text-sm text-gray-700 mb-2">{t('dashboard.appointments.report')}</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {t('dashboard.appointments.report_content')}
                  </p>
                </div>
              </div>

              {/* Ordonnance si applicable */}
              {selectedAppointment.type === 'Injection' && (
                <div>
                  <h3 className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('dashboard.prescriptions.associated')}
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-xs text-gray-700 mb-1">{t('dashboard.prescriptions.medications')}</p>
                    <ul className="space-y-1 text-sm text-gray-700 mb-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        Paracétamol 1g - 3x/jour (5 jours)
                      </li>
                    </ul>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('common.download')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Recommandations */}
              <div>
                <h3 className="text-sm text-gray-700 mb-2">{t('dashboard.recommendations')}</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {t('dashboard.recommendations.1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {t('dashboard.recommendations.2')}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                {t('common.download')}
              </Button>
              <Button onClick={() => setIsDetailsOpen(false)} size="sm" className="flex-1 bg-black hover:bg-gray-800">
                {t('common.close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCallNotification
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}

      {/* Visio Modal - patient side: no nurseId to avoid re-triggering incoming-call */}
      {visioAppointment && (
        <VisioModal
          isOpen={showVisioModal}
          onClose={() => {
            setShowVisioModal(false);
            setVisioAppointment(null);
          }}
          userName={user.name}
          otherUserName={visioAppointment.nurseName}
          roomId={visioAppointment.id}
          patientId={user.id}
        />
      )}
    </div>
  );
}