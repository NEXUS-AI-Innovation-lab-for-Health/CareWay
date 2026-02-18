import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User, Stethoscope, Shield } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';

interface HomePageProps {
  onSelectPatient: () => void;
  onSelectNurse: () => void;
}

export function HomePage({ onSelectPatient, onSelectNurse }: HomePageProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-1 pb-2 pt-3">
            <div className="flex justify-center">
              <div className="flex items-center gap-1">
                <span className="text-xl">DW</span>
                <span className="text-xl">™</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">{t('home.welcome')}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                {t('home.description')}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            <div className="grid md:grid-cols-2 gap-3">
              {/* Patient Card */}
              <button
                onClick={onSelectPatient}
                className="group relative overflow-hidden"
              >
                <Card className="h-full border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all">
                  <CardContent className="pt-4 pb-4 text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <User className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{t('home.patient.title')}</h3>
                      <p className="text-xs text-gray-600 px-4">
                        {t('home.patient.desc')}
                      </p>
                    </div>
                    <div className="pt-1">
                      <div className="text-xs text-gray-500 leading-relaxed">
                        • {t('home.patient.features.1')}<br />
                        • {t('home.patient.features.2')}<br />
                        • {t('home.patient.features.3')}
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="inline-flex items-center text-xs text-blue-600 group-hover:text-blue-700">
                        {t('home.patient.action')}
                        <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* Nurse Card */}
              <button
                onClick={onSelectNurse}
                className="group relative overflow-hidden"
              >
                <Card className="h-full border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
                  <CardContent className="pt-4 pb-4 text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                        <Stethoscope className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{t('home.nurse.title')}</h3>
                      <p className="text-xs text-gray-600 px-4">
                        {t('home.nurse.desc')}
                      </p>
                    </div>
                    <div className="pt-1">
                      <div className="text-xs text-gray-500 leading-relaxed">
                        • {t('home.nurse.features.1')}<br />
                        • {t('home.nurse.features.2')}<br />
                        • {t('home.nurse.features.3')}
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="inline-flex items-center text-xs text-green-600 group-hover:text-green-700">
                        <Shield className="h-3 w-3 mr-1" />
                        {t('home.nurse.action')}
                        <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>

            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900">
                  <p className="mb-0.5">
                    <strong>{t('home.security.title')}</strong>
                  </p>
                  <p className="text-blue-700">
                    {t('home.security.desc')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-2 text-center space-y-1">
          <p className="text-xs text-gray-600">
            <strong>Laboratoire LISSI</strong>
          </p>
          <p className="text-xs text-gray-500">
            Adam Chelli, Pierre Wantiez, Raja Yaabba, Abdelghani Chibani
          </p>
          <p className="text-xs text-gray-400">
            {t('home.footer.terms')}
          </p>
        </div>
      </div>
    </div>
  );
}