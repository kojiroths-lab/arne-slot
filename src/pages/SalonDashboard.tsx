import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Wallet, Plus, Calendar, Weight, TrendingUp, 
  CheckCircle2, Image as ImageIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';

const SalonDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogsAndPickups = async () => {
      if (!user?.id) return;

      const [{ data: logData, error: logError }, { data: salonRow }] = await Promise.all([
        supabase
          .from('salon_weekly_logs')
          .select('*')
          .eq('salon_id', user.id)
          .order('week_start_date', { ascending: false }),
        supabase
          .from('salons')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle(),
      ]);

      if (!logError && logData) {
        setLogs(logData);
      }

      if (salonRow?.id) {
        const { data: pickupData } = await supabase
          .from('collector_pickups')
          .select('*')
          .eq('salon_id', salonRow.id)
          .order('created_at', { ascending: false });

        if (pickupData) {
          setPickups(pickupData);
        }
      }
    };

    fetchLogsAndPickups();
  }, [user?.id]);

  const completedPickups = pickups.filter((p) => p.status === 'completed');

  const totalKg = completedPickups.reduce(
    (sum, pickup) => sum + (Number(pickup.quantity_kg) || 0),
    0
  );

  const totalEarnings = totalKg * 50;

  const weeklySupplyData = completedPickups
    .map((pickup) => ({
      day: pickup.completed_at || pickup.scheduled_at || pickup.created_at,
      kg: Number(pickup.quantity_kg) || 0,
    }))
    .reverse();

  const handleUpdateLocation = async () => {
    if (!user?.id || typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationMessage(
        language === 'en'
          ? 'Location services not available on this device.'
          : 'এই ডিভাইসে লোকেশন সার্ভিস চালু নয়।'
      );
      return;
    }

    setUpdatingLocation(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { data: salonRow } = await supabase
          .from('salons')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (!salonRow?.id) {
          setLocationMessage(
            language === 'en'
              ? 'No salon profile found to update.'
              : 'আপডেট করার জন্য কোনো সেলুন প্রোফাইল পাওয়া যায়নি।'
          );
          setUpdatingLocation(false);
          return;
        }

        const { error } = await supabase
          .from('salons')
          .update({ lat: latitude, lng: longitude })
          .eq('id', salonRow.id);

        if (error) {
          setLocationMessage(
            language === 'en'
              ? 'Failed to update shop location.'
              : 'দোকানের অবস্থান আপডেট করা যায়নি।'
          );
        } else {
          setLocationMessage(
            language === 'en'
              ? 'Shop location updated successfully.'
              : 'দোকানের অবস্থান সফলভাবে আপডেট হয়েছে।'
          );
        }

        setUpdatingLocation(false);
      },
      () => {
        setUpdatingLocation(false);
        setLocationMessage(
          language === 'en'
            ? 'Could not access GPS location.'
            : 'জিপিএস অবস্থান পাওয়া যায়নি।'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
      }
    );
  };

  const incomeGrowthData = completedPickups
    .map((pickup) => ({
      month: pickup.completed_at || pickup.scheduled_at || pickup.created_at,
      bdt: (Number(pickup.quantity_kg) || 0) * 50,
    }))
    .reverse();

  const handleSubmit = async () => {
    if (!user?.id || !weight || !date) return;

    const weightValue = Number(weight) || 0;
    const incomeValue = weightValue * 50; // 1 kg = 50 BDT

    let photoUrl: string | null = null;

    if (photoFile) {
      const filePath = `${user.id}/${Date.now()}_${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('salon-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('salon-photos')
          .getPublicUrl(filePath);
        photoUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('salon_weekly_logs')
      .insert({
        salon_id: user.id,
        week_start_date: date,
        waste_kg: weightValue,
        supply_cost: 0,
        income: incomeValue,
        photo_url: photoUrl,
      })
      .select('*')
      .single();

    if (!error && data) {
      setLogs(current => [data, ...current]);
      // Also create a pending pickup entry for collectors
      const { data: salonRow } = await supabase
        .from('salons')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (salonRow?.id) {
        const { data: pickupRow } = await supabase
          .from('collector_pickups')
          .insert({
            salon_id: salonRow.id,
            status: 'pending',
            quantity_kg: weightValue,
            scheduled_at: date,
            notes: null,
          })
          .select('*')
          .single();

        if (pickupRow) {
          setPickups((current) => [pickupRow, ...current]);
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsDrawerOpen(false);
        setWeight('');
        setPhotoFile(null);
      }, 2000);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {t('welcome')}, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Your salon dashboard' : 'আপনার সেলুন ড্যাশবোর্ড'}
        </p>
      </div>

      <div className="flex flex-col gap-2 animate-fade-up">
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={handleUpdateLocation}
          disabled={updatingLocation}
        >
          {updatingLocation
            ? language === 'en'
              ? 'Updating shop location...'
              : 'দোকানের অবস্থান আপডেট হচ্ছে...'
            : language === 'en'
            ? '📍 Update Shop Location'
            : '📍 দোকানের অবস্থান আপডেট করুন'}
        </Button>
        {locationMessage && (
          <p className="text-xs text-muted-foreground text-center">{locationMessage}</p>
        )}
      </div>

      {/* Earnings Card */}
      <div className="earnings-card animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('totalEarnings')}</p>
              <h2 className="text-3xl font-bold">
                {t('bdt')} {totalEarnings.toLocaleString()}
              </h2>
            </div>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/30">
            {totalKg.toFixed(1)} {t('kg')}
          </Badge>
        </div>
        <p className="text-white/70 text-sm">
          {language === 'en' 
            ? `Earning ৳50 per kg of waste supplied` 
            : `প্রতি কেজি বর্জ্য সরবরাহে ৳৫০ আয়`}
        </p>
      </div>

      {/* Log Waste Button */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button size="lg" className="w-full gap-2">
            <Plus className="h-5 w-5" />
            {t('logWaste')}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('logWaste')}</DrawerTitle>
            <DrawerDescription>
              {language === 'en' ? 'Record your daily waste collection' : 'আপনার দৈনিক বর্জ্য সংগ্রহ রেকর্ড করুন'}
            </DrawerDescription>
          </DrawerHeader>
          
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-20 w-20 rounded-full bg-success flex items-center justify-center mb-4 animate-scale-in">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{t('success')}!</h3>
              <p className="text-muted-foreground">
                {language === 'en' ? 'Waste logged successfully' : 'বর্জ্য সফলভাবে লগ করা হয়েছে'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">{t('weight')}</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className="pl-10"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">{language === 'en' ? 'Income (BDT)' : 'আয় (টাকা)'}</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="0"
                  value={weight ? (Number(weight) || 0) * 50 : 0}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('date')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">{language === 'en' ? 'Upload Photo' : 'ছবি আপলোড করুন'}</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-muted-foreground hover:border-primary transition-colors">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                    <ImageIcon className="h-4 w-4" />
                    <span>
                      {language === 'en'
                        ? 'Choose a photo of collected hair waste'
                        : 'সংগ্রহিত চুলের বর্জ্যের ছবি নির্বাচন করুন'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            {!showSuccess && (
              <>
                <Button onClick={handleSubmit} disabled={!weight}>
                  {t('submit')}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">{t('cancel')}</Button>
                </DrawerClose>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Weekly Supply Chart */}
        <Card className="shadow-card animate-fade-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Weight className="h-4 w-4 text-primary" />
              {t('weeklySupply')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklySupplyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Bar dataKey="kg" fill="hsl(160, 84%, 18%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income Growth Chart */}
        <Card className="shadow-card animate-fade-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-earnings" />
              {t('incomeGrowth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={incomeGrowthData}>
                <defs>
                  <linearGradient id="colorBdt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="bdt" 
                  stroke="hsl(43, 96%, 56%)" 
                  fill="url(#colorBdt)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="shadow-card animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base">{t('history')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pickups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {language === 'en' ? 'No logs yet' : 'এখনো কোনো লগ নেই'}
            </p>
          ) : (
            pickups.slice(0, 5).map((pickup) => (
              <div
                key={pickup.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-success/10">
                    <Weight className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {Number(pickup.quantity_kg || 0)} {t('kg')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pickup.completed_at || pickup.scheduled_at || pickup.created_at}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {t('bdt')} {(Number(pickup.quantity_kg || 0) * 50).toFixed(0)}
                  </p>
                  <p className="text-xs">
                    {pickup.status === 'completed'
                      ? language === 'en'
                        ? 'Completed'
                        : 'সম্পন্ন'
                      : language === 'en'
                        ? 'Pending'
                        : 'বকেয়া'}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalonDashboard;
