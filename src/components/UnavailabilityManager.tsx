import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarIcon, Clock, X, Plus, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from './LanguageContext';

interface Unavailability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
}

interface UnavailabilityManagerProps {
  nurseId: string;
  onUnavailabilitiesChange?: (unavailabilities: Unavailability[]) => void;
}

export function UnavailabilityManager({ nurseId, onUnavailabilitiesChange }: UnavailabilityManagerProps) {
  const { t, language } = useLanguage();
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUnavailability, setNewUnavailability] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  });

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-1b83ce4c`;

  useEffect(() => {
    fetchUnavailabilities();
  }, [nurseId]);

  const fetchUnavailabilities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/unavailabilities/${nurseId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      const sorted = (data.unavailabilities || []).sort((a: Unavailability, b: Unavailability) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setUnavailabilities(sorted);
      if (onUnavailabilitiesChange) {
        onUnavailabilitiesChange(sorted);
      }
    } catch (error) {
      console.error('Error fetching unavailabilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUnavailability = async () => {
    if (!newUnavailability.date || !newUnavailability.startTime || !newUnavailability.endTime) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/unavailabilities/${nurseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(newUnavailability)
      });

      if (response.ok) {
        setNewUnavailability({ date: '', startTime: '', endTime: '', reason: '' });
        setShowAddDialog(false);
        fetchUnavailabilities();
      }
    } catch (error) {
      console.error('Error adding unavailability:', error);
    }
  };

  const handleDeleteUnavailability = async (unavailabilityId: string) => {
    try {
      const response = await fetch(`${baseUrl}/unavailabilities/${nurseId}/${unavailabilityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        fetchUnavailabilities();
      }
    } catch (error) {
      console.error('Error deleting unavailability:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isFutureOrToday = (dateStr: string) => {
    const date = new Date(dateStr);
    // Simulated current date - Wednesday, February 18, 2026 (updated to today's date in prompt)
    const today = new Date('2026-02-18');
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const futureUnavailabilities = unavailabilities.filter(u => isFutureOrToday(u.date));
  const pastUnavailabilities = unavailabilities.filter(u => !isFutureOrToday(u.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-900">{t('unavailability.title')}</h3>
          <p className="text-sm text-gray-600">{t('unavailability.desc')}</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('unavailability.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('unavailability.new_title')}</DialogTitle>
              <DialogDescription>
                {t('unavailability.new_desc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="date">{t('unavailability.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  min={getMinDate()}
                  value={newUnavailability.date}
                  onChange={(e) => setNewUnavailability({ ...newUnavailability, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">{t('unavailability.start_time')}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newUnavailability.startTime}
                    onChange={(e) => setNewUnavailability({ ...newUnavailability, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">{t('unavailability.end_time')}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newUnavailability.endTime}
                    onChange={(e) => setNewUnavailability({ ...newUnavailability, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="reason">{t('unavailability.reason')} (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder={t('unavailability.reason_placeholder')}
                  value={newUnavailability.reason}
                  onChange={(e) => setNewUnavailability({ ...newUnavailability, reason: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddUnavailability}>
                  {t('unavailability.add')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Future unavailabilities */}
          {futureUnavailabilities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm text-gray-700">{t('unavailability.upcoming')}</h4>
              {futureUnavailabilities.map((unavailability) => (
                <Card key={unavailability.id} className="border-orange-200 bg-orange-50/30">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-4 w-4 text-orange-600" />
                          <span className="text-gray-900">{formatDate(unavailability.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-gray-700">
                            {unavailability.startTime} - {unavailability.endTime}
                          </span>
                        </div>
                        {unavailability.reason && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-600">{unavailability.reason}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUnavailability(unavailability.id)}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Past unavailabilities */}
          {pastUnavailabilities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm text-gray-500">{t('unavailability.past')}</h4>
              {pastUnavailabilities.map((unavailability) => (
                <Card key={unavailability.id} className="opacity-60">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatDate(unavailability.date)}</span>
                        <span>•</span>
                        <span>{unavailability.startTime} - {unavailability.endTime}</span>
                        {unavailability.reason && (
                          <>
                            <span>•</span>
                            <span>{unavailability.reason}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {unavailabilities.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">{t('unavailability.none')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('unavailability.none_desc')}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
