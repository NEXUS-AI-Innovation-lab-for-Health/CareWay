import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, Download, Calendar, Pill } from 'lucide-react';
import type { User as UserType } from '../App';

interface PatientProfileProps {
  user: UserType;
  onBack: () => void;
}

interface PersonalInfo {
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  socialSecurity: string;
}

interface HealthDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

interface Prescription {
  id: string;
  date: string;
  nurseName: string;
  medications: string[];
  notes: string;
}

// Olga form types
interface OlgaFormField {
  field_key: string;
  field_label: string;
  field_type: string;
  field_required?: boolean;
}

// Données mockées
const mockPersonalInfo: PersonalInfo = {
  email: 'patient@example.com',
  phone: '06 12 34 56 78',
  address: '123 Rue de la Santé, 75013 Paris',
  birthDate: '15/03/1985',
  socialSecurity: '1 85 03 75 123 456 78'
};

const mockDocuments: HealthDocument[] = [
  {
    id: '1',
    name: 'Carte Vitale',
    type: 'Assurance',
    date: '2024-01-15',
    size: '245 KB'
  },
  {
    id: '2',
    name: 'Résultats analyses sanguines',
    type: 'Résultats',
    date: '2024-11-20',
    size: '512 KB'
  },
  {
    id: '3',
    name: 'Certificat médical',
    type: 'Certificat',
    date: '2024-10-10',
    size: '189 KB'
  }
];

const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    date: '2024-11-20',
    nurseName: 'Dr. Sophie Bernard',
    medications: ['Paracétamol 1g - 3x/jour', 'Ibuprofène 400mg - 2x/jour si douleur'],
    notes: 'Traitement pour 7 jours. À prendre pendant les repas.'
  },
  {
    id: '2',
    date: '2024-10-15',
    nurseName: 'Dr. Marie Dupont',
    medications: ['Amoxicilline 500mg - 3x/jour', 'Vitamine C 1000mg - 1x/jour'],
    notes: 'Traitement antibiotique - Ne pas interrompre avant la fin.'
  }
];

export function PatientProfile({ user, onBack }: PatientProfileProps) {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(mockPersonalInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [olgaFields, setOlgaFields] = useState<OlgaFormField[]>([]);
  const [olgaValues, setOlgaValues] = useState<Record<string, string>>({});
  const [isOlgaLoading, setIsOlgaLoading] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    // Ici on sauvegarderait les données
  };

  // Charge le formulaire Olga (test)
  useEffect(() => {
    const fetchOlgaForm = async () => {
      setIsOlgaLoading(true);
      try {
        const res = await fetch('http://localhost:9091/forms/getFromID/Rapport_patient_ID');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const fields: OlgaFormField[] = (data.form || []).map((f: any) => ({
          field_key: f.field_key,
          field_label: f.field_label,
          field_type: f.field_type,
          field_required: f.field_required,
        }));
        setOlgaFields(fields);
        // Initialise les valeurs à vide
        const initialVals: Record<string, string> = {};
        fields.forEach((f) => {
          initialVals[f.field_key] = '';
        });
        setOlgaValues(initialVals);
      } catch (error) {
        console.error('Erreur chargement formulaire Olga:', error);
      } finally {
        setIsOlgaLoading(false);
      }
    };

    fetchOlgaForm();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDownload = (documentName: string) => {
    // Simulation de téléchargement
    alert(`Téléchargement de ${documentName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-gray-600">Informations personnelles</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-gray-900">{user.name}</h1>
            <p className="text-gray-600">Patient</p>
          </div>
        </div>

        {/* Personal Information */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>Vos coordonnées et informations de contact</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    Annuler
                  </Button>
                  <Button onClick={handleSave} size="sm" className="bg-black hover:bg-gray-800">
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2 text-gray-400" />
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-2 text-gray-400" />
                  Téléphone
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2 text-gray-400" />
                  Adresse de domicile
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2 text-gray-400" />
                  Date de naissance
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.birthDate}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.birthDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2 text-gray-400" />
                  Numéro de sécurité sociale
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={personalInfo.socialSecurity}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, socialSecurity: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{personalInfo.socialSecurity}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire Olga (test) */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Formulaire Olga – Rapport Patient (test)
                </CardTitle>
                <CardDescription>
                  Chargé depuis /forms/getFromID/Rapport_patient_ID et rendu en champs éditables.
                </CardDescription>
              </div>
              <Badge variant="outline">ID: Rapport_patient_ID</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOlgaLoading ? (
              <p className="text-gray-500 text-sm">Chargement du formulaire...</p>
            ) : olgaFields.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun champ trouvé dans le formulaire.</p>
            ) : (
              <div className="space-y-4">
                {olgaFields.map((field) => {
                  const value = olgaValues[field.field_key] ?? '';
                  const label = field.field_label || field.field_key;
                  const isText = field.field_type?.startsWith('input:');

                  return (
                    <div key={field.field_key} className="space-y-2">
                      <label className="block text-sm text-gray-700">
                        {label}
                        {field.field_required ? <span className="text-red-500 ml-1">*</span> : null}
                      </label>
                      {isText ? (
                        <Input
                          value={value}
                          onChange={(e) =>
                            setOlgaValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                          }
                          placeholder={label}
                        />
                      ) : (
                        <Input
                          value={value}
                          onChange={(e) =>
                            setOlgaValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                          }
                          placeholder={label}
                        />
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex gap-2">
                  <Button
                    className="bg-black hover:bg-gray-800"
                    onClick={() => console.log('Valeurs Olga test ->', olgaValues)}
                  >
                    Tester l&apos;enregistrement (console)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const reset: Record<string, string> = {};
                      olgaFields.forEach((f) => (reset[f.field_key] = ''));
                      setOlgaValues(reset);
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Documents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents de santé
            </CardTitle>
            <CardDescription>Vos documents médicaux et administratifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {formatDate(doc.date)} • {doc.size}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Ordonnances
            </CardTitle>
            <CardDescription>Ordonnances prescrites lors de vos consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-gray-900 mb-1">
                        {formatDate(prescription.date)}
                      </p>
                      <p className="text-sm text-gray-600">{prescription.nurseName}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Valide
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg mb-2">
                    <p className="text-sm text-gray-700 mb-2">Médicaments prescrits :</p>
                    <ul className="space-y-1">
                      {prescription.medications.map((med, index) => (
                        <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                          <Pill className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {med}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-600 italic">{prescription.notes}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(`Ordonnance-${prescription.date}`)}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
