import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MapPin, Car, Bike, Bus, User as UserIcon, Calendar, Clock, Bell, RotateCcw, Stethoscope, Route as RouteIcon, Coffee, Shield, CalendarX } from 'lucide-react';
import { careTypes } from '../constants/careTypes';
import { UnavailabilityManager } from './UnavailabilityManager';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from './LanguageContext';

interface NurseSettingsProps {
  user: any;
  onBack: () => void;
}

interface TimeSlot {
  start: string;
  end: string;
}

export function NurseSettings({ user, onBack }: NurseSettingsProps) {
  const { t } = useLanguage();
  
  // Lieu de départ
  const [address, setAddress] = useState('15 Rue de la République, Lyon 69002');

  // Mode de transport
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'transit' | 'walking'>('car');
  const [maxDistance, setMaxDistance] = useState('15');

  // Jours de travail
  const [workDays, setWorkDays] = useState({
    lundi: true,
    mardi: true,
    mercredi: true,
    jeudi: true,
    vendredi: true,
    samedi: false,
    dimanche: false
  });

  // Horaires préférés
  const [preferredHours, setPreferredHours] = useState<TimeSlot[]>([
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '18:00' }
  ]);

  // Horaires non souhaités
  const [unwantedHours, setUnwantedHours] = useState<TimeSlot[]>([
    { start: '12:00', end: '14:00' }
  ]);

  // Pauses et marges
  const [pauseDuration, setPauseDuration] = useState('15'); // en minutes
  const [pauseFrequency, setPauseFrequency] = useState('120'); // en minutes (2h)
  const [safetyMargin, setSafetyMargin] = useState('10'); // en minutes

  // Notifications
  const [notifications, setNotifications] = useState({
    newAppointments: true,
    cancellations: true,
    reminders: true,
    patientMessages: false
  });

  // Durées personnalisées - charger depuis localStorage
  const [customDurations, setCustomDurations] = useState<Record<string, number>>(() => {
    // Valeurs par défaut
    const initial: Record<string, number> = {};
    careTypes.forEach(type => {
      initial[type.id] = type.duration;
    });

    const saved = localStorage.getItem('nurseCustomDurations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Merge saved durations with initial to ensure all keys exist
          return { ...initial, ...parsed };
        }
      } catch (e) {
        console.error('Error loading custom durations:', e);
      }
    }
    
    return initial;
  });

  useEffect(() => {
    // Charger les paramètres de l'infirmière depuis Supabase
    const fetchNurseSettings = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/infirmier/${user.id}/settings`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Settings API response:', data);
          
          // L'API retourne { success: true, settings: {...} }
          const settings = data.settings || data;
          console.log('Parsed settings:', settings);
          
          // Charger l'adresse de départ si elle existe
          if (settings.start_address) {
            console.log('Setting address to:', settings.start_address);
            setAddress(settings.start_address);
          }
          
          // Charger le mode de transport
          if (settings.transport) {
            setTransportMode(settings.transport);
          }
          
          // Charger la distance maximale
          if (settings.max_distance_km) {
            setMaxDistance(String(settings.max_distance_km));
          }
          
          // Charger les paramètres de pause
          if (settings.break_duration_minutes) {
            setPauseDuration(String(settings.break_duration_minutes));
          }
          
          if (settings.break_every_minutes) {
            setPauseFrequency(String(settings.break_every_minutes));
          }
          
          if (settings.safety_margin_minutes !== undefined) {
            setSafetyMargin(String(settings.safety_margin_minutes));
          }
        } else {
          console.error('Failed to fetch settings:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading nurse settings:', error);
      }
    };

    fetchNurseSettings();

    // Charger le mode de transport depuis localStorage (fallback)
    const savedTransportMode = localStorage.getItem('nurseTransportMode');
    if (savedTransportMode) {
      setTransportMode(savedTransportMode as 'car' | 'bike' | 'transit' | 'walking');
    }

    // Charger les paramètres de pause et marge depuis localStorage (fallback)
    const savedPauseDuration = localStorage.getItem('nursePauseDuration');
    if (savedPauseDuration) {
      setPauseDuration(savedPauseDuration);
    }

    const savedPauseFrequency = localStorage.getItem('nursePauseFrequency');
    if (savedPauseFrequency) {
      setPauseFrequency(savedPauseFrequency);
    }

    const savedSafetyMargin = localStorage.getItem('nurseSafetyMargin');
    if (savedSafetyMargin) {
      setSafetyMargin(savedSafetyMargin);
    }
  }, [user.id]);

  const handleSave = () => {
    // Sauvegarder les durées personnalisées dans localStorage
    localStorage.setItem('nurseCustomDurations', JSON.stringify(customDurations));
    
    // Sauvegarder le mode de transport dans localStorage
    localStorage.setItem('nurseTransportMode', transportMode);
    
    // Sauvegarder les paramètres de pause et marge
    localStorage.setItem('nursePauseDuration', pauseDuration);
    localStorage.setItem('nursePauseFrequency', pauseFrequency);
    localStorage.setItem('nurseSafetyMargin', safetyMargin);
    
    console.log('Saving settings...', {
      address,
      transportMode,
      maxDistance,
      workDays,
      preferredHours,
      unwantedHours,
      notifications,
      customDurations,
      pauseDuration,
      pauseFrequency,
      safetyMargin
    });
    alert(t('settings.success'));
  };

  const handleCancel = () => {
    onBack();
  };

  const addPreferredHour = () => {
    setPreferredHours([...preferredHours, { start: '09:00', end: '17:00' }]);
  };

  const removePreferredHour = (index: number) => {
    setPreferredHours(preferredHours.filter((_, i) => i !== index));
  };

  const updatePreferredHour = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...preferredHours];
    updated[index][field] = value;
    setPreferredHours(updated);
  };

  const addUnwantedHour = () => {
    setUnwantedHours([...unwantedHours, { start: '12:00', end: '14:00' }]);
  };

  const removeUnwantedHour = (index: number) => {
    setUnwantedHours(unwantedHours.filter((_, i) => i !== index));
  };

  const updateUnwantedHour = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...unwantedHours];
    updated[index][field] = value;
    setUnwantedHours(updated);
  };

  const handleDurationChange = (careTypeId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 180) {
      setCustomDurations(prev => ({
        ...prev,
        [careTypeId]: numValue
      }));
    }
  };

  const handleResetDuration = (careTypeId: string) => {
    const defaultDuration = careTypes.find(t => t.id === careTypeId)?.duration || 30;
    setCustomDurations(prev => ({
      ...prev,
      [careTypeId]: defaultDuration
    }));
  };

  const handleResetAllDurations = () => {
    const initial: Record<string, number> = {};
    careTypes.forEach(type => {
      initial[type.id] = type.duration;
    });
    setCustomDurations(initial);
  };

  const hasDurationChanges = () => {
    return careTypes.some(type => customDurations[type.id] !== type.duration);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← {t('settings.back')}
          </Button>
          <h1 className="text-xl text-gray-900">{t('settings.title')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="flex items-center justify-center gap-1 sm:gap-2">
              <RouteIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center justify-center gap-1 sm:gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.availability')}</span>
            </TabsTrigger>
            <TabsTrigger value="unavailability" className="flex items-center justify-center gap-1 sm:gap-2">
              <CalendarX className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.unavailability')}</span>
            </TabsTrigger>
            <TabsTrigger value="care" className="flex items-center justify-center gap-1 sm:gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.care')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center justify-center gap-1 sm:gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.notifications')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet: Profil & Déplacements */}
          <TabsContent value="profile" className="space-y-6">
            {/* Lieu de départ */}
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{t('settings.profile.address.title')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.profile.address.desc')}
                  </p>
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('settings.profile.address.label')}</label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Mode de transport */}
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Car className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{t('settings.profile.transport.title')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.profile.transport.desc')}
                  </p>
                  
                  {/* Transport mode buttons */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <button
                      onClick={() => setTransportMode('car')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        transportMode === 'car'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Car className={`h-6 w-6 mx-auto mb-2 ${transportMode === 'car' ? 'text-blue-600' : 'text-gray-700'}`} />
                      <p className="text-sm text-gray-900">{t('settings.profile.transport.car')}</p>
                    </button>

                    <button
                      onClick={() => setTransportMode('bike')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        transportMode === 'bike'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Bike className={`h-6 w-6 mx-auto mb-2 ${transportMode === 'bike' ? 'text-blue-600' : 'text-gray-700'}`} />
                      <p className="text-sm text-gray-900">{t('settings.profile.transport.bike')}</p>
                    </button>

                    <button
                      onClick={() => setTransportMode('transit')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        transportMode === 'transit'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Bus className={`h-6 w-6 mx-auto mb-2 ${transportMode === 'transit' ? 'text-blue-600' : 'text-gray-700'}`} />
                      <p className="text-sm text-gray-900">{t('settings.profile.transport.transit')}</p>
                    </button>

                    <button
                      onClick={() => setTransportMode('walking')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        transportMode === 'walking'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <UserIcon className={`h-6 w-6 mx-auto mb-2 ${transportMode === 'walking' ? 'text-blue-600' : 'text-gray-700'}`} />
                      <p className="text-sm text-gray-900">{t('settings.profile.transport.walking')}</p>
                    </button>
                  </div>

                  {/* Max distance */}
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      {t('settings.profile.max_distance.label')}
                    </label>
                    <Input
                      type="number"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(e.target.value)}
                      className="bg-gray-50"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet: Disponibilités */}
          <TabsContent value="availability" className="space-y-6">
            {/* Jours de travail */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{t('settings.availability.days.title')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.availability.days.desc')}
                  </p>
                  
                  <div className="space-y-3">
                    {Object.entries(workDays).map(([day, enabled]) => (
                      <div key={day} className="flex items-center justify-between py-2">
                        <span className="text-gray-900 capitalize">{day}</span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => setWorkDays({ ...workDays, [day]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Horaires préférés */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-gray-900 mb-1">{t('settings.availability.preferred.title')}</h2>
                      <p className="text-sm text-gray-600">
                        {t('settings.availability.preferred.desc')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addPreferredHour}>
                      {t('common.edit')}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {preferredHours.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updatePreferredHour(index, 'start', e.target.value)}
                          className="flex-1 bg-white"
                        />
                        <span className="text-gray-600">à</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updatePreferredHour(index, 'end', e.target.value)}
                          className="flex-1 bg-white"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePreferredHour(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Horaires non souhaités */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-gray-900 mb-1">{t('settings.availability.unwanted.title')}</h2>
                      <p className="text-sm text-gray-600">
                        {t('settings.availability.unwanted.desc')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addUnwantedHour}>
                      {t('common.edit')}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {unwantedHours.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateUnwantedHour(index, 'start', e.target.value)}
                          className="flex-1 bg-white"
                        />
                        <span className="text-gray-600">à</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateUnwantedHour(index, 'end', e.target.value)}
                          className="flex-1 bg-white"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUnwantedHour(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Pauses */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Coffee className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{t('settings.availability.break.title')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.availability.break.desc')}
                  </p>

                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                    <p className="text-xs text-amber-900">
                      {t('settings.availability.break.info')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">{t('settings.availability.break.duration')}</label>
                      <select
                        value={pauseDuration}
                        onChange={(e) => setPauseDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="5">5 {t('common.minutes')}</option>
                        <option value="10">10 {t('common.minutes')}</option>
                        <option value="15">15 {t('common.minutes')}</option>
                        <option value="20">20 {t('common.minutes')}</option>
                        <option value="30">30 {t('common.minutes')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-900 mb-2">{t('settings.availability.break.frequency')}</label>
                      <select
                        value={pauseFrequency}
                        onChange={(e) => setPauseFrequency(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="60">1 {t('common.hour') || 'heure'}</option>
                        <option value="90">1h30</option>
                        <option value="120">2 {t('common.hours') || 'heures'}</option>
                        <option value="150">2h30</option>
                        <option value="180">3 {t('common.hours') || 'heures'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-700">
                      {t('settings.availability.break.current')
                        .replace('{duration}', pauseDuration)
                        .replace('{frequency}', (parseInt(pauseFrequency) / 60) + 'h' + (parseInt(pauseFrequency) % 60 !== 0 ? (parseInt(pauseFrequency) % 60).toString().padStart(2, '0') : ''))}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Marge de sécurité */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{t('settings.availability.margin.title')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.availability.margin.desc')}
                  </p>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
                    <p className="text-xs text-green-900">
                      {t('settings.availability.margin.info')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('settings.availability.margin.label')}</label>
                    <select
                      value={safetyMargin}
                      onChange={(e) => setSafetyMargin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="0">{t('settings.availability.margin.none')}</option>
                      <option value="5">5 {t('common.minutes')}</option>
                      <option value="10">10 {t('common.minutes')}</option>
                      <option value="15">15 {t('common.minutes')}</option>
                      <option value="20">20 {t('common.minutes')}</option>
                    </select>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-700">
                      {safetyMargin === '0' ? (
                        <span>{t('settings.availability.margin.not_configured')}</span>
                      ) : (
                        <span>
                          {t('settings.availability.margin.current').replace('{margin}', safetyMargin)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* New Tab: Indisponibilités */}
          <TabsContent value="unavailability" className="space-y-6">
            <Card className="p-6">
              <UnavailabilityManager nurseId={user.id} />
            </Card>
          </TabsContent>

          {/* Onglet: Soins */}
          <TabsContent value="care" className="space-y-6">
            {/* Durées des soins */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-gray-900 mb-1">{t('settings.care.title')}</h2>
                      <p className="text-sm text-gray-600">
                        {t('settings.care.desc')}
                      </p>
                    </div>
                    <Button
                      onClick={handleResetAllDurations}
                      variant="ghost"
                      size="sm"
                      disabled={!hasDurationChanges()}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('settings.care.reset')}
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                    <p className="text-xs text-blue-900">
                      {t('settings.care.info')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {careTypes.map((careType) => {
                      const currentDuration = customDurations[careType.id] || careType.duration;
                      const defaultDuration = careType.duration;
                      const isModified = currentDuration !== defaultDuration;
                      const translatedLabel = t(`care_type.${careType.id.replace(/-/g, '_')}`);

                      return (
                        <div
                          key={careType.id}
                          className={`p-3 rounded-lg border-2 ${
                            isModified
                              ? 'border-purple-300 bg-purple-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{careType.icon}</span>
                                <span className="text-sm text-gray-900">{translatedLabel}</span>
                                {isModified && (
                                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                    {t('settings.modified')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="5"
                                max="180"
                                step="5"
                                value={currentDuration}
                                onChange={(e) => handleDurationChange(careType.id, e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-600">{t('common.minutes')}</span>

                              {isModified && (
                                <Button
                                  onClick={() => handleResetDuration(careType.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet: Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-gray-700 mt-1" />
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-1">{t('settings.notifications.title')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.notifications.desc')}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between py-2">
                      <div>
                        <p className="text-gray-900">{t('settings.notifications.new_appointments')}</p>
                        <p className="text-xs text-gray-600">{t('settings.notifications.new_appointments_desc')}</p>
                      </div>
                      <Switch
                        checked={notifications.newAppointments}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, newAppointments: checked })}
                      />
                    </div>

                    <div className="flex items-start justify-between py-2">
                      <div>
                        <p className="text-gray-900">{t('settings.notifications.cancellations')}</p>
                        <p className="text-xs text-gray-600">{t('settings.notifications.cancellations_desc')}</p>
                      </div>
                      <Switch
                        checked={notifications.cancellations}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, cancellations: checked })}
                      />
                    </div>

                    <div className="flex items-start justify-between py-2">
                      <div>
                        <p className="text-gray-900">{t('settings.notifications.reminders')}</p>
                        <p className="text-xs text-gray-600">{t('settings.notifications.reminders_desc')}</p>
                      </div>
                      <Switch
                        checked={notifications.reminders}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
                      />
                    </div>

                    <div className="flex items-start justify-between py-2">
                      <div>
                        <p className="text-gray-900">{t('settings.notifications.patient_messages')}</p>
                        <p className="text-xs text-gray-600">{t('settings.notifications.patient_messages_desc')}</p>
                      </div>
                      <Switch
                        checked={notifications.patientMessages}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, patientMessages: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action buttons - en dehors des onglets */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={handleCancel}>
            {t('settings.cancel')}
          </Button>
          <Button onClick={handleSave} className="bg-black hover:bg-gray-800">
            {t('settings.save')}
          </Button>
        </div>
      </main>
    </div>
  );
}
