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
  Video
} from 'lucide-react';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { AppointmentConfirmDialog } from './AppointmentConfirmDialog';
import { AIRouteOptimizer } from './AIRouteOptimizer';
import { NurseSettings } from './NurseSettings';
import type { User as UserType } from '../App';
import * as api from '../services/api';
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isUrgent: boolean;
  // Backend fields
  patient_id?: string;
  infirmier_id?: string | null;
  patient_comment?: string | null;
}

export function NurseDashboard({ user, onLogout }: NurseDashboardProps) {
  const { t, language } = useLanguage();
  const [activeView, setActiveView] = useState<'today' | 'week'>('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [careTypes, setCareTypes] = useState<api.CareType[]>([]);

  // Charger les rendez-vous depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les rendez-vous confirmés de l'infirmier
        const confirmed = await api.getInfirmierAppointments(user.id);
        
        // Charger les demandes en attente (toutes les demandes sans infirmier)
        const pending = await api.getPendingAppointments('all');
        
        // Charger les types de soins
        const types = await api.getCareTypes();
        setCareTypes(types);
        
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
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  // Get today's date
  const today = new Date();
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

  const handleConfirmAppointment = async (appointmentId: string, customDuration: number) => {
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

  const handleLiveVisio = (appointment: Appointment) => {
    console.log('Live visio avec', appointment.patientName);
    // TODO: Logique de visio en direct
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      // Marquer comme terminé dans le backend
      await api.updateAppointment(id, { status: 'completed' });
      
      // Mettre à jour localement
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status: 'completed' as const } : apt
      ));
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Erreur lors de la fin du rendez-vous');
    }
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
            onApplyRoute={handleApplyOptimizedRoute}
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
                        <div className="pt-2 space-y-2">
                          <div className="flex gap-2">
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
                          <Button
                            onClick={() => handleLiveVisio(appointment)}
                            variant="outline"
                            className="gap-2 w-full"
                            size="sm"
                          >
                            <Video className="h-4 w-4" />
                            <span className="hidden sm:inline">Live visio connect</span>
                            <span className="sm:hidden">Visio</span>
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
          patientId={selectedAppointment.patient?.id || selectedAppointment.patient_id}
        />
      )}
    </div>
  );
}