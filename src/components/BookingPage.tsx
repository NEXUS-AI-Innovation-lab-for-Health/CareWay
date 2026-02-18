import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { ArrowLeft, Sparkles, MapPin, Loader2 } from 'lucide-react';
import type { User } from '../App';
import { InteractiveMap } from './InteractiveMap';
import { useLanguage } from './LanguageContext';

interface BookingPageProps {
  user: User;
  onBack: () => void;
  onSearch: (data: {
    motif: string;
    langue: string;
    disponibilite: string;
    adresse: string;
    isUrgent: boolean;
  }) => void;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const motifs = [
  { value: 'Prise de sang', labelKey: 'care_type.blood_test' },
  { value: 'Gestion des pansements', labelKey: 'care_type.dressing' },
  { value: 'Administration de médicaments', labelKey: 'care_type.medication' },
  { value: "Suivi d'une maladie chronique", labelKey: 'care_type.chronic_followup' }
];

const langues = [
  { value: 'Français', labelKey: 'language.french' },
  { value: 'Anglais', labelKey: 'language.english' },
  { value: 'Espagnol', labelKey: 'language.spanish' },
  { value: 'Arabe', labelKey: 'language.arabic' }
];

const disponibilites = [
  { value: "Aujourd'hui", labelKey: 'availability.today' },
  { value: 'Dans les 3 prochains jours', labelKey: 'availability.next_3_days' },
  { value: 'Dans les 7 prochains jours', labelKey: 'availability.next_7_days' },
  { value: 'Dans les 14 prochains jours', labelKey: 'availability.next_14_days' }
];

export function BookingPage({ user, onBack, onSearch }: BookingPageProps) {
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [motif, setMotif] = useState('');
  const [langue, setLangue] = useState('');
  const [disponibilite, setDisponibilite] = useState('');
  const [adresse, setAdresse] = useState('');
  const [isAtHome, setIsAtHome] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number }>({ 
    lat: 48.8566, 
    lon: 2.3522 
  }); // Paris par défaut
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Recherche d'adresses avec autocomplétion
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(t('booking.address_search_error'));
      }
      
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Gestion du changement d'adresse avec debounce
  const handleAddressChange = (value: string) => {
    setAdresse(value);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  // Sélection d'une suggestion
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setAdresse(suggestion.display_name);
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setMapCoords({ lat, lon });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Gérer la sélection sur la carte
  const handleLocationSelect = async (lat: number, lon: number) => {
    setMapCoords({ lat, lon });
    
    // Géocodage inverse pour obtenir l'adresse
    try {
      // Attendre un peu pour respecter les limites de l'API Nominatim
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.warn('Géocodage inverse échoué, utilisation des coordonnées');
        setAdresse(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
        return;
      }
      
      const data = await response.json();
      if (data.display_name) {
        setAdresse(data.display_name);
      } else {
        setAdresse(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      // Fallback : afficher les coordonnées
      setAdresse(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };

  // Simulation de l'IA pour remplir automatiquement les champs
  const handleAIAnalysis = async () => {
    if (!description) return;

    const descLower = description.toLowerCase();

    // Analyse du motif
    if (descLower.includes('sang') || descLower.includes('prise de sang')) {
      setMotif('Prise de sang');
    } else if (descLower.includes('pansement')) {
      setMotif('Gestion des pansements');
    } else if (descLower.includes('médicament') || descLower.includes('injection') || descLower.includes('insuline')) {
      setMotif('Administration de médicaments');
    } else if (descLower.includes('suivi') || descLower.includes('chronique') || descLower.includes('diabète')) {
      setMotif("Suivi d'une maladie chronique");
    }

    // Analyse de la langue
    if (descLower.includes('anglais') || descLower.includes('english')) {
      setLangue('Anglais');
    } else if (descLower.includes('espagnol') || descLower.includes('spanish')) {
      setLangue('Espagnol');
    } else if (descLower.includes('arabe')) {
      setLangue('Arabe');
    } else {
      setLangue('Français');
    }

    // Analyse de l'urgence et disponibilité
    if (descLower.includes('urgent') || descLower.includes('rapidement') || descLower.includes("aujourd'hui")) {
      setIsUrgent(true);
      setDisponibilite("Aujourd'hui");
    } else if (descLower.includes('3 prochains jours') || descLower.includes('dans les 3 jours') || descLower.includes('3 jours') || descLower.includes('trois jours')) {
      setDisponibilite('Dans les 3 prochains jours');
    } else if (descLower.includes('7 prochains jours') || descLower.includes('dans les 7 jours') || descLower.includes('cette semaine') || descLower.includes('semaine') || descLower.includes('7 jours')) {
      setDisponibilite('Dans les 7 prochains jours');
    } else if (descLower.includes('14 jours') || descLower.includes('2 semaines')) {
      setDisponibilite('Dans les 14 prochains jours');
    }

    // Analyse de l'adresse - détection "à domicile"
    if (descLower.includes('à domicile') || descLower.includes('chez moi') || descLower.includes('à mon domicile') || descLower.includes('à la maison')) {
      setIsAtHome(true);
      if (user.address) {
        setAdresse(user.address);
      }
    } else {
      // Détection de villes françaises majeures
      const cities = [
        'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 
        'strasbourg', 'montpellier', 'bordeaux', 'lille', 'rennes',
        'reims', 'le havre', 'saint-étienne', 'toulon', 'grenoble',
        'dijon', 'angers', 'nîmes', 'villeurbanne', 'le mans',
        'aix-en-provence', 'clermont-ferrand', 'brest', 'tours',
        'amiens', 'limoges', 'annecy', 'perpignan', 'boulogne-billancourt'
      ];

      let detectedCity = null;
      for (const city of cities) {
        if (descLower.includes(`à ${city}`) || descLower.includes(`a ${city}`) || descLower.includes(city)) {
          detectedCity = city;
          break;
        }
      }

      if (detectedCity) {
        setIsAtHome(false);
        // Rechercher l'adresse de la ville détectée
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(detectedCity)}&countrycodes=fr&limit=1`,
            {
              headers: {
                'Accept': 'application/json',
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              setAdresse(data[0].display_name);
              setMapCoords({
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
              });
            }
          }
        } catch (error) {
          console.error('Erreur lors de la recherche de ville:', error);
        }
      }
    }
  };

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleSearch = () => {
    // Validation basique
    if (!motif || !langue || !disponibilite) {
      alert(t('common.fill_all_fields'));
      return;
    }
    
    // Vérifier l'adresse seulement si "À mon domicile" n'est pas coché ou si l'adresse est vide
    if (!adresse) {
      alert(t('common.fill_all_fields'));
      return;
    }

    onSearch({
      motif,
      langue,
      disponibilite,
      adresse,
      isUrgent
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-gray-600">{t('booking.new_appointment')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          {/* Patient Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-600"
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
                <p className="text-sm text-gray-500">{t('dashboard.patient')}</p>
                <p className="text-gray-900">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="urgence"
                checked={isUrgent}
                onCheckedChange={(checked) => setIsUrgent(checked as boolean)}
              />
              <label htmlFor="urgence" className="text-sm text-gray-700 cursor-pointer">
                {t('dashboard.urgent')}
              </label>
            </div>
          </div>

          {/* AI Description */}
          <div className="mb-8">
            <label className="block text-sm text-gray-700 mb-2">
              {t('booking.description_label')}
            </label>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('booking.description_placeholder')}
                className="min-h-[100px] pr-12"
              />
              <button
                type="button"
                onClick={handleAIAnalysis}
                className="absolute top-3 right-3 p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                title="Analyser avec l'IA"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {t('booking.ai_help')}
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {/* Motif */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gray-400" />
                  {t('booking.motif')}
                </span>
              </label>
              <Select value={motif} onValueChange={setMotif}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.select_motif')} />
                </SelectTrigger>
                <SelectContent>
                  {motifs.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {t(m.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!motif && (
                <p className="text-xs text-red-400 mt-1 italic">
                  {t('booking.select_motif')}
                </p>
              )}
            </div>

            {/* Langues */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gray-400" />
                  {t('booking.languages')}
                </span>
              </label>
              <Select value={langue} onValueChange={setLangue}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.select_language')} />
                </SelectTrigger>
                <SelectContent>
                  {langues.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {t(l.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!langue && (
                <p className="text-xs text-red-400 mt-1 italic">
                  {t('booking.select_language')}
                </p>
              )}
            </div>

            {/* Disponibilité */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gray-400" />
                  {t('booking.availability')}
                </span>
              </label>
              <Select value={disponibilite} onValueChange={setDisponibilite}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.select_availability')} />
                </SelectTrigger>
                <SelectContent>
                  {disponibilites.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {t(d.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!disponibilite && (
                <p className="text-xs text-red-400 mt-1 italic">
                  {t('booking.select_availability')}
                </p>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div className="mb-8">
            <label className="block text-sm text-gray-700 mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-gray-400" />
                {t('booking.address')}
              </span>
            </label>
            
            {/* Checkbox À domicile */}
            <div className="mb-4 flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Checkbox
                id="atHome"
                checked={isAtHome}
                onCheckedChange={(checked) => {
                  const isChecked = checked as boolean;
                  setIsAtHome(isChecked);
                  if (isChecked) {
                    // Vérifier si l'utilisateur a une adresse dans son profil
                    if (user.address) {
                      setAdresse(user.address);
                    } else {
                      // Si pas d'adresse, afficher un message et décocher
                      alert(t('booking.fill_profile_address'));
                      setIsAtHome(false);
                    }
                  } else {
                    setAdresse('');
                  }
                }}
              />
              <label htmlFor="atHome" className="text-sm text-gray-700 cursor-pointer flex-1">
                <strong>{t('booking.at_home')}</strong>
                {user.address && isAtHome && (
                  <span className="block text-xs text-gray-600 mt-1">{user.address}</span>
                )}
                {!user.address && (
                  <span className="block text-xs text-orange-600 mt-1">{t('booking.no_home_address')}</span>
                )}
              </label>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <div className="relative">
                  <Input
                    type="text"
                    value={adresse}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={t('booking.enter_address')}
                    disabled={isAtHome}
                  />
                  {isLoadingSuggestions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{suggestion.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {!adresse && !isAtHome && (
                  <p className="text-xs text-red-400 mt-1 italic">
                    {t('booking.enter_address')}
                  </p>
                )}
              </div>
              
              {/* Carte interactive */}
              <div className="h-[200px] rounded-lg overflow-hidden border border-gray-200">
                <InteractiveMap 
                  center={mapCoords} 
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSearch}
              size="lg"
              className="bg-black hover:bg-gray-800 text-white px-16"
            >
              {t('common.search')}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}