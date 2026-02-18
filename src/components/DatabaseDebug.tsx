import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Database, Users, Stethoscope, RefreshCw, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

export function DatabaseDebug() {
  const [patients, setPatients] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c`;

  const fetchAllPatients = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}/debug/patients`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        // Format data to match new structure
        const formattedPatients = (data.patients || []).map((p: any) => ({
          id: p.user_id,
          name: p.user ? `${p.user.first_name} ${p.user.last_name}` : 'N/A',
          email: p.user?.email || 'N/A',
          phone: p.user?.phone || '',
          address: p.default_address || ''
        }));
        setPatients(formattedPatients);
      } else {
        setError('Erreur lors de la récupération des patients');
      }
    } catch (err) {
      setError('Erreur réseau : ' + err);
      console.error('Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllNurses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}/debug/infirmiers`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        // Format data to match new structure
        const formattedNurses = (data.infirmiers || []).map((n: any) => ({
          id: n.user_id,
          name: n.user ? `${n.user.first_name} ${n.user.last_name}` : 'N/A',
          email: n.user?.email || 'N/A',
          phone: n.user?.phone || ''
        }));
        setNurses(formattedNurses);
      } else {
        setError('Erreur lors de la récupération des infirmiers');
      }
    } catch (err) {
      setError('Erreur réseau : ' + err);
      console.error('Error fetching nurses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAll = () => {
    fetchAllPatients();
    fetchAllNurses();
  };

  const cleanAllUsers = async () => {
    const confirmDelete = window.confirm(
      '⚠️ ATTENTION : Cette action va supprimer TOUS les utilisateurs (patients et infirmiers) ainsi que TOUS leurs rendez-vous de la base de données.\n\nCette action est irréversible !\n\nVoulez-vous vraiment continuer ?'
    );
    
    if (!confirmDelete) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}/debug/clean-all-users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${data.message}`, {
          description: `${data.deletedAuthUsers} utilisateur(s) supprimé(s)`
        });
        setPatients([]);
        setNurses([]);
      } else {
        setError('Erreur lors du nettoyage : ' + (data.error || 'Erreur inconnue'));
        toast.error('Erreur lors du nettoyage');
      }
    } catch (err) {
      setError('Erreur réseau : ' + err);
      toast.error('Erreur réseau');
      console.error('Error cleaning users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 shadow-xl border-2 border-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-blue-600" />
            Base de données Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={fetchAll} 
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Chargement...' : 'Actualiser les données'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Patients section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm">Patients</h4>
              <Badge variant="secondary">{patients.length}</Badge>
            </div>
            
            {patients.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun patient dans la base</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {patients.map((patient, idx) => (
                  <div key={idx} className="p-2 bg-green-50 rounded text-xs">
                    <div className="font-semibold text-green-900">{patient.name}</div>
                    <div className="text-green-700">{patient.email}</div>
                    <div className="text-green-600">ID: {patient.id}</div>
                    {patient.phone && <div className="text-green-600">Tel: {patient.phone}</div>}
                    {patient.address && <div className="text-green-600">Adresse: {patient.address}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nurses section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm">Infirmiers</h4>
              <Badge variant="secondary">{nurses.length}</Badge>
            </div>
            
            {nurses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun infirmier dans la base</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {nurses.map((nurse, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded text-xs">
                    <div className="font-semibold text-blue-900">{nurse.name}</div>
                    <div className="text-blue-700">{nurse.email}</div>
                    <div className="text-blue-600">ID: {nurse.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t text-xs text-gray-500 text-center">
            🔍 Panneau de debug - À retirer en production
          </div>

          <Button 
            onClick={cleanAllUsers} 
            variant="destructive"
            className="w-full mt-2"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            🧹 Nettoyer TOUTES les données
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}