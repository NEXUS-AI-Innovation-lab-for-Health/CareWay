import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, Sunrise, Sun, Moon, CheckCircle, Sparkles, User, Clock, ArrowRight, Home, MapPin } from 'lucide-react';
import { type CareType, getCareTypeByLabel } from '../constants/careTypes';
import { CareTypeSelector } from './CareTypeSelector';

interface Nurse {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  languages: string[];
  distance: string;
  availability: string;
  photo: string;
}

interface AppointmentSchedulerProps {
  nurse: Nurse;
  onBack: () => void;
  onBookingComplete: (selectedSlots: any[]) => void;
  user?: any;
  isUrgent?: boolean;
  careType?: string;
}

type TimeSlotId = 'morning' | 'afternoon' | 'evening';

interface TimeSlotOption {
  id: TimeSlotId;
  label: string;
  icon: typeof Sunrise;
  timeRange: string;
  description: string;
  color: string;
}

interface SelectedSlot {
  date: Date;
  timeSlotId: TimeSlotId;
  label: string;
}

const timeSlotOptions: TimeSlotOption[] = [
  {
    id: 'morning',
    label: 'Matin',
    icon: Sunrise,
    timeRange: '8h - 12h',
    description: 'Horaire optimisé par l\'IA',
    color: 'orange'
  },
  {
    id: 'afternoon',
    label: 'Après-midi',
    icon: Sun,
    timeRange: '14h - 18h',
    description: 'Horaire optimisé par l\'IA',
    color: 'yellow'
  },
  {
    id: 'evening',
    label: 'Soirée',
    icon: Moon,
    timeRange: '18h - 20h',
    description: 'Horaire optimisé par l\'IA',
    color: 'indigo'
  }
];

export function AppointmentScheduler({ nurse, onBack, onBookingComplete, user, isUrgent, careType }: AppointmentSchedulerProps) {
  const [step, setStep] = useState<'care-type' | 'time-slots'>('care-type');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedCareType, setSelectedCareType] = useState<CareType | null>(null);
  const [isAtHome, setIsAtHome] = useState(true);
  const [customAddress, setCustomAddress] = useState('');
  const [daysToShow, setDaysToShow] = useState(7);

  // Update days to show based on screen size
  useEffect(() => {
    const updateDaysToShow = () => {
      if (window.innerWidth < 640) {
        setDaysToShow(3); // Mobile: 3 days
      } else if (window.innerWidth < 1024) {
        setDaysToShow(5); // Tablet: 5 days
      } else {
        setDaysToShow(7); // Desktop: 7 days
      }
    };
    
    updateDaysToShow();
    window.addEventListener('resize', updateDaysToShow);
    return () => window.removeEventListener('resize', updateDaysToShow);
  }, []);

  // Si un careType est fourni en prop, l'utiliser et passer directement à l'étape des créneaux
  useEffect(() => {
    if (careType) {
      const matchedCareType = getCareTypeByLabel(careType);
      if (matchedCareType) {
        setSelectedCareType(matchedCareType);
        setStep('time-slots');
      }
    }
  }, [careType]);

  // Générer des jours consécutifs à partir de l'offset
  const getDays = (offset: number = 0, numDays: number = 7) => {
    // Simulated current date - Wednesday, January 28, 2026
    const today = new Date('2026-01-28');
    const days = [];
    for (let i = 0; i < numDays; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + offset * numDays + i);
      days.push(day);
    }
    return days;
  };

  const days = getDays(currentWeekOffset, daysToShow);
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const formatDayHeader = (date: Date) => {
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    return { dayName, dateStr: `${day} ${month}` };
  };

  const handleSlotClick = (date: Date, timeSlotId: TimeSlotId, label: string) => {
    const isSelected = selectedSlots.some(
      s => s.date.toDateString() === date.toDateString() && s.timeSlotId === timeSlotId
    );

    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(
        s => !(s.date.toDateString() === date.toDateString() && s.timeSlotId === timeSlotId)
      ));
    } else {
      setSelectedSlots([...selectedSlots, { date, timeSlotId, label }]);
    }
  };

  const isSlotSelected = (date: Date, timeSlotId: TimeSlotId): boolean => {
    return selectedSlots.some(
      slot => 
        slot.date.toDateString() === date.toDateString() &&
        slot.timeSlotId === timeSlotId
    );
  };

  const handleConfirm = () => {
    if (selectedSlots.length === 0) {
      alert('Veuillez sélectionner au moins un créneau');
      return;
    }
    
    // Convert slots to include startTime
    const slotsWithTime = selectedSlots.map(slot => {
      let startTime = '08:00'; // Default
      if (slot.timeSlotId === 'afternoon') startTime = '14:00';
      else if (slot.timeSlotId === 'evening') startTime = '18:00';
      
      return {
        ...slot,
        startTime
      };
    });
    
    onBookingComplete(slotsWithTime);
  };

  const getColorClasses = (color: string, selected: boolean) => {
    if (selected) {
      return {
        bg: 'bg-purple-600',
        text: 'text-white',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700'
      };
    }

    const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-900',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-100'
      },
      indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-900',
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-100'
      }
    };

    return colorMap[color] || colorMap.orange;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              ← Retour
            </Button>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-gray-900">{nurse.name}</h2>
                <p className="text-sm text-gray-600">{nurse.specialty}</p>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${step === 'care-type' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step === 'care-type' ? 'bg-purple-600 text-white' : 'bg-gray-400 text-white'}`}>
                1
              </div>
              <span className="text-sm hidden sm:inline">Type de soin</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${step === 'time-slots' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step === 'time-slots' ? 'bg-purple-600 text-white' : 'bg-gray-400 text-white'}`}>
                2
              </div>
              <span className="text-sm hidden sm:inline">Créneaux horaires</span>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 mb-1">
                  <strong>Réservation intelligente avec optimisation IA</strong>
                </p>
                <p className="text-xs text-gray-700">
                  Choisissez votre type de soin et des plages horaires flexibles. L'infirmier optimisera automatiquement l'heure exacte pour minimiser ses déplacements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {step === 'care-type' ? (
          <>
            <CareTypeSelector
              selectedCareType={selectedCareType}
              onSelect={setSelectedCareType}
            />

            {/* Selected Care Type Summary */}
            {selectedCareType && (
              <Card className="p-4 mt-6 bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCareType.icon}</span>
                    <div>
                      <p className="text-sm text-gray-900">
                        <strong>{selectedCareType.label}</strong>
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Durée estimée : {selectedCareType.duration} minutes</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep('time-slots')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Care Type Summary at top */}
            {selectedCareType && (
              <Card className="p-3 mb-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedCareType.icon}</span>
                    <div>
                      <p className="text-sm text-gray-900">{selectedCareType.label}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{selectedCareType.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep('care-type')}
                    variant="ghost"
                    size="sm"
                  >
                    Modifier
                  </Button>
                </div>
              </Card>
            )}

            <h1 className="text-xl text-gray-900 mb-6">Sélectionnez vos créneaux préférés</h1>

            {/* Week Navigation */}
            <div className="flex items-center justify-between gap-2 mb-6">
              <Button
                onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                variant="outline"
                size="sm"
                disabled={currentWeekOffset === 0}
                className="shrink-0"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Semaine précédente</span>
              </Button>
              
              <span className="text-xs sm:text-sm text-gray-600 text-center">
                <span className="hidden sm:inline">Semaine du </span>
                {days[0].getDate()} {monthNames[days[0].getMonth()]}
              </span>

              <Button
                onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <span className="hidden sm:inline">Semaine suivante</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
              {days.map((day, dayIndex) => {
                const { dayName, dateStr } = formatDayHeader(day);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div key={dayIndex}>
                    {/* Day Header */}
                    <div className={`text-center mb-3 p-2 rounded-lg ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className="text-sm text-gray-600">{dayName}</div>
                      <div className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {dateStr}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2">
                      {timeSlotOptions.map((timeSlot) => {
                        const Icon = timeSlot.icon;
                        const selected = isSlotSelected(day, timeSlot.id);
                        const colorClasses = getColorClasses(timeSlot.color, selected);
                        
                        return (
                          <button
                            key={timeSlot.id}
                            onClick={() => handleSlotClick(day, timeSlot.id, timeSlot.label)}
                            className={`
                              w-full p-3 rounded-lg border-2 transition-all text-left
                              ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} ${colorClasses.hover}
                            `}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-xs truncate">{timeSlot.label}</span>
                            </div>
                            <div className="text-xs opacity-75">{timeSlot.timeRange}</div>
                            {selected && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="h-3 w-3" />
                                <span className="text-xs">Sélectionné</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>

            {/* Selected Slots Summary */}
            {selectedSlots.length > 0 && (
              <Card className="p-4 mb-6 bg-purple-50 border-purple-200">
                <p className="text-sm text-gray-900 mb-3">
                  <strong>Créneaux sélectionnés : {selectedSlots.length}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.map((slot, index) => (
                    <Badge key={index} className="bg-purple-600 text-white hover:bg-purple-700">
                      {dayNames[slot.date.getDay()]} {slot.date.getDate()}/{slot.date.getMonth() + 1} • {slot.label}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs text-gray-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    L'infirmier optimisera les horaires exacts et vous confirmera 24h avant chaque visite.
                  </p>
                </div>
              </Card>
            )}

            {/* Address Selection */}
            <Card className="p-5 mb-6">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                Adresse de la visite
              </h3>
              
              {/* At Home Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-purple-300 cursor-pointer transition-all mb-4">
                <input
                  type="checkbox"
                  checked={isAtHome}
                  onChange={(e) => {
                    setIsAtHome(e.target.checked);
                    if (e.target.checked) {
                      setCustomAddress('');
                    }
                  }}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-900">
                      <strong>À mon domicile</strong>
                    </p>
                    {user?.address && (
                      <p className="text-xs text-gray-600">{user.address}</p>
                    )}
                  </div>
                </div>
              </label>

              {/* Custom Address Input */}
              {!isAtHome && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">Adresse personnalisée</label>
                  <textarea
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Exemple : 15 Rue de la Paix, 75002 Paris"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    Vous pouvez aussi me dire l'adresse et je la remplirai automatiquement
                  </p>
                </div>
              )}
              
              {/* Display selected address */}
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Adresse retenue :</p>
                <p className="text-sm text-gray-900">
                  {isAtHome 
                    ? (user?.address || 'Adresse domicile non renseignée') 
                    : (customAddress || 'Aucune adresse saisie')}
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setStep('care-type')}
                variant="outline"
                size="lg"
              >
                ← Retour
              </Button>
              <Button
                onClick={handleConfirm}
                size="lg"
                disabled={selectedSlots.length === 0}
                className="bg-black text-white hover:bg-gray-800 px-8"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer ({selectedSlots.length} {selectedSlots.length > 1 ? 'créneaux' : 'créneau'})
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}