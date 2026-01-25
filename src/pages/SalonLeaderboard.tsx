import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Weight } from 'lucide-react';

interface LeaderboardEntry {
  salonId: string;
  name: string;
  totalKg: number;
}

const SalonLeaderboard = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // 1) Load all salons (demo + real) and start with their base week kg
      const { data: salons, error: salonsError } = await supabase
        .from('salons')
        .select('id, profile_id, name, week1_kg, week2_kg, week3_kg, week4_kg');

      if (salonsError || !salons) {
        setEntries([]);
        return;
      }

      // We rank by salon row id, but keep a mapping from profile_id -> salon id
      const profileIdToSalonId = new Map<string, string>();
      const nameBySalonId = new Map<string, string>();
      const totals = new Map<string, number>(); // key: salon row id

      salons.forEach((salon: any) => {
        const salonId = String(salon.id);
        const baseTotal =
          (Number(salon.week1_kg) || 0) +
          (Number(salon.week2_kg) || 0) +
          (Number(salon.week3_kg) || 0) +
          (Number(salon.week4_kg) || 0);

        nameBySalonId.set(salonId, salon.name || 'Salon');
        if (baseTotal > 0) {
          totals.set(salonId, (totals.get(salonId) || 0) + baseTotal);
        }

        if (salon.profile_id) {
          profileIdToSalonId.set(String(salon.profile_id), salonId);
        }
      });

      // 2) Add all logged waste_kg from salon_weekly_logs (keyed by profile id -> map to salon id)
      const { data: allLogs } = await supabase
        .from('salon_weekly_logs')
        .select('salon_id, waste_kg');

      (allLogs || []).forEach((log: any) => {
        const profileId = String(log.salon_id);
        const salonId = profileIdToSalonId.get(profileId);
        if (!salonId) return; // safety: skip logs we can't map
        const amount = Number(log.waste_kg) || 0;
        if (!amount) return;
        totals.set(salonId, (totals.get(salonId) || 0) + amount);
      });

      // 3) Add all quantities from collector_pickups (already keyed by salons.id)
      const { data: pickups } = await supabase
        .from('collector_pickups')
        .select('salon_id, quantity_kg');

      (pickups || []).forEach((pickup: any) => {
        const salonId = String(pickup.salon_id);
        const amount = Number(pickup.quantity_kg) || 0;
        if (!amount) return;
        totals.set(salonId, (totals.get(salonId) || 0) + amount);
      });

      const salonIds = Array.from(nameBySalonId.keys());
      if (salonIds.length === 0) {
        setEntries([]);
        return;
      }

      const result: LeaderboardEntry[] = salonIds.map((id) => ({
        salonId: id,
        name: nameBySalonId.get(id) || 'Salon',
        totalKg: totals.get(id) || 0,
      }));

      // Sort all salons by total supplied (highest first) and show the full list
      result.sort((a, b) => b.totalKg - a.totalKg);
      setEntries(result);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Salon Leaderboard' : 'সেলুন লিডারবোর্ড'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'en'
              ? 'Top salons by total hair waste supplied.'
              : 'মোট সরবরাহকৃত চুলের বর্জ্যের ভিত্তিতে শীর্ষ সেলুনগুলো।'}
          </p>
        </div>
      </div>

      <Card className="shadow-card animate-fade-up">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {language === 'en' ? 'Salon Partners' : 'সেলুন পার্টনার'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'No data yet. When salons start logging waste, rankings will appear here.'
                : 'এখনো কোনো তথ্য নেই। সেলুনগুলো বর্জ্য লগ করা শুরু করলে এখানে র‍্যাঙ্কিং দেখা যাবে।'}
            </p>
          ) : (
            entries.map((entry, index) => (
              <div
                key={entry.salonId}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Weight className="h-3 w-3" />
                      {language === 'en' ? 'Total supplied' : 'মোট সরবরাহ'}:{' '}
                      {entry.totalKg.toFixed(1)} {t('kg')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalonLeaderboard;
