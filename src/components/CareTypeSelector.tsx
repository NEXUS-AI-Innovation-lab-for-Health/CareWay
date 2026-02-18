import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, CheckCircle } from 'lucide-react';
import { careTypes, type CareType } from '../constants/careTypes';

interface CareTypeSelectorProps {
  selectedCareType: CareType | null;
  onSelect: (careType: CareType) => void;
}

export function CareTypeSelector({ selectedCareType, onSelect }: CareTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg text-gray-900 mb-2">Quel soin souhaitez-vous ?</h2>
        <p className="text-sm text-gray-600">Sélectionnez le type de soin dont vous avez besoin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {careTypes.map((careType) => {
          const isSelected = selectedCareType?.id === careType.id;
          
          return (
            <button
              key={careType.id}
              onClick={() => onSelect(careType)}
              className={`
                text-left p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{careType.icon}</span>
                    <span className="text-gray-900">{careType.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{careType.description}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Durée estimée : {careType.duration} min</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="shrink-0">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
