import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Clock, MapPin, User, FileText, Pill, AlertCircle, Heart, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from './LanguageContext';

interface Appointment {
  id: string;
  date: string;
  time: string;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  timeSlotLabel?: string;
  patientName: string;
  location: string;
  type: string;
  status: string;
  isUrgent: boolean;
  patientPhoto?: string;
  medicalRecord?: {
    age: number;
    bloodType: string;
    allergies: string[];
    chronicConditions: string[];
    notes: string;
  };
  prescription?: {
    doctor: string;
    date: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    instructions: string;
  };
}

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onComplete?: (id: string) => void;
  patientId?: string;
}

export function AppointmentDetailsModal({ appointment, open, onClose, onComplete, patientId }: AppointmentDetailsModalProps) {
  const { t } = useLanguage();
  const [medicalInfo, setMedicalInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load medical info when modal opens
  useEffect(() => {
    if (open && patientId) {
      loadMedicalInfo();
    }
  }, [open, patientId]);

  const loadMedicalInfo = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c/api/patient/${patientId}/medical-info`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMedicalInfo(data.medicalInfo);
      }
    } catch (error) {
      console.error('Error loading medical info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Use real data from API or fallback to mock data
  const medicalRecord = medicalInfo ? {
    age: medicalInfo.age || 'N/A',
    bloodType: medicalInfo.bloodType || t('modal.not_specified'),
    allergies: medicalInfo.allergies || [],
    chronicConditions: medicalInfo.chronicConditions || [],
    notes: medicalInfo.medicalNotes || ''
  } : appointment.medicalRecord || {
    age: 'N/A',
    bloodType: t('modal.not_specified'),
    allergies: [],
    chronicConditions: [],
    notes: t('common.loading')
  };

  const prescription = medicalInfo?.latestPrescription ? {
    doctor: medicalInfo.latestPrescription.doctor,
    date: medicalInfo.latestPrescription.date,
    medications: medicalInfo.latestPrescription.medications.map((med: any) => ({
      name: med.medication_name,
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || ''
    })),
    instructions: medicalInfo.latestPrescription.instructions || ''
  } : appointment.prescription;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              {appointment.patientName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="text-gray-900">{t('modal.patient_title')} {appointment.patientName}</div>
              <div className="text-sm text-gray-600">{appointment.type}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {t('modal.details_subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('modal.appointment_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{formatDate(appointment.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{appointment.time || appointment.timeSlotLabel}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{appointment.location}</span>
              </div>
              {appointment.isUrgent && (
                <Badge className="bg-red-100 text-red-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('ai.urgent_label')}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Medical Record */}
          <Card className="border-cyan-200 bg-cyan-50/30">
            <CardHeader className="bg-cyan-100/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-700" />
                {t('modal.medical_record')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('modal.age')}</p>
                  <p className="text-sm text-gray-900">{medicalRecord.age} {t('modal.years')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('modal.blood_type')}</p>
                  <p className="text-sm text-gray-900">{medicalRecord.bloodType}</p>
                </div>
              </div>

              {medicalRecord.allergies.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    {t('modal.allergies')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {medicalRecord.allergies.map((allergy, index) => (
                      <Badge key={index} className="bg-red-100 text-red-700">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {medicalRecord.chronicConditions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Heart className="h-3 w-3 text-orange-600" />
                    {t('modal.chronic_conditions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {medicalRecord.chronicConditions.map((condition, index) => (
                      <Badge key={index} className="bg-orange-100 text-orange-700">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {medicalRecord.notes && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-1">{t('modal.notes')}</p>
                  <p className="text-sm text-gray-700">{medicalRecord.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription */}
          <Card className="border-cyan-200 bg-cyan-50/30">
            <CardHeader className="bg-cyan-100/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-5 w-5 text-cyan-700" />
                {t('modal.prescription_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{prescription?.doctor}</span>
                </div>
                <span className="text-gray-500">
                  {prescription?.date ? new Date(prescription.date).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-600">{t('modal.medications')}</p>
                {prescription?.medications.map((med, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {med.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-blue-600" />
                      {med.frequency}
                    </p>
                  </div>
                ))}
              </div>

              {prescription?.instructions && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2">{t('modal.instructions')}</p>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {prescription.instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {appointment.status === 'confirmed' && onComplete && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onClose}
              >
                {t('common.close')}
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onComplete(appointment.id);
                  onClose();
                }}
              >
                {t('modal.mark_completed')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}