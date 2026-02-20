import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { CheckCircle, ClipboardList, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import { toast } from 'sonner';

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

interface VisitRecapModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  pmId: string;
  pmRole: 'infirmier' | 'medecin';
  patientName: string;
  careType: string;
  onSuccess: (appointmentId: string) => void;
}

export function VisitRecapModal({
  open,
  onClose,
  appointmentId,
  pmId,
  pmRole,
  patientName,
  careType,
  onSuccess
}: VisitRecapModalProps) {
  const [workflowData, setWorkflowData] = useState<OlgaWorkflow | null>(null);
  const [workflowValues, setWorkflowValues] = useState<Record<string, string | boolean>>({});
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<any | null>(null);

  const nextStep = pmRole === 'medecin' ? 'approbation patient' : 'validation médecin';

  // Vérifier si un compte-rendu existe déjà
  useEffect(() => {
    if (!open) return;

    const checkExistingReport = async () => {
      try {
        const report = await api.getVisitReportByAppointment(appointmentId);
        if (report) {
          setExistingReport(report);
          toast.info('Un compte-rendu existe déjà pour ce rendez-vous');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du compte-rendu:', error);
      }
    };

    checkExistingReport();
  }, [open, appointmentId]);

  // Charger le formulaire Olga approprié selon le rôle
  useEffect(() => {
    if (!open || existingReport) return;
    
    const fetchWorkflow = async () => {
      setIsLoadingWorkflow(true);
      try {
        // Charger le formulaire approprié selon le rôle
        // Form_Patient1 pour l'infirmier, Form_Patient2 pour le médecin
        const formId = pmRole === 'infirmier' ? 'Form_Patient1' : 'Form_Patient2';
        
        // Charger en parallèle le formulaire et les types de soins
        const [formResponse, careTypesData] = await Promise.all([
          fetch(`http://localhost:9091/forms/getFromID/${formId}`),
          api.getCareTypes()
        ]);
        
        if (!formResponse.ok) {
          throw new Error(`HTTP error! status: ${formResponse.status}`);
        }
        
        const data = await formResponse.json();
        
        // Adapter la structure de réponse du formulaire
        let workflowFields = data.form || [];
        
        // Remplacer les options du champ "Type_soins" par les types de soins de la base
        workflowFields = workflowFields.map((field: OlgaWorkflowField) => {
          if (field.field_label === 'Type_soins' || field.field_key === 'Type_soins') {
            return {
              ...field,
              field_options: {
                ...field.field_options,
                options: careTypesData.map(ct => ({ label: ct.name }))
              }
            };
          }
          return field;
        });
        
        const workflowData: OlgaWorkflow = {
          workflow_id: data.form_id,
          workflow_label: data.form_label,
          workflow: workflowFields,
          workflow_version: data.form_version
        };
        
        setWorkflowData(workflowData);
        
        // Initialiser les valeurs du formulaire
        const initialValues: Record<string, string | boolean> = {};
        workflowFields.forEach((field: OlgaWorkflowField) => {
          initialValues[field.unique_id] = field.field_type === 'checkbox' ? false : '';
        });
        setWorkflowValues(initialValues);
      } catch (error) {
        console.error('Erreur lors du chargement du workflow:', error);
        toast.error('Impossible de charger le formulaire de compte-rendu');
      } finally {
        setIsLoadingWorkflow(false);
      }
    };

    fetchWorkflow();
  }, [open, pmRole]);

  // Fonction pour rendre un champ du workflow
  const renderWorkflowField = (field: OlgaWorkflowField) => {
    const label = field.field_label || field.field_key || 'Champ';
    const value = workflowValues[field.unique_id];
    const onChange = (v: string | boolean) => 
      setWorkflowValues(prev => ({ ...prev, [field.unique_id]: v }));

    if (field.field_type === 'checkbox') {
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

    if (field.field_type === 'textarea') {
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

    if (field.field_type === 'select') {
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
            {options.map((opt: any, idx: number) => (
              <option key={idx} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Pour les autres types (text, email, number, date, etc.)
    const inputType = field.field_type.startsWith('input:') 
      ? field.field_type.split(':')[1] 
      : field.field_type;

    return (
      <div key={field.unique_id}>
        <Label htmlFor={field.unique_id} className="text-sm font-medium">
          {label}
          {field.field_required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <input
          type={inputType}
          id={field.unique_id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.field_hint}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  const handleSubmit = async () => {
    // Vérifier les champs requis
    if (workflowData?.workflow && Array.isArray(workflowData.workflow)) {
      const requiredFields = workflowData.workflow.filter(f => f.field_required);
      const missingFields = requiredFields.filter(f => {
        const value = workflowValues[f.unique_id];
        return f.field_type === 'checkbox' ? !value : !value || (value as string).trim() === '';
      });

      if (missingFields.length > 0) {
        toast.error(`Veuillez remplir tous les champs obligatoires`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Préparer les données du workflow pour l'envoi
      const workflowDataToSend = {
        workflow_id: workflowData?.workflow_id,
        workflow_label: workflowData?.workflow_label,
        workflow_values: workflowValues
      };

      await api.createVisitReport({
        appointment_id: appointmentId,
        pm_role: pmRole,
        pm_id: pmId,
        workflow_data: workflowDataToSend,
      } as any);

      toast.success(`Compte-rendu envoyé — en attente de ${nextStep}`);
      onSuccess(appointmentId);
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'envoi du compte-rendu:', err);
      toast.error('Erreur lors de l\'envoi du compte-rendu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <DialogTitle>Compte-rendu de visite</DialogTitle>
          </div>
          <DialogDescription>
            {careType} — {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Message si un compte-rendu existe déjà */}
          {existingReport && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">Compte-rendu déjà créé</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Un compte-rendu existe déjà pour ce rendez-vous.
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Statut : <span className="font-medium">
                      {existingReport.workflow_step === 'awaiting_medecin' && 'En attente de validation médecin'}
                      {existingReport.workflow_step === 'awaiting_patient' && 'En attente d\'approbation patient'}
                      {existingReport.workflow_step === 'completed' && 'Validé et approuvé'}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={onClose}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire normal si pas de compte-rendu existant */}
          {!existingReport && (
            <>
              {/* Workflow info */}
              <div className={`rounded-md px-3 py-2 text-sm ${pmRole === 'medecin' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                {pmRole === 'medecin'
                  ? '✓ Vous êtes médecin — validation médicale automatique → envoi au patient'
                  : '→ Après envoi : validation requise par un médecin, puis approbation patient'}
              </div>

              {/* Loading state */}
              {isLoadingWorkflow && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Chargement du formulaire...</span>
                </div>
              )}

              {/* Workflow fields */}
              {!isLoadingWorkflow && workflowData?.workflow && Array.isArray(workflowData.workflow) && workflowData.workflow.length > 0 && (
                <div className="space-y-4">
                  {workflowData.workflow.map(field => renderWorkflowField(field))}
                </div>
              )}

              {/* Error state - fallback */}
              {!isLoadingWorkflow && (!workflowData || !workflowData.workflow || !Array.isArray(workflowData.workflow) || workflowData.workflow.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>Impossible de charger le formulaire.</p>
                  <p className="text-sm mt-2">Vérifiez que le service Olga est accessible.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLoadingWorkflow || !workflowData?.workflow || !Array.isArray(workflowData.workflow) || workflowData.workflow.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Envoi…' : 'Valider et envoyer'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
