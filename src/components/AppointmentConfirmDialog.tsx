import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, MapPin, Calendar, CheckCircle, X, AlertCircle } from 'lucide-react';
import { getDefaultDuration } from '../constants/careTypes';

interface Appointment {
  id: string;
  date: string;
  time: string;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  timeSlotLabel?: string;
  patientName: string;
  location: string;
  type: string;
  duration?: number;
  status: string;
  isUrgent: boolean;
}

interface AppointmentConfirmDialogProps {
  appointment: Appointment;
  onConfirm: (appointmentId: string, customDuration: number) => void;
  onCancel: () => void;
}

export function AppointmentConfirmDialog({ appointment, onConfirm, onCancel }: AppointmentConfirmDialogProps) {
  const defaultDuration = getDefaultDuration(appointment.type);
  const [customDuration, setCustomDuration] = useState(defaultDuration);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleConfirm = () => {
    onConfirm(appointment.id, customDuration);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg text-gray-900 mb-1">Confirmer le rendez-vous</h2>
              <p className="text-sm text-gray-600">Ajustez la durée si nécessaire</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-900">{appointment.type}</span>
                  {appointment.isUrgent && (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">Patient: {appointment.patientName}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>
                  {appointment.time || (
                    <span className="text-gray-500">
                      {appointment.timeSlotLabel} (horaire à déterminer par l'IA)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span>{appointment.location}</span>
              </div>
            </div>
          </div>

          {/* Duration Adjustment */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-900 mb-1">
                  <strong>Durée estimée de la visite</strong>
                </p>
                <p className="text-xs text-gray-600">
                  Ajustez selon votre évaluation pour ce patient
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCustomDuration(Math.max(5, customDuration - 5))}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <span className="text-lg">−</span>
              </button>

              <div className="flex-1 flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-purple-300">
                <Clock className="h-5 w-5 text-purple-600" />
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={customDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 5 && val <= 180) {
                      setCustomDuration(val);
                    }
                  }}
                  className="w-16 text-center text-xl text-gray-900 bg-transparent border-none focus:outline-none"
                />
                <span className="text-gray-600">min</span>
              </div>

              <button
                onClick={() => setCustomDuration(Math.min(180, customDuration + 5))}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <span className="text-lg">+</span>
              </button>
            </div>

            {customDuration !== defaultDuration && (
              <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                <span>Durée par défaut : {defaultDuration} min</span>
                <button
                  onClick={() => setCustomDuration(defaultDuration)}
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>💡 Pourquoi ajuster la durée ?</strong>
            </p>
            <p className="text-xs text-blue-800 mt-1">
              Cette durée sera utilisée par l'algorithme d'optimisation pour planifier l'horaire exact de votre visite et minimiser vos déplacements.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer ({customDuration} min)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
