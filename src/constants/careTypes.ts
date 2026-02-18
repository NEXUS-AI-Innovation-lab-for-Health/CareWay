// Référentiel des types de soins avec durées estimées

export interface CareType {
  id: string;
  label: string;
  duration: number; // Durée en minutes
  description: string;
  icon: string;
}

export const careTypes: CareType[] = [
  {
    id: 'injection',
    label: 'Injection',
    duration: 15,
    description: 'Administration d\'une injection simple',
    icon: '💉'
  },
  {
    id: 'blood-test',
    label: 'Prise de sang',
    duration: 20,
    description: 'Prélèvement sanguin',
    icon: '🩸'
  },
  {
    id: 'medication',
    label: 'Administration de médicaments',
    duration: 25,
    description: 'Préparation et administration de médicaments',
    icon: '💊'
  },
  {
    id: 'dressing',
    label: 'Gestion des pansements',
    duration: 35,
    description: 'Changement et soins de plaies',
    icon: '🩹'
  },
  {
    id: 'chronic-followup',
    label: 'Suivi d\'une maladie chronique',
    duration: 50,
    description: 'Suivi, contrôles et conseils',
    icon: '📋'
  },
  {
    id: 'vaccination',
    label: 'Vaccination',
    duration: 20,
    description: 'Administration de vaccin',
    icon: '💉'
  },
  {
    id: 'post-surgery',
    label: 'Soins post-opératoires',
    duration: 40,
    description: 'Soins après intervention chirurgicale',
    icon: '🏥'
  },
  {
    id: 'perfusion',
    label: 'Perfusion',
    duration: 30,
    description: 'Mise en place et surveillance',
    icon: '💧'
  }
];

export const getCareTypeById = (id: string): CareType | undefined => {
  return careTypes.find(type => type.id === id);
};

export const getCareTypeByLabel = (label: string): CareType | undefined => {
  return careTypes.find(type => type.label === label);
};

export const getDefaultDuration = (careTypeLabel: string): number => {
  const careType = getCareTypeByLabel(careTypeLabel);
  return careType?.duration || 30; // 30 min par défaut si non trouvé
};
