import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, CheckCircle, Calendar, MapPin, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import { toast } from 'sonner';
import { getOlgaTestState, setOlgaTestState, clearOlgaTestState } from '../utils/olgaTestWorkflow';

interface OlgaWorkflowField {
  unique_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_required?: boolean;
  field_hint?: string;
  field_options?: {
    options: Array<{ label: string; value?: string }>;
    source?: string;
  };
}

interface OlgaWorkflow {
  workflow_id: string;
  workflow_label: string;
  workflow: OlgaWorkflowField[];
  workflow_version?: string;
}

interface MedecinValidationsModalProps {
  medecinId: string;
  onClose: () => void;
}

interface VisitReport {
  id: string;
  appointment_id: string;
  workflow_step: string;
  workflow_data?: any;
  created_at: string;
  appointment?: {
    id: string;
    date: string;
    slot: string;
    address: string;
    patient?: {
      user?: {
        first_name: string;
        last_name: string;
      };
    };
    care_type?: {
      name: string;
    };
  };
}

export function MedecinValidationsModal({ medecinId, onClose }: MedecinValidationsModalProps) {
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<VisitReport | null>(null);
  const [showInfirmierData, setShowInfirmierData] = useState<string | null>(null);
  const [medecinForm, setMedecinForm] = useState<OlgaWorkflow | null>(null);
  const [medecinFormValues, setMedecinFormValues] = useState<Record<string, string | boolean>>({});
  const [loadingForm, setLoadingForm] = useState(false);
  const [validating, setValidating] = useState(false);
  const [olgaTestState, setOlgaTestStateLocal] = useState(getOlgaTestState());

  useEffect(() => {
    loadReports();
  }, []);

  // Poll localStorage test state so modal sees pending_doctor
  useEffect(() => {
    const interval = setInterval(() => {
      setOlgaTestStateLocal(getOlgaTestState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getVisitReportsAwaitingMedecin();
      setReports(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des validations:', error);
      toast.error('Impossible de charger les comptes-rendus');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMedecinForm = async (reportId: string) => {
    if (selectedReport?.id === reportId && medecinForm) {
      // Formulaire déjà chargé, on ferme
      setSelectedReport(null);
      setMedecinForm(null);
      setMedecinFormValues({});
      return;
    }

    try {
      setLoadingForm(true);
      setSelectedReport(reports.find(r => r.id === reportId) || null);
      
      // 🔄 Charger le formulaire médecin via le workflow Olga
      const candidates = ['RapportMedecin_ID', 'RapportPatient'];
      let formData: any = null;
      let lastError: unknown = null;
      for (const workflowId of candidates) {
        try {
          // eslint-disable-next-line no-await-in-loop
          formData = await api.getFormForRole(workflowId, 'medecin');
          if (formData) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!formData) {
        throw new Error(`Aucun formulaire médecin trouvé (candidats: ${candidates.join(', ')}) - ${lastError instanceof Error ? lastError.message : ''}`);
      }
      
      if (!formData) {
        throw new Error('Aucun formulaire trouvé pour le rôle médecin dans le workflow RapportPatient');
      }
      
      const workflowData: OlgaWorkflow = {
        workflow_id: formData.form_id,
        workflow_label: formData.form_label,
        workflow: formData.form || [],
        workflow_version: formData.form_version
      };
      
      setMedecinForm(workflowData);
      
      // Initialiser les valeurs
      const initialValues: Record<string, string | boolean> = {};
      (formData.form || []).forEach((field: OlgaWorkflowField) => {
        initialValues[field.unique_id] = field.field_type === 'checkbox' ? false : '';
      });
      setMedecinFormValues(initialValues);
    } catch (error) {
      console.error('Erreur lors du chargement du formulaire médecin:', error);
      toast.error('Impossible de charger le formulaire médecin');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleOlgaTestApprove = () => {
    const next = {
      status: 'completed' as const,
      payload: olgaTestState.payload,
      nurseValidatedAt: olgaTestState.nurseValidatedAt,
      doctorValidatedAt: new Date().toISOString()
    };
    setOlgaTestState(next);
    setOlgaTestStateLocal(next);
  };

  const handleOlgaTestReset = () => {
    clearOlgaTestState();
    setOlgaTestStateLocal(getOlgaTestState());
  };

  const handleValidate = async (reportId: string) => {
    if (!medecinForm || !selectedReport) return;

    // Vérifier les champs requis
    const requiredFields = medecinForm.workflow.filter(f => f.field_required);
    const missingFields = requiredFields.filter(f => {
      const value = medecinFormValues[f.unique_id];
      return f.field_type === 'checkbox' ? !value : !value || (value as string).trim() === '';
    });

    if (missingFields.length > 0) {
      toast.error('Veuillez remplir tous les champs obligatoires du formulaire médecin');
      return;
    }

    try {
      setValidating(true);
      
      // Préparer les données du formulaire médecin (avec labels)
      const medecinFields: Record<string, string> = {};
      medecinForm.workflow.forEach(f => {
        medecinFields[f.unique_id] = f.field_label || f.field_key || f.unique_id;
      });
      const medecinFormData = {
        workflow_id: medecinForm.workflow_id,
        workflow_label: medecinForm.workflow_label,
        workflow_values: medecinFormValues,
        workflow_fields: medecinFields
      };
      
      await api.validateVisitReportByMedecin(reportId, medecinId, medecinFormData);
      toast.success('Compte-rendu validé avec succès');
      loadReports();
      setSelectedReport(null);
      setMedecinForm(null);
      setMedecinFormValues({});
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSlotLabel = (slot: string) => {
    const labels: Record<string, string> = {
      morning: 'Matin',
      afternoon: 'Après-midi',
      evening: 'Soirée'
    };
    return labels[slot] || slot;
  };

  const renderFormField = (field: OlgaWorkflowField) => {
    const value = medecinFormValues[field.unique_id] || '';
    const onChange = (newValue: string | boolean) => {
      setMedecinFormValues(prev => ({
        ...prev,
        [field.unique_id]: newValue
      }));
    };

    const label = field.field_label || field.field_key;
    const normalizedType = (field.field_type || '').toLowerCase();

    if (normalizedType === 'checkbox') {
      return (
        <div key={field.unique_id} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field.unique_id}
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-blue-600 rounded border-gray-300"
          />
          <Label htmlFor={field.unique_id} className="text-sm font-medium cursor-pointer">
            {label}
            {field.field_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
      );
    }

    if (normalizedType === 'textarea') {
      return (
        <div key={field.unique_id}>
          <Label htmlFor={field.unique_id} className="text-sm font-medium">
            {label}
            {field.field_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={field.unique_id}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.field_hint}
            className="mt-1 h-24 resize-none"
          />
        </div>
      );
    }

    if (normalizedType === 'select') {
      const options = field.field_options?.options || [];
      return (
        <div key={field.unique_id}>
          <Label htmlFor={field.unique_id} className="text-sm font-medium">
            {label}
            {field.field_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <select
            id={field.unique_id}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Sélectionner...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt.value || opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (normalizedType.startsWith('input:')) {
      const inputKind = normalizedType.split(':')[1] || 'text';
      const allowedTypes = ['text', 'number', 'email', 'date', 'datetime-local', 'time', 'tel', 'url'];
      const inputType = allowedTypes.includes(inputKind) ? inputKind : 'text';
      return (
        <div key={field.unique_id}>
          <Label htmlFor={field.unique_id} className="text-sm font-medium">
            {label || field.field_key || 'Champ'}
            {field.field_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <input
            type={inputType}
            id={field.unique_id}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.field_hint}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            inputMode={inputType === 'number' ? 'decimal' : undefined}
          />
        </div>
      );
    }

    return (
      <div key={field.unique_id}>
        <Label htmlFor={field.unique_id} className="text-sm font-medium">
          {label}
          {field.field_required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <input
          type="text"
          id={field.unique_id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.field_hint}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Comptes-rendus en attente</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {olgaTestState.status === 'pending_doctor' && (
                <Card className="border-green-200 shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Test Olga - Validation médecin
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Test local</Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">Données issues de localStorage (olga_test_workflow)</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                      {olgaTestState.payload?.from && <span>Envoyé par: {olgaTestState.payload.from}</span>}
                      {olgaTestState.nurseValidatedAt && <span>Infirmier: {olgaTestState.nurseValidatedAt}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {olgaTestState.payload?.values && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200 space-y-2">
                        {Object.entries(olgaTestState.payload.values).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{key}</span>
                            <span className="text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleOlgaTestApprove}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Valider (test)
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleOlgaTestReset}>
                        <X className="h-4 w-4 mr-2" />
                        Réinitialiser test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!reports || reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
                  <p className="text-lg">Aucun compte-rendu en attente de validation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-lg">
                              {report.appointment?.patient?.user?.first_name}{' '}
                              {report.appointment?.patient?.user?.last_name}
                            </CardTitle>
                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(report.appointment?.date || '')}</span>
                                <Badge variant="outline">{getSlotLabel(report.appointment?.slot || '')}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{report.appointment?.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{report.appointment?.care_type?.name}</span>
                              </div>
                            </div>
                          </div>
                          <Badge>En attente</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Données de l'infirmier */}
                        {showInfirmierData === report.id && report.workflow_data?.workflow_values && (
                          <div className="space-y-3 border-t pt-4 mb-4">
                            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Compte-rendu de l'infirmier
                            </h4>
                            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                              {Object.entries(report.workflow_data.workflow_values).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                                  <span className="font-medium text-gray-700">{report.workflow_data.workflow_fields?.[key] || key}:</span>
                                  <span className="col-span-2 text-gray-900">
                                    {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Formulaire médecin */}
                        {selectedReport?.id === report.id && loadingForm && (
                          <div className="flex items-center justify-center py-8 border-t">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="ml-2 text-sm text-gray-600">Chargement du formulaire médecin...</span>
                          </div>
                        )}

                        {selectedReport?.id === report.id && medecinForm && !loadingForm && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
                              {/* Résumé automatique des données infirmier */}
                              {report.workflow_data?.workflow_values && (
                                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                  <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                                    <FileText className="h-4 w-4" />
                                    Compte-rendu de l'infirmier ({report.workflow_data.workflow_label || 'Form_Patient1'})
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(report.workflow_data.workflow_values).map(([key, value]) => (
                                      <div key={key} className="bg-white rounded px-3 py-2">
                                        <span className="text-xs font-medium text-gray-600 block mb-1">{report.workflow_data.workflow_fields?.[key] || key}</span>
                                        <span className="text-sm text-gray-900 font-medium">
                                          {typeof value === 'boolean' ? (value ? '✓ Oui' : '✗ Non') : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Formulaire de validation médecin (Form_Patient2) */}
                              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Validation médecin ({medecinForm.workflow_label || 'Form_Patient2'})
                                </h4>
                                <div className="space-y-3">
                                  {medecinForm.workflow.map(field => renderFormField(field))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          {/* Bouton pour voir les données infirmier */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInfirmierData(showInfirmierData === report.id ? null : report.id)}
                          >
                            {showInfirmierData === report.id ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Masquer infirmier
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Voir infirmier
                              </>
                            )}
                          </Button>

                          {/* Bouton pour charger/afficher le formulaire médecin */}
                          {selectedReport?.id !== report.id ? (
                            <Button
                              size="sm"
                              onClick={() => loadMedecinForm(report.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={loadingForm}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Remplir formulaire médecin
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(null);
                                  setMedecinForm(null);
                                  setMedecinFormValues({});
                                }}
                              >
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleValidate(report.id)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={validating}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {validating ? 'Validation...' : 'Valider'}
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
