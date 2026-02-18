import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, MessageCircle, Video, Calendar } from 'lucide-react';
import type { User } from '../App';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NurseResultsPageProps {
  user: User;
  searchCriteria: {
    motif: string;
    langue: string;
    disponibilite: string;
    adresse: string;
    isUrgent: boolean;
  };
  onBack: () => void;
  onBookAppointment: (nurse: Nurse) => void;
}

interface Nurse {
  id: string;
  name: string;
  availability: string;
  distance: string;
  languages: string[];
  specialties: string[];
  avatar: string;
}

export function NurseResultsPage({ user, searchCriteria, onBack, onBookAppointment }: NurseResultsPageProps) {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/debug/infirmiers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nurses');
      }

      const data = await response.json();
      console.log('📋 Infirmiers récupérés:', data);

      // Transformer les données de la base en format utilisable
      const transformedNurses: Nurse[] = data.infirmiers.map((infirmier: any) => {
        // Extract nurse name from user data
        let nurseName = 'Infirmier';
        if (infirmier.user) {
          nurseName = `${infirmier.user.first_name} ${infirmier.user.last_name}`;
        }
        console.log('✅ Infirmier trouvé:', nurseName, 'ID:', infirmier.user_id);
        
        return {
          id: infirmier.user_id,
          name: nurseName,
          availability: 'Disponible',
          distance: 'À proximité',
          languages: ['Français'],
          specialties: ['Soins infirmiers'],
          avatar: '👨‍⚕️'
        };
      });

      setNurses(transformedNurses);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infirmiers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveChat = (nurse: Nurse) => {
    console.log('Live chat avec', nurse.name);
    // Logique de chat en direct
  };

  const handleLiveVisio = (nurse: Nurse) => {
    console.log('Live visio avec', nurse.name);
    // Logique de visio en direct
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
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
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="text-gray-900">{user.name}</p>
                </div>
              </div>
            </div>
            
            {searchCriteria.isUrgent && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700">Urgence</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl text-gray-900 border-2 border-gray-900 inline-block px-8 py-3 bg-white">
            Infirmiers disponibles
          </h1>
        </div>

        {/* Search Summary */}
        <Card className="p-4 mb-6 bg-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Motif:</span>
              <p className="text-gray-900">{searchCriteria.motif || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="text-gray-500">Langue:</span>
              <p className="text-gray-900">{searchCriteria.langue || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="text-gray-500">Disponibilité:</span>
              <p className="text-gray-900">{searchCriteria.disponibilite || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="text-gray-500">Distance:</span>
              <p className="text-gray-900">Proximité</p>
            </div>
          </div>
        </Card>

        {/* Nurses List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-4 sm:p-6 text-center">
              <p className="text-gray-500">Chargement des infirmiers...</p>
            </Card>
          ) : (
            nurses.map((nurse) => (
              <Card key={nurse.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl sm:text-4xl">
                      {nurse.avatar}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-1">
                      {nurse.name} <span className="text-gray-500 text-sm sm:text-base">(disponible {nurse.availability})</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
                      <span>📍 {nurse.distance}</span>
                      <span>🗣️ {nurse.languages.join(', ')}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {nurse.specialties.map((specialty, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full sm:w-auto flex-shrink-0 flex flex-col gap-2">
                    <Button
                      onClick={() => onBookAppointment(nurse)}
                      className="bg-black hover:bg-gray-800 text-white gap-2 w-full sm:w-auto"
                    >
                      <Calendar className="h-4 w-4" />
                      Rendez-vous
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleLiveChat(nurse)}
                        variant="outline"
                        className="gap-2 w-full sm:w-auto"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Live chat connect</span>
                        <span className="sm:hidden">Chat</span>
                      </Button>
                      <Button
                        onClick={() => handleLiveVisio(nurse)}
                        variant="outline"
                        className="gap-2 w-full sm:w-auto"
                        size="sm"
                      >
                        <Video className="h-4 w-4" />
                        <span className="hidden sm:inline">Live visio connect</span>
                        <span className="sm:hidden">Visio</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* No results fallback */}
        {nurses.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">Aucun infirmier disponible pour vos critères</p>
            <Button onClick={onBack} variant="outline">
              Modifier la recherche
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}