import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, MapPin, Weight, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';

interface SalonRow {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

interface PickupRow {
  id: string;
  salon_id: number;
  collector_id: string;
  status: 'pending' | 'completed';
  scheduled_at: string | null;
  completed_at: string | null;
  quantity_kg: number | null;
  notes: string | null;
  created_at: string;
}

const CollectorDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPickup, setSelectedPickup] = useState<PickupRow | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [salonRows, setSalonRows] = useState<SalonRow[]>([]);
  const [pickups, setPickups] = useState<PickupRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      const [{ data: salonsData }, { data: pendingData }, { data: completedData }] = await Promise.all([
        supabase.from('salons').select('id, name, address, phone'),
        // All pending pickups (collector_id may be null so any collector can see them)
        supabase
          .from('collector_pickups')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        // Completed pickups for this collector
        supabase
          .from('collector_pickups')
          .select('*')
          .eq('status', 'completed')
          .eq('collector_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (salonsData) setSalonRows(salonsData as SalonRow[]);
      const combined: PickupRow[] = [
        ...((pendingData as PickupRow[] | null) || []),
        ...((completedData as PickupRow[] | null) || []),
      ];
      setPickups(combined);
    };

    fetchData();
  }, [user?.id]);

  const pendingLogs = pickups.filter(p => p.status === 'pending');
  const collectedLogs = pickups.filter(p => p.status === 'completed');

  const getSalonDetails = useCallback(
    (salonId: number) => salonRows.find((s) => s.id === salonId),
    [salonRows]
  );

  const handleConfirmPickup = async () => {
    if (!selectedPickup || !actualWeight || !user?.id) return;

    const quantity = Number(actualWeight) || 0;

    const { error } = await supabase
      .from('collector_pickups')
      .update({
        status: 'completed',
        quantity_kg: quantity,
        completed_at: new Date().toISOString(),
        collector_id: user.id,
      })
      .eq('id', selectedPickup.id);

    if (error) return;

    setPickups((current) =>
      current.map((p) =>
        p.id === selectedPickup.id
          ? { ...p, status: 'completed', quantity_kg: quantity, completed_at: new Date().toISOString() }
          : p
      )
    );

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedPickup(null);
      setActualWeight('');
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] md:min-h-screen">
      {/* Header */}
      <div className="p-4 bg-background">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Collection Dashboard' : 'সংগ্রহ ড্যাশবোর্ড'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? `${pendingLogs.length} pending pickups` 
              : `${pendingLogs.length}টি বকেয়া পিকআপ`}
          </p>
        </div>
      </div>

      {/* Pickup List */}
      <div className="flex-1 p-4 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending" className="flex-1">
              {t('pendingPickups')} ({pendingLogs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              {t('completed')} ({collectedLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-0">
            {pendingLogs.map((log) => {
              const salon = getSalonDetails(log.salon_id);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{salon?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {salon?.address}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      <Weight className="h-3 w-3 mr-1" />
                      {log.quantity_kg ?? '-'} {t('kg')}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => window.open(`tel:${salon?.phone}`)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setSelectedPickup(log)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('confirmPickup')}
                    </Button>
                  </div>
                </div>
              );
            })}
            {pendingLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'en' ? 'No pending pickups!' : 'কোনো বকেয়া পিকআপ নেই!'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-0">
            {collectedLogs.slice(0, 5).map((log) => {
              const salon = getSalonDetails(log.salon_id);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-success/5"
                >
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{salon?.name}</p>
                    <p className="text-sm text-muted-foreground">{log.completed_at || log.created_at}</p>
                  </div>
                  <Badge className="bg-success/10 text-success hover:bg-success/20">
                    {log.quantity_kg ?? '-'} {t('kg')}
                  </Badge>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Pickup Dialog */}
      <Dialog open={!!selectedPickup} onOpenChange={() => !showSuccess && setSelectedPickup(null)}>
        <DialogContent>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-20 w-20 rounded-full bg-success flex items-center justify-center mb-4 animate-scale-in">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{t('success')}!</h3>
              <p className="text-muted-foreground">
                {language === 'en' ? 'Pickup confirmed successfully' : 'পিকআপ সফলভাবে নিশ্চিত করা হয়েছে'}
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('confirmPickup')}</DialogTitle>
                <DialogDescription>
                  {language === 'en' ? 'Enter the actual weight collected' : 'সংগৃহীত প্রকৃত ওজন লিখুন'}
                </DialogDescription>
              </DialogHeader>
              
              {selectedPickup && (
                <div className="space-y-4 py-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="font-semibold">{getSalonDetails(selectedPickup.salon_id)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Expected weight:' : 'প্রত্যাশিত ওজন:'} {selectedPickup.quantity_kg ?? '-'} {t('kg')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actualWeight">{t('actualWeight')}</Label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="actualWeight"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        className="pl-10"
                        value={actualWeight}
                        onChange={(e) => setActualWeight(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPickup(null)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleConfirmPickup} disabled={!actualWeight}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('confirmPickup')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectorDashboard;

