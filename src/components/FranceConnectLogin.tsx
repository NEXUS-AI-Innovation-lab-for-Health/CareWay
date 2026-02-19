import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react';
import type { User } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface FranceConnectLoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

interface IdentityProvider {
  id: string;
  name: string;
  logo: string;
  color: string;
}

const identityProviders: IdentityProvider[] = [
  {
    id: 'impots',
    name: 'impots.gouv.fr',
    logo: '🏛️',
    color: 'bg-blue-600'
  },
  {
    id: 'ameli',
    name: 'Ameli',
    logo: '🏥',
    color: 'bg-green-600'
  },
  {
    id: 'laposte',
    name: 'La Poste',
    logo: '📮',
    color: 'bg-yellow-600'
  },
  {
    id: 'msa',
    name: 'MSA',
    logo: '🌾',
    color: 'bg-emerald-600'
  },
  {
    id: 'mobile',
    name: 'Mobile Connect et moi',
    logo: '📱',
    color: 'bg-orange-600'
  },
  {
    id: 'yris',
    name: 'Yris',
    logo: '🔐',
    color: 'bg-purple-600'
  }
];

export function FranceConnectLogin({ onLogin, onBack }: FranceConnectLoginProps) {
  const { t } = useLanguage();
  const [showProviders, setShowProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [devMode] = useState(true);

  // Dev mode: Direct login bypass
  const handleDevLogin = async () => {
    try {
      const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/api/nurse/franceconnect`;
      const mockData = { firstName: 'Marie', lastName: 'Dubois', email: 'marie.dubois@infirmier.fr', franceConnectId: `fc_dev_${Date.now()}` };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify(mockData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const payload = data.nurse;
        const loginUser: User = {
          id: payload.id,
          name: `${payload.firstName} ${payload.lastName}`,
          email: payload.email,
          type: 'nurse'
        };
        onLogin(loginUser);
      } else {
        alert(`Erreur: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      alert(`Erreur de connexion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFranceConnectClick = () => {
    setShowProviders(true);
  };

  const handleProviderSelect = async (providerId: string) => {
    setSelectedProvider(providerId);
    
    // Simuler une authentification FranceConnect
    setTimeout(async () => {
      // Données simulées de FranceConnect
      const mockFranceConnectData = {
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@infirmier.fr',
        franceConnectId: `fc_${providerId}_${Date.now()}`
      };

      const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/api/nurse/franceconnect`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify(mockFranceConnectData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Connexion réussie
          const payload = data.nurse;
          const loginUser: User = {
            id: payload.id,
            name: `${payload.firstName} ${payload.lastName}`,
            email: payload.email,
            type: 'nurse'
          };
          onLogin(loginUser);
        } else {
          const errorMsg = data.error || 'Erreur inconnue lors de l\'authentification';
          console.error('FranceConnect authentication error:', errorMsg, 'Full response:', data);
          alert(`Erreur lors de l'authentification FranceConnect: ${errorMsg}`);
          setSelectedProvider(null);
          setShowProviders(false);
        }
      } catch (error) {
        console.error('FranceConnect network error:', error);
        alert('Erreur de connexion au serveur. Veuillez réessayer.');
        setSelectedProvider(null);
        setShowProviders(false);
      }
    }, 1500);
  };

  const handleBack = () => {
    if (showProviders) {
      setShowProviders(false);
      setSelectedProvider(null);
    } else {
      onBack();
    }
  };

  if (showProviders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl">
            <CardHeader className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">FranceConnect</span>
                    </div>
                    <p className="text-xs text-gray-500">S'identifier avec FranceConnect</p>
                  </div>
                </div>
              </div>
              
              <div>
                <CardTitle className="text-xl">{t('auth.franceconnect.choose_account')}</CardTitle>
                <CardDescription className="mt-2">
                  {t('auth.franceconnect.choose_service')}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {identityProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  disabled={selectedProvider !== null}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${provider.color} rounded flex items-center justify-center text-2xl`}>
                      {provider.logo}
                    </div>
                    <span className="text-gray-900 group-hover:text-blue-700">
                      {provider.name}
                    </span>
                  </div>
                  {selectedProvider === provider.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-blue-600">{t('common.loading')}</span>
                    </div>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  )}
                </button>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    {t('auth.franceconnect.what_is')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('auth.franceconnect.privacy')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex items-center gap-1">
                  <span className="text-2xl">DW</span>
                  <span className="text-2xl">™</span>
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl">{t('dashboard.nurse_space')}</CardTitle>
                <CardDescription className="mt-2">
                  {t('auth.franceconnect.desc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* MODE DÉVELOPPEMENT - Connexion directe */}
              {devMode && (
                <Button
                  onClick={handleDevLogin}
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex items-center justify-center gap-3 shadow-lg"
                >
                  <Shield className="h-5 w-5" />
                  <span>🔧 MODE DEV - Connexion Directe</span>
                </Button>
              )}

              <Button
                onClick={handleFranceConnectClick}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-3"
              >
                <Shield className="h-5 w-5" />
                <span>{t('auth.franceconnect.title')}</span>
              </Button>
              
              {devMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>⚠️ Mode développement actif</strong><br/>
                    Utilisez le bouton de connexion directe pour tester l'espace professionnel santé sans passer par FranceConnect.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900">
                      {t('home.security.title')}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {t('home.security.desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                <strong>{t('auth.franceconnect.mandatory').split(':')[0]}:</strong> {t('auth.franceconnect.mandatory').split(':')[1]}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('home.footer.terms')}
          </p>
        </div>
      </div>
    </div>
  );
}