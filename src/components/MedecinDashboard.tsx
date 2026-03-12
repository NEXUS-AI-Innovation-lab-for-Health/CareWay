import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  LogOut,
  User,
  CheckCircle,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from 'lucide-react';
import * as api from '../services/api';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageContext';
import type { User as UserType } from '../App';
import { toast } from 'sonner';

interface MedecinDashboardProps {
  user: UserType;
  onLogout: () => void;
}

interface ExpandedReport {
  [id: string]: boolean;
}

const SLOT_LABELS: Record<string, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  evening: 'Soirée',
};

export function MedecinDashboard({ user, onLogout }: MedecinDashboardProps) {
  const { language } = useLanguage();
  const [reports, setReports] = useState<api.VisitReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedReport>({});

  const fetchReports = async () => {
    try {
      const data = await api.getVisitReportsAwaitingMedecin();
      setReports(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des comptes-rendus');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleValidate = async (reportId: string) => {
    setValidating(reportId);
    try {
      await api.validateVisitReportByMedecin(reportId, user.id);
      toast.success('Compte-rendu validé — envoyé au patient pour approbation');
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch {
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  };

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-blue-600" />
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <span className="text-gray-600 hidden sm:inline font-medium">Espace Médecin</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSwitcher />
              <div className="items-center gap-2 hidden md:flex">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <Button onClick={onLogout} variant="outline" size="sm" className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
              <Button onClick={onLogout} variant="outline" size="icon" className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Bonjour Dr. {user.name}
          </h1>
          <p className="text-gray-500 text-sm">
            {reports.length > 0
              ? `${reports.length} compte${reports.length > 1 ? 's' : ''}-rendu${reports.length > 1 ? 's' : ''} en attente de votre validation`
              : 'Aucun compte-rendu en attente'}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Chargement…</div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Aucun compte-rendu en attente</p>
              <p className="text-gray-400 text-sm mt-1">
                Tous les comptes-rendus infirmiers ont été traités.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const apt = report.appointment;
              const patientName = apt?.patient?.user
                ? `${apt.patient.user.first_name} ${apt.patient.user.last_name}`
                : 'Patient';
              const isOpen = expanded[report.id];

              return (
                <Card key={report.id} className="border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CardTitle className="text-base">
                            {apt?.care_type?.name || 'Soin'}
                          </CardTitle>
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                            En attente validation
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {patientName}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => toggle(report.id)}
                      >
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {apt && (
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(apt.date)} — {SLOT_LABELS[apt.slot] || apt.slot}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {apt.address}
                        </span>
                      </div>
                    )}
                  </CardHeader>

                  {isOpen && (
                    <CardContent className="pt-0 space-y-3">
                      <div className="border-t pt-3 space-y-3 text-sm">
                        {report.actes_realises && (
                          <div>
                            <p className="font-medium text-gray-700 mb-0.5">Actes réalisés</p>
                            <p className="text-gray-600 whitespace-pre-line">{report.actes_realises}</p>
                          </div>
                        )}
                        {report.observations && (
                          <div>
                            <p className="font-medium text-gray-700 mb-0.5">Observations</p>
                            <p className="text-gray-600 whitespace-pre-line">{report.observations}</p>
                          </div>
                        )}
                        {report.medicaments_administres && (
                          <div>
                            <p className="font-medium text-gray-700 mb-0.5">Médicaments administrés</p>
                            <p className="text-gray-600 whitespace-pre-line">{report.medicaments_administres}</p>
                          </div>
                        )}
                        {report.suite_a_donner && (
                          <div>
                            <p className="font-medium text-gray-700 mb-0.5">Suite à donner</p>
                            <p className="text-gray-600 whitespace-pre-line">{report.suite_a_donner}</p>
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Soumis le {new Date(report.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </div>
                      </div>
                    </CardContent>
                  )}

                  <CardContent className={`${isOpen ? 'pt-0' : 'pt-0'} pb-4`}>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleValidate(report.id)}
                      disabled={validating === report.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {validating === report.id ? 'Validation…' : 'Valider ce compte-rendu'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
