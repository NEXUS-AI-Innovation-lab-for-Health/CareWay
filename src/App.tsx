import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { ModernLoginForm } from './components/ModernLoginForm';
import { ModernRegisterForm } from './components/ModernRegisterForm';
import { FranceConnectLogin } from './components/FranceConnectLogin';
import { PatientDashboard } from './components/PatientDashboard';
import { NurseDashboard } from './components/NurseDashboard';
import { Toaster } from './components/ui/sonner';
import { LanguageContext } from './components/LanguageContext';
import { translations } from './components/translations';
import type { Language } from './components/translations';

export type User = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  type: 'patient' | 'nurse' | 'medecin';
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'patientAuth' | 'nurseAuth' | 'dashboard'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('fr');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const handleSelectPatient = () => {
    setCurrentView('patientAuth');
    setAuthMode('login');
  };

  const handleSelectNurse = () => {
    setCurrentView('nurseAuth');
  };

  const handleFranceConnectLogin = (user: User) => {
    // FranceConnect renvoie un infirmier ou un médecin
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handlePatientLoginSuccess = (user: User) => {
    setCurrentUser({ ...user, type: 'patient' });
    setCurrentView('dashboard');
  };

  const handlePatientRegisterSuccess = () => {
    setAuthMode('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Toaster />
      
      {/* Home page */}
      {currentView === 'home' && (
        <HomePage 
          onSelectPatient={handleSelectPatient}
          onSelectNurse={handleSelectNurse}
        />
      )}

      {/* Patient authentication */}
      {currentView === 'patientAuth' && (
        <>
          {authMode === 'login' ? (
            <ModernLoginForm
              onLoginSuccess={handlePatientLoginSuccess}
              onSwitchToRegister={() => setAuthMode('register')}
              onBack={() => setCurrentView('home')}
            />
          ) : (
            <ModernRegisterForm
              onRegisterSuccess={handlePatientRegisterSuccess}
              onSwitchToLogin={() => setAuthMode('login')}
              onBack={() => setCurrentView('home')}
            />
          )}
        </>
      )}

      {/* Nurse authentication (FranceConnect) */}
      {currentView === 'nurseAuth' && (
        <FranceConnectLogin 
          onLogin={handleFranceConnectLogin}
          onBack={() => setCurrentView('home')}
        />
      )}

      {/* Dashboard */}
      {currentView === 'dashboard' && currentUser && (
        currentUser.type === 'patient' ? (
          <PatientDashboard 
            user={currentUser as any} 
            onLogout={handleLogout}
            onUpdateUser={setCurrentUser}
          />
        ) : (
          <NurseDashboard user={currentUser} onLogout={handleLogout} />
        )
      )}
    </LanguageContext.Provider>
  );
}
