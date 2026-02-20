import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sparkles, MapPin, Clock, TrendingDown, Route, AlertCircle, CheckCircle2, Navigation, Sunrise, Sun, Moon, Timer, Coffee, Shield, Calendar, Zap, Brain } from 'lucide-react';
import { getDefaultDuration, careTypes } from '../constants/careTypes';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from './LanguageContext';

interface Appointment {
  id: string;
  date: string;
  time: string;  // Horaire assigné (peut être modifié par l'IA)
  timeSlot?: 'morning' | 'afternoon' | 'evening';  // Créneau demandé
  timeSlotLabel?: string;  // Label du créneau
  patientName: string;
  location: string;
  type: string;
  status: string;
  isUrgent: boolean;
  duration?: number;
  isPause?: boolean;  // Indique si c'est une pause automatique
}

interface OptimizedRoute {
  appointments: (Appointment | { isPause: true; time: string; duration: number; id: string })[];
  totalDistance: number;
  totalTime: number;
  savings: {
    distance: number;
    time: number;
  };
  aiExplanation?: string; // Explication de l'IA
  aiProvider?: string; // 'groq' ou 'algorithm'
}

interface AIRouteOptimizerProps {
  appointments: Appointment[];
  selectedDate: string;
  onApplyRoute: (optimizedAppointments: Appointment[]) => void;
  nurseId?: string; // ID de l'infirmière pour récupérer les settings
}

// Plages horaires pour chaque créneau
const timeSlotRanges: Record<string, { start: number; end: number; increment: number }> = {
  morning: { start: 8, end: 12, increment: 20 },      // 8h à 12h, créneaux de 20min
  afternoon: { start: 14, end: 18, increment: 20 },   // 14h à 18h, créneaux de 20min
  evening: { start: 18, end: 20, increment: 20 }      // 18h à 20h, créneaux de 20min
};

export function AIRouteOptimizer({ appointments, selectedDate, onApplyRoute, nurseId }: AIRouteOptimizerProps) {
  const { t } = useLanguage();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [currentSelectedDate, setCurrentSelectedDate] = useState(selectedDate);

  // Charge le mode de transport sauvegardé par l'infirmière dans localStorage.
  // Retourne 'car' par défaut si aucun mode n'est trouvé ou si la valeur est invalide.
  const getTransportMode = (): 'car' | 'bike' | 'transit' | 'walking' => {
    try {
      const saved = localStorage.getItem('nurseTransportMode');
      if (saved && ['car', 'bike', 'transit', 'walking'].includes(saved)) {
        return saved as 'car' | 'bike' | 'transit' | 'walking';
      }
    } catch (e) {
      console.error('Error loading transport mode:', e);
    }
    return 'car'; // Par défaut
  };

  // Calcule le temps de trajet estimé en minutes à partir d'une distance en km.
  // Utilise des vitesses moyennes en ville selon le mode de transport (voiture, vélo, transport, marche).
  const getTravelTime = (distanceKm: number, mode?: 'car' | 'bike' | 'transit' | 'walking'): number => {
    const transportMode = mode || getTransportMode();
    
    // Vitesses moyennes en ville (km/h) → temps en min/km
    const speeds: Record<string, number> = {
      car: 1.2,      // ~50 km/h → 1.2 min/km
      bike: 4,       // ~15 km/h → 4 min/km
      transit: 3,    // ~20 km/h → 3 min/km
      walking: 12    // ~5 km/h → 12 min/km
    };
    
    return Math.round(distanceKm * speeds[transportMode]);
  };

  // Retourne l'icône (emoji) et le label traduit correspondant au mode de transport actuel.
  // Utilisé dans l'interface pour afficher visuellement le mode sélectionné.
  const getTransportInfo = () => {
    const mode = getTransportMode();
    const icons = {
      car: { icon: '🚗', label: t('ai.transport_car') },
      bike: { icon: '🚴', label: t('ai.transport_bike') },
      transit: { icon: '🚌', label: t('ai.transport_transit') },
      walking: { icon: '🚶', label: t('ai.transport_walking') }
    };
    return icons[mode];
  };

  // Récupère la durée personnalisée d'un type de soin depuis localStorage.
  // Si l'infirmière a défini une durée spécifique dans ses paramètres, elle est utilisée.
  // Sinon, retourne la durée par défaut définie dans les constantes de l'application.
  const getCustomDuration = (careType: string): number => {
    try {
      const saved = localStorage.getItem('nurseCustomDurations');
      if (saved) {
        const customDurations = JSON.parse(saved);
        if (customDurations[careType]) {
          return customDurations[careType];
        }
      }
    } catch (e) {
      console.error('Error loading custom durations:', e);
    }
    // Fallback sur la durée par défaut
    return getDefaultDuration(careType);
  };

  // Récupère la marge de sécurité (en minutes) ajoutée entre chaque rendez-vous.
  // Cette marge permet d'absorber les retards éventuels. Valeur par défaut : 10 minutes.
  const getSafetyMargin = (): number => {
    try {
      const saved = localStorage.getItem('nurseSafetyMargin');
      return saved ? parseInt(saved) : 10;
    } catch (e) {
      console.error('Error loading safety margin:', e);
      return 10;
    }
  };

  // Récupère les paramètres de pause automatique depuis localStorage.
  // - duration : durée de chaque pause en minutes (défaut : 15 min)
  // - frequency : intervalle de travail avant qu'une pause soit insérée (défaut : 120 min)
  const getPauseSettings = (): { duration: number; frequency: number } => {
    try {
      const duration = localStorage.getItem('nursePauseDuration');
      const frequency = localStorage.getItem('nursePauseFrequency');
      return {
        duration: duration ? parseInt(duration) : 15,
        frequency: frequency ? parseInt(frequency) : 120
      };
    } catch (e) {
      console.error('Error loading pause settings:', e);
      return { duration: 15, frequency: 120 };
    }
  };

  // Filtrer les rendez-vous pour la date sélectionnée
  const todayAppointments = appointments.filter(apt => apt.date === currentSelectedDate && apt.status === 'confirmed');

  // Génère des coordonnées GPS approximatives à partir d'une adresse (simulation).
  // Utilise un hash simple de la chaîne d'adresse pour produire des coordonnées
  // autour de Lyon (lat ~45.75, lng ~4.85). En production, ceci serait remplacé par un géocodeur réel.
  const getCoordinates = (location: string): { lat: number; lng: number } => {
    // Simulation de géolocalisation basée sur le hash de l'adresse
    const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      lat: 45.75 + (hash % 100) / 1000,
      lng: 4.85 + (hash % 150) / 1000
    };
  };

  // Calcule la distance en kilomètres entre deux points GPS en utilisant la formule de Haversine.
  // Cette formule tient compte de la courbure de la Terre pour un calcul précis à vol d'oiseau.
  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Convertit un nombre total de minutes depuis minuit en format horaire "HH:MM".
  // Exemple : 510 → "08:30", 840 → "14:00".
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Algorithme principal d'optimisation de tournée (V1 — sans IA).
  // 1. Sépare les RDV par créneau horaire (matin, après-midi, soir) et par urgence
  // 2. Optimise l'ordre géographique dans chaque créneau (algorithme du plus proche voisin)
  // 3. Assigne des horaires précis en tenant compte des durées de soin, temps de trajet,
  //    marges de sécurité et pauses automatiques
  // 4. Compare avec l'ordre naïf (non optimisé) pour calculer les gains de distance et temps
  // Retourne un objet OptimizedRoute avec les RDV réordonnés et les métriques.
  const optimizeRoute = (): OptimizedRoute => {
    if (todayAppointments.length === 0) {
      return {
        appointments: [],
        totalDistance: 0,
        totalTime: 0,
        savings: { distance: 0, time: 0 }
      };
    }

    // Séparer par créneaux et urgences
    const urgentAppointments = todayAppointments.filter(apt => apt.isUrgent);
    const normalAppointments = todayAppointments.filter(apt => !apt.isUrgent);

    // Grouper par timeSlot
    const groupByTimeSlot = (apps: Appointment[]) => {
      const groups: Record<string, Appointment[]> = {
        morning: [],
        afternoon: [],
        evening: []
      };
      apps.forEach(apt => {
        if (apt.timeSlot && groups[apt.timeSlot]) {
          groups[apt.timeSlot].push(apt);
        }
      });
      return groups;
    };

    // Optimise l'ordre des rendez-vous d'un groupe par proximité géographique.
    // Utilise l'algorithme glouton du "plus proche voisin" : part du premier RDV (ou d'une urgence),
    // puis choisit toujours le RDV le plus proche géographiquement comme suivant.
    // Les RDV urgents ont une priorité et peuvent être choisis même s'ils sont légèrement plus loin.
    const optimizeGroupByProximity = (group: Appointment[]): Appointment[] => {
      if (group.length <= 1) return group;
      
      const optimized: Appointment[] = [];
      const remaining = [...group];
      
      // Commencer par le premier RDV (ou une urgence si disponible)
      const startIndex = remaining.findIndex(apt => apt.isUrgent);
      if (startIndex !== -1) {
        optimized.push(remaining.splice(startIndex, 1)[0]);
      } else {
        optimized.push(remaining.shift()!);
      }
      
      // Algorithme du plus proche voisin
      while (remaining.length > 0) {
        const current = optimized[optimized.length - 1];
        const currentCoords = getCoordinates(current.location);
        
        let nearestIndex = 0;
        let minDistance = Infinity;
        
        remaining.forEach((apt, index) => {
          const aptCoords = getCoordinates(apt.location);
          const distance = calculateDistance(currentCoords, aptCoords);
          
          // Priorité aux urgences même si un peu plus loin
          if (apt.isUrgent && !current.isUrgent) {
            if (distance < minDistance * 1.5) {
              minDistance = distance;
              nearestIndex = index;
            }
          } else if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
          }
        });
        
        optimized.push(remaining.splice(nearestIndex, 1)[0]);
      }
      
      return optimized;
    };

    // Assigne des horaires précis à chaque RDV dans un créneau donné (matin/après-midi/soir).
    // Optimise d'abord l'ordre par proximité, puis parcourt séquentiellement en calculant :
    // - La durée de chaque visite (personnalisée par type de soin)
    // - Le temps de trajet entre deux adresses consécutives
    // - L'insertion automatique de pauses quand le temps de travail accumulé dépasse la fréquence configurée
    // - La marge de sécurité ajoutée après chaque visite
    const assignTimesToSlot = (group: Appointment[], slotKey: string): Appointment[] => {
      const range = timeSlotRanges[slotKey];
      if (!range) return group;
      
      const optimizedGroup = optimizeGroupByProximity(group);
      const safetyMargin = getSafetyMargin(); // Récupérer la marge de sécurité
      const pauseSettings = getPauseSettings(); // Récupérer les paramètres de pause
      
      let currentTime = range.start * 60; // Convertir en minutes
      const endTime = range.end * 60;
      let accumulatedWorkTime = 0; // Temps de travail accumulé pour gérer les pauses
      
      const result: Appointment[] = [];
      
      for (let index = 0; index < optimizedGroup.length; index++) {
        const apt = optimizedGroup[index];
        
        // Durée de la visite basée sur le type de soin
        const visitDuration = getCustomDuration(apt.type);
        
        // Temps de trajet vers ce point (si pas le premier)
        let travelTime = 0;
        if (index > 0) {
          const prevCoords = getCoordinates(optimizedGroup[index - 1].location);
          const currentCoords = getCoordinates(apt.location);
          const distance = calculateDistance(prevCoords, currentCoords);
          travelTime = getTravelTime(distance); // Temps de trajet en fonction du mode de transport
        }
        
        // Ajouter le temps de trajet
        currentTime += travelTime;
        
        // Vérifier si une pause est nécessaire
        if (accumulatedWorkTime > 0 && accumulatedWorkTime >= pauseSettings.frequency) {
          // Insérer une pause
          currentTime += pauseSettings.duration;
          accumulatedWorkTime = 0; // Réinitialiser le compteur de temps de travail
          
          console.log(`☕ Pause de ${pauseSettings.duration}min insérée à ${minutesToTime(currentTime - pauseSettings.duration)}`);
        }
        
        // Assigner l'horaire
        const assignedTime = Math.min(currentTime, endTime - visitDuration);
        
        result.push({
          ...apt,
          time: minutesToTime(assignedTime),
          duration: visitDuration
        });
        
        // Calculer le prochain créneau disponible
        currentTime = assignedTime + visitDuration + safetyMargin; // Ajouter la marge de sécurité
        accumulatedWorkTime += visitDuration + safetyMargin; // Accumuler le temps de travail
      }
      
      return result;
    };

    // Grouper tous les RDV par créneau
    const allGroups = groupByTimeSlot([...urgentAppointments, ...normalAppointments]);
    
    // Optimiser chaque créneau
    const morningOptimized = assignTimesToSlot(allGroups.morning, 'morning');
    const afternoonOptimized = assignTimesToSlot(allGroups.afternoon, 'afternoon');
    const eveningOptimized = assignTimesToSlot(allGroups.evening, 'evening');
    
    // Combiner tous les créneaux
    const finalRoute = [...morningOptimized, ...afternoonOptimized, ...eveningOptimized];

    // Calculer la distance totale optimisée
    let optimizedDistance = 0;
    for (let i = 0; i < finalRoute.length - 1; i++) {
      const coord1 = getCoordinates(finalRoute[i].location);
      const coord2 = getCoordinates(finalRoute[i + 1].location);
      optimizedDistance += calculateDistance(coord1, coord2);
    }

    // Calculer une route "naïve" (ordre original/chronologique des demandes)
    // Dans la vraie vie, sans optimisation, l'infirmier suivrait l'ordre de réception des demandes
    const naiveRoute = [...todayAppointments]; // Garder l'ordre original
    let naiveDistance = 0;
    let naiveTotalTime = 0;
    
    for (let i = 0; i < naiveRoute.length; i++) {
      // Temps de la visite
      const visitDuration = getCustomDuration(naiveRoute[i].type);
      naiveTotalTime += visitDuration;
      
      // Temps de trajet vers la prochaine adresse
      if (i < naiveRoute.length - 1) {
        const coord1 = getCoordinates(naiveRoute[i].location);
        const coord2 = getCoordinates(naiveRoute[i + 1].location);
        const distance = calculateDistance(coord1, coord2);
        naiveDistance += distance;
        naiveTotalTime += getTravelTime(distance);
      }
    }

    // Calculer la distance et le temps optimisés
    let optimizedTotalTime = 0;
    for (let i = 0; i < finalRoute.length; i++) {
      // Temps de la visite
      const visitDuration = getCustomDuration(finalRoute[i].type);
      optimizedTotalTime += visitDuration;
      
      // Temps de trajet vers la prochaine adresse
      if (i < finalRoute.length - 1) {
        const coord1 = getCoordinates(finalRoute[i].location);
        const coord2 = getCoordinates(finalRoute[i + 1].location);
        optimizedTotalTime += getTravelTime(calculateDistance(coord1, coord2));
      }
    }

    const distanceSavings = naiveDistance - optimizedDistance;
    const timeSavings = naiveTotalTime - optimizedTotalTime;

    return {
      appointments: finalRoute,
      totalDistance: optimizedDistance,
      totalTime: optimizedTotalTime,
      savings: {
        distance: Math.max(0, distanceSavings),
        time: Math.max(0, timeSavings)
      }
    };
  };

  // Lance l'optimisation algorithmique (V1) avec un délai simulé de 2 secondes
  // pour donner un feedback visuel d'un traitement en cours.
  // Appelle optimizeRoute() qui utilise l'algorithme du plus proche voisin.
  const handleOptimize = () => {
    setIsOptimizing(true);
    
    // Simuler un délai de traitement IA
    setTimeout(() => {
      const result = optimizeRoute();
      setOptimizedRoute(result);
      setIsOptimizing(false);
      setShowComparison(true);
    }, 2000);
  };

  // Lance l'optimisation avancée via IA (V2) en appelant l'API Groq/Mixtral.
  // Récupère d'abord les paramètres de l'infirmière depuis Supabase, puis envoie
  // les rendez-vous du jour à l'endpoint d'optimisation IA qui retourne un ordre optimisé
  // avec des horaires suggérés et une explication textuelle de la logique utilisée.
  // En cas d'erreur, affiche une alerte et ne modifie pas l'état.
  const handleOptimizeWithAI = async () => {
    setIsOptimizing(true);
    
    try {
      // Récupérer les settings de l'infirmière
      let nurseSettings = null;
      if (nurseId) {
        const settingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/infirmier/${nurseId}/settings`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          nurseSettings = data.settings;
        }
      }
      
      // Préparer les données pour l'IA
      const appointmentsForAI = todayAppointments.map(apt => ({
        id: apt.id,
        patientName: apt.patientName,
        location: apt.location,
        type: apt.type,
        duration: apt.duration || getCustomDuration(apt.type),
        isUrgent: apt.isUrgent,
        timeSlot: apt.timeSlot || 'morning'
      }));
      
      console.log('🤖 Calling AI optimization...', appointmentsForAI);
      
      // Appeler l'API d'optimisation IA
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/ai/optimize-route`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointments: appointmentsForAI,
            nurseSettings: nurseSettings || {
              transport: getTransportMode(),
              max_distance_km: 20
            },
            date: currentSelectedDate
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ AI optimization error:', errorData);
        alert(`Erreur d'optimisation IA: ${errorData.error || 'Erreur inconnue'}`);
        setIsOptimizing(false);
        return;
      }
      
      const data = await response.json();
      console.log('✅ AI optimization result:', data);
      
      // Mapper les résultats de l'IA vers notre format
      const aiOptimizedAppointments = data.optimizedRoute.optimizedAppointments.map((aiApt: any) => {
        const originalApt = todayAppointments.find(a => a.id === aiApt.id);
        return {
          ...originalApt,
          time: aiApt.suggestedTime,
          duration: originalApt?.duration || getCustomDuration(originalApt?.type || ''),
        };
      });
      
      // Calculer les métriques
      const result: OptimizedRoute = {
        appointments: aiOptimizedAppointments,
        totalDistance: data.optimizedRoute.summary.totalDistance,
        totalTime: data.optimizedRoute.summary.totalTime,
        savings: {
          distance: 0, // L'IA ne calcule pas les savings
          time: 0
        },
        aiExplanation: data.optimizedRoute.summary.explanation,
        aiProvider: 'groq'
      };
      
      setOptimizedRoute(result);
      setIsOptimizing(false);
      setShowComparison(true);
      
    } catch (error) {
      console.error('❌ AI optimization failed:', error);
      alert('Erreur lors de l\'optimisation IA. Veuillez réessayer.');
      setIsOptimizing(false);
    }
  };

  // Applique l'itinéraire optimisé en remontant les rendez-vous réordonnés au composant parent
  // via le callback onApplyRoute, puis masque la vue de comparaison.
  const handleApplyRoute = () => {
    if (optimizedRoute) {
      onApplyRoute(optimizedRoute.appointments);
      setShowComparison(false);
    }
  };

  // Retourne l'icône Lucide correspondant au créneau horaire (matin → soleil levant,
  // après-midi → soleil, soir → lune). Utilisé dans l'affichage de chaque RDV.
  const getTimeSlotIcon = (timeSlot?: string) => {
    switch (timeSlot) {
      case 'morning':
        return <Sunrise className="h-3 w-3 text-orange-500" />;
      case 'afternoon':
        return <Sun className="h-3 w-3 text-yellow-500" />;
      case 'evening':
        return <Moon className="h-3 w-3 text-indigo-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  // Récupère l'icône (emoji) et le label d'un type de soin à partir de la liste
  // des types définis dans les constantes. Retourne un fallback générique si le type est inconnu.
  const getCareTypeInfo = (careType: string) => {
    const care = careTypes.find(c => c.id === careType);
    return care ? { icon: care.icon, label: care.label } : { icon: '🩺', label: careType };
  };

  // Formate une date ISO (ex: "2026-02-20") en texte lisible en français
  // (ex: "vendredi 20 février 2026") pour l'affichage dans l'interface.
  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  if (todayAppointments.length === 0) {
    return (
      <div className="space-y-4">
        {/* Sélecteur de date */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              {t('ai.no_appointments_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="date-selector" className="text-sm text-gray-700">
                  {t('ai.select_date_instruction')}
                </Label>
                <Input
                  id="date-selector"
                  type="date"
                  value={currentSelectedDate}
                  onChange={(e) => setCurrentSelectedDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">
                  <strong>{t('ai.selected_date')}</strong> {formatSelectedDate(currentSelectedDate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message aucun rendez-vous */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <p className="text-gray-600">{t('ai.no_appointments_content')}</p>
            <p className="text-sm text-gray-500 mt-2">
              {t('ai.no_appointments_subcontent')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête Agent IA */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {t('ai.agent_title')}
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {t('ai.beta')}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {t('ai.description')}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isOptimizing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('ai.v1')}</span>
                  </>
                )}
              </Button>
              <Button
                onClick={handleOptimizeWithAI}
                disabled={isOptimizing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isOptimizing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Brain className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('ai.v2')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!showComparison && (
          <CardContent>
            {/* Sélecteur de date */}
            <div className="mb-4 p-3 bg-white border border-purple-200 rounded-lg">
              <Label htmlFor="date-selector-active" className="text-xs text-gray-700 mb-2 block">
                📅 {t('ai.date_selector_label')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="date-selector-active"
                  type="date"
                  value={currentSelectedDate}
                  onChange={(e) => {
                    setCurrentSelectedDate(e.target.value);
                    setOptimizedRoute(null);
                    setShowComparison(false);
                  }}
                  className="flex-1"
                />
                <div className="text-xs text-gray-600 hidden sm:block">
                  {formatSelectedDate(currentSelectedDate)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl text-purple-600 mb-1">{todayAppointments.length}</div>
                <div className="text-xs text-gray-600">{t('ai.appointments')}</div>
              </div>
              <div>
                <div className="text-2xl text-purple-600 mb-1">
                  {todayAppointments.filter(a => a.isUrgent).length}
                </div>
                <div className="text-xs text-gray-600">{t('ai.urgent')}</div>
              </div>
              <div>
                <div className="text-2xl text-purple-600 mb-1">
                  {todayAppointments.filter(a => !a.time).length}
                </div>
                <div className="text-xs text-gray-600">{t('ai.to_schedule')}</div>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-700 mb-1">
                <strong>🤖 {t('ai.how_it_works_title')}</strong>
              </p>
              <p className="text-xs text-gray-600">
                {t('ai.how_it_works_desc')}
              </p>
            </div>

            {/* Paramètres d'optimisation */}
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-gray-700 mb-2">
                <strong>⚙️ {t('ai.settings_title')}</strong>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded text-xs">
                  <span className="text-base">{getTransportInfo().icon}</span>
                  <span className="text-gray-600">{getTransportInfo().label}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded text-xs">
                  <Coffee className="h-3 w-3 text-amber-600" />
                  <span className="text-gray-600">
                    {t('ai.pause')} {getPauseSettings().duration}{t('common.minutes')} / {getPauseSettings().frequency}{t('common.minutes')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded text-xs">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span className="text-gray-600">
                    {t('ai.margin')} +{getSafetyMargin()}{t('common.minutes')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded text-xs">
                  <Timer className="h-3 w-3 text-purple-600" />
                  <span className="text-gray-600">{t('ai.custom_durations')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Résultats d'optimisation */}
      {showComparison && optimizedRoute && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {t('ai.optimization_complete')}
            </CardTitle>
            <CardDescription>
              {t('ai.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métriques d'économie - CACHÉES (décommenter pour réactiver) */}
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Distance économisée</span>
                </div>
                <div className="text-2xl text-green-700">
                  {optimizedRoute.savings.distance.toFixed(1)} km
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total : {optimizedRoute.totalDistance.toFixed(1)} km
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Temps économisé</span>
                </div>
                <div className="text-2xl text-blue-700">
                  {Math.round(optimizedRoute.savings.time)} min
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total : {Math.round(optimizedRoute.totalTime)} min
                </div>
              </div>
            </div> */}

            {/* Itinéraire optimisé */}
            <div>
              <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Route className="h-4 w-4" />
                {t('ai.optimized_route')}
              </h4>
              
              {/* Info mode de transport */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-lg">{getTransportInfo().icon}</span>
                <span className="text-xs text-blue-900">
                  <strong>{t('ai.transport_mode')}</strong> {getTransportInfo().label}
                </span>
              </div>

              <div className="space-y-2">
                {optimizedRoute.appointments.map((apt, index) => {
                  const nextApt = optimizedRoute.appointments[index + 1];
                  const distance = nextApt 
                    ? calculateDistance(getCoordinates(apt.location), getCoordinates(nextApt.location))
                    : 0;
                  const travelTime = nextApt ? getTravelTime(distance) : 0;
                  
                  return (
                    <div key={apt.id}>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900 truncate">{apt.patientName}</span>
                            {apt.isUrgent && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shrink-0">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {t('ai.urgent_label')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <span className="text-base">{getCareTypeInfo(apt.type).icon}</span>
                            <span className="text-gray-900">{getCareTypeInfo(apt.type).label}</span>
                            <span>•</span>
                            <Timer className="h-3 w-3 text-purple-600" />
                            <span className="text-purple-700">{apt.duration || getCustomDuration(apt.type)} {t('common.minutes')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1">
                              {getTimeSlotIcon(apt.timeSlot)}
                              <span className="text-gray-500">{apt.timeSlotLabel}</span>
                            </div>
                            <span>→</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-600" />
                              <span className="text-green-700">{apt.time}</span>
                            </div>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{apt.location.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Flèche de trajet vers le prochain rendez-vous */}
                      {nextApt && (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs">
                            <span className="text-base">{getTransportInfo().icon}</span>
                            <Navigation className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700">{distance.toFixed(1)} {t('common.km')}</span>
                            <span className="text-blue-500">•</span>
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700">{travelTime} {t('common.minutes')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowComparison(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApplyRoute}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('ai.apply_route')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}