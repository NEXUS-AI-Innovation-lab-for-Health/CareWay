import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { CheckCircle, ClipboardList } from 'lucide-react';
import * as api from '../services/api';
import { toast } from 'sonner';

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
  const [actes, setActes] = useState('');
  const [observations, setObservations] = useState('');
  const [medicaments, setMedicaments] = useState('');
  const [suite, setSuite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = pmRole === 'medecin' ? 'approbation patient' : 'validation médecin';

  const handleSubmit = async () => {
    if (!actes.trim()) {
      toast.error('Les actes réalisés sont obligatoires');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createVisitReport({
        appointment_id: appointmentId,
        actes_realises: actes,
        observations: observations || undefined,
        medicaments_administres: medicaments || undefined,
        suite_a_donner: suite || undefined,
        pm_role: pmRole,
        pm_id: pmId,
      });
      toast.success(`Compte-rendu envoyé — en attente de ${nextStep}`);
      onSuccess(appointmentId);
      onClose();
    } catch (err) {
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
          {/* Workflow info */}
          <div className={`rounded-md px-3 py-2 text-sm ${pmRole === 'medecin' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
            {pmRole === 'medecin'
              ? '✓ Vous êtes médecin — validation médicale automatique → envoi au patient'
              : '→ Après envoi : validation requise par un médecin, puis approbation patient'}
          </div>

          <div>
            <Label htmlFor="actes" className="text-sm font-medium">
              Actes réalisés <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="actes"
              value={actes}
              onChange={(e) => setActes(e.target.value)}
              placeholder="Pansement, injection, prise de constantes…"
              className="mt-1 h-24 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="observations" className="text-sm font-medium">
              Observations cliniques
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="État général du patient, évolution…"
              className="mt-1 h-20 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="medicaments" className="text-sm font-medium">
              Médicaments administrés
            </Label>
            <Textarea
              id="medicaments"
              value={medicaments}
              onChange={(e) => setMedicaments(e.target.value)}
              placeholder="Nom, dose, voie d'administration…"
              className="mt-1 h-20 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="suite" className="text-sm font-medium">
              Suite à donner
            </Label>
            <Textarea
              id="suite"
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
              placeholder="Prochaine visite, consignes, alertes médecin…"
              className="mt-1 h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Envoi…' : 'Valider et envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
