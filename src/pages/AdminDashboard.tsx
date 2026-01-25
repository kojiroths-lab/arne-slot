import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Leaf, Download, CircleDollarSign, Cloud } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalonRow {
  id: string;
  name: string;
  phone: string;
  week1_kg: number | null;
  week2_kg: number | null;
  week3_kg: number | null;
  week4_kg: number | null;
  totalCombined: number;
}

interface ProductStat {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const { language } = useLanguage();
  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState<'all' | 'month'>('all');
  const [productStats, setProductStats] = useState<ProductStat[]>([]);

  useEffect(() => {
    const fetchSalons = async () => {
      // 1) Load all salons (demo + real) and start with their base week kg
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('id, profile_id, name, phone, week1_kg, week2_kg, week3_kg, week4_kg');

      if (salonsError || !salonsData) {
        setSalons([]);
        setLoading(false);
        return;
      }

      const profileIdToSalonId = new Map<string, string>();
      const totals = new Map<string, number>(); // key: salon row id

      salonsData.forEach((salon: any) => {
        const salonId = String(salon.id);
        const baseTotal =
          (Number(salon.week1_kg) || 0) +
          (Number(salon.week2_kg) || 0) +
          (Number(salon.week3_kg) || 0) +
          (Number(salon.week4_kg) || 0);

        if (baseTotal > 0) {
          totals.set(salonId, (totals.get(salonId) || 0) + baseTotal);
        }

        if (salon.profile_id) {
          profileIdToSalonId.set(String(salon.profile_id), salonId);
        }
      });

      // 2) Add all logged waste_kg from salon_weekly_logs (keyed by profile id -> salon id)
      const { data: allLogs } = await supabase
        .from('salon_weekly_logs')
        .select('salon_id, waste_kg');

      (allLogs || []).forEach((log: any) => {
        const profileId = String(log.salon_id);
        const salonId = profileIdToSalonId.get(profileId);
        if (!salonId) return;
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

      setSalons(
        salonsData.map((row: any) => {
          const salonId = String(row.id);
          const baseTotal =
            (Number(row.week1_kg) || 0) +
            (Number(row.week2_kg) || 0) +
            (Number(row.week3_kg) || 0) +
            (Number(row.week4_kg) || 0);
          const combinedTotal = totals.get(salonId) ?? baseTotal;

          return {
            id: salonId,
            name: row.name || 'Salon',
            phone: row.phone || '',
            week1_kg: row.week1_kg,
            week2_kg: row.week2_kg,
            week3_kg: row.week3_kg,
            week4_kg: row.week4_kg,
            totalCombined: combinedTotal,
          } as SalonRow;
        })
      );

      // 4) Aggregate product sales from purchases + purchase_items for store analytics
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('id, purchased_at, purchase_items (product_name, quantity, unit_price)')
        .order('purchased_at', { ascending: false });

      if (purchasesData && Array.isArray(purchasesData)) {
        const productMap = new Map<string, { quantity: number; revenue: number }>();

        // Define current month window for filtering when timeRange === 'month'
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        (purchasesData || []).forEach((purchase: any) => {
          const purchasedAt = purchase.purchased_at ? new Date(purchase.purchased_at) : null;

          if (timeRange === 'month') {
            if (!purchasedAt || purchasedAt < monthStart || purchasedAt >= nextMonthStart) {
              return;
            }
          }

          (purchase.purchase_items || []).forEach((item: any) => {
            const name = item.product_name || 'Unknown';
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            if (!qty) return;

            const existing = productMap.get(name) || { quantity: 0, revenue: 0 };
            existing.quantity += qty;
            existing.revenue += qty * price;
            productMap.set(name, existing);
          });
        });

        const stats: ProductStat[] = Array.from(productMap.entries()).map(([name, value]) => ({
          name,
          totalQuantity: value.quantity,
          totalRevenue: value.revenue,
        }));

        stats.sort((a, b) => b.totalQuantity - a.totalQuantity);
        setProductStats(stats);
      } else {
        setProductStats([]);
      }

      setLoading(false);
    };

    fetchSalons();
  }, [timeRange]);

  const withTotals = useMemo(
    () =>
      salons.map((salon) => {
        const totalWaste = salon.totalCombined;
        return { ...salon, totalWaste };
      }),
    [salons]
  );

  const totalWaste = useMemo(
    () => withTotals.reduce((sum, s) => sum + s.totalWaste, 0),
    [withTotals]
  );
  const totalRevenue = totalWaste * 20;
  const activePartners = withTotals.length;
  const co2Saved = totalWaste * 2.5;

  const weeklyTrendData = useMemo(
    () => [
      {
        week: 'Week 1',
        kg: withTotals.reduce((sum, s) => sum + (Number(s.week1_kg) || 0), 0),
      },
      {
        week: 'Week 2',
        kg: withTotals.reduce((sum, s) => sum + (Number(s.week2_kg) || 0), 0),
      },
      {
        week: 'Week 3',
        kg: withTotals.reduce((sum, s) => sum + (Number(s.week3_kg) || 0), 0),
      },
      {
        week: 'Week 4',
        kg: withTotals.reduce((sum, s) => sum + (Number(s.week4_kg) || 0), 0),
      },
    ],
    [withTotals]
  );

  const topSalons = useMemo(
    () =>
      [...withTotals]
        .sort((a, b) => b.totalWaste - a.totalWaste)
        .slice(0, 5)
        .map((s) => ({ name: s.name, kg: s.totalWaste })),
    [withTotals]
  );

  const filteredPartners = useMemo(() => {
    const term = search.toLowerCase();
    return withTotals.filter((s) => s.name.toLowerCase().includes(term));
  }, [withTotals, search]);

  const productPieData = useMemo(
    () =>
      productStats.map((p) => ({
        name: p.name,
        value: p.totalQuantity,
      })),
    [productStats]
  );

  // Brighter, more distinct colors for product slices
  const productColors = [
    '#16a34a', // emerald
    '#22c55e',
    '#4ade80',
    '#a3e635',
    '#f59e0b',
    '#f97316',
    '#ef4444',
    '#3b82f6',
    '#6366f1',
    '#ec4899',
  ];

  const totalProductQuantity = useMemo(
    () => productStats.reduce((sum, p) => sum + p.totalQuantity, 0),
    [productStats]
  );

  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(
      `Salon Performance Report (${timeRange === 'all' ? 'All time' : 'This month'})`,
      14,
      18
    );

    doc.setFontSize(11);
    doc.text(`Total Waste: ${totalWaste.toFixed(1)} Kg`, 14, 28);
    doc.text(`Total Revenue: BDT ${totalRevenue.toFixed(0)}`, 14, 34);
    doc.text(`Active Partners: ${activePartners}`, 14, 40);
    doc.text(`CO2 Saved: ${co2Saved.toFixed(1)} Kg`, 14, 46);

    const top10 = [...withTotals]
      .sort((a, b) => b.totalWaste - a.totalWaste)
      .slice(0, 10);

    autoTable(doc, {
      startY: 54,
      head: [['Rank', 'Salon', 'Phone', 'Total Waste (Kg)']],
      body: top10.map((s, index) => [
        index + 1,
        s.name,
        s.phone,
        s.totalWaste.toFixed(1),
      ]),
    });

    // Add product sales summary table beneath salon rankings if we have data
    if (productStats.length > 0) {
      const topProducts = [...productStats]
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      // @ts-ignore lastAutoTable is added by jspdf-autotable
      const lastY = (doc as any).lastAutoTable?.finalY || 54;

      autoTable(doc, {
        startY: lastY + 10,
        head: [['Product', 'Total Qty', 'Revenue (BDT)']],
        body: topProducts.map((p) => [
          p.name,
          p.totalQuantity,
          p.totalRevenue.toFixed(0),
        ]),
      });
    }

    doc.save('salon-report.pdf');
  };

  const stats = [
    {
      icon: Users,
      value: activePartners,
      labelEn: 'Active Partners',
      labelBn: 'সক্রিয় পার্টনার',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: TrendingUp,
      value: `${totalWaste.toFixed(1)} Kg`,
      labelEn: 'Total Waste Collected',
      labelBn: 'মোট বর্জ্য সংগ্রহ',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: CircleDollarSign,
      value: `৳${totalRevenue.toFixed(0)}`,
      labelEn: 'Total Revenue',
      labelBn: 'মোট আয়',
      color: 'bg-success/10 text-success',
    },
    {
      icon: Leaf,
      value: `${co2Saved.toFixed(1)} Kg`,
      labelEn: 'CO₂ Saved',
      labelBn: 'সিও₂ সেভড',
      color: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === 'en' ? 'Admin Dashboard' : 'অ্যাডমিন ড্যাশবোর্ড'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Owner view of all salon partners and impact metrics.'
                : 'সমস্ত সেলুন পার্টনার এবং ইমপ্যাক্ট মেট্রিক্সের ওনার ভিউ।'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="inline-flex items-center rounded-full border bg-muted p-1 text-xs">
              <button
                type="button"
                className={`px-3 py-1 rounded-full transition-colors ${
                  timeRange === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setTimeRange('all')}
              >
                {language === 'en' ? 'All time' : 'সমস্ত সময়'}
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-full transition-colors ${
                  timeRange === 'month'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setTimeRange('month')}
              >
                {language === 'en' ? 'This month' : 'এই মাস'}
              </button>
            </div>
            <Button onClick={handleDownloadPdf} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {language === 'en' ? 'Download Report' : 'রিপোর্ট ডাউনলোড করুন'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.labelEn}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="shadow-card">
              <CardContent className="p-4 text-center space-y-2">
                <div
                  className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'en' ? stat.labelEn : stat.labelBn}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Weekly Trend */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Weekly Trend' : 'সাপ্তাহিক প্রবণতা'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyTrendData}>
                <defs>
                  <linearGradient id="weeklyKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 18%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 18%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kg"
                  stroke="hsl(160, 84%, 18%)"
                  fill="url(#weeklyKg)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Salons */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Top 5 Salons' : 'শীর্ষ ৫ সেলুন'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSalons} margin={{ top: 10, right: 10, left: 0, bottom: 70 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  height={70}
                  angle={-45}
                  textAnchor="end"
                  tickFormatter={(value: string) =>
                    value.length > 12 ? `${value.slice(0, 12)}...` : value
                  }
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="kg" fill="hsl(160, 84%, 18%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Store Analytics: Top Selling Products */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Top Selling Products' : 'সর্বাধিক বিক্রিত পণ্য'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {productStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'en'
                  ? 'No product sales data yet.'
                  : 'এখনো কোনো পণ্য বিক্রির ডেটা নেই।'}
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {productStats.map((p, index) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground truncate max-w-[160px]">
                          {p.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {language === 'en'
                            ? `Sold: ${p.totalQuantity} pcs`
                            : `বিক্রি: ${p.totalQuantity} পিস`}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-primary">
                      ৳{p.totalRevenue.toFixed(0)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              {language === 'en'
                ? 'Product Sales Distribution'
                : 'পণ্যের বিক্রির বন্টন'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'en'
                  ? 'No product sales data yet.'
                  : 'এখনো কোনো পণ্য বিক্রির ডেটা নেই।'}
              </p>
            ) : (
              <div className="flex flex-col md:flex-row gap-4 h-[300px]">
                {/* Donut chart */}
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        labelLine={false}
                        label={false}
                      >
                        {productPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={productColors[index % productColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: any, _name: any, props: any) => {
                          const qty = Number(value) || 0;
                          const percent = (props?.payload?.percent ?? 0) * 100;
                          return [
                            `${qty} pcs (${percent.toFixed(1)}%)`,
                            props?.payload?.name,
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom legend list */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[280px] text-sm pr-1">
                  {productStats.map((p, index) => {
                    const percent =
                      totalProductQuantity > 0
                        ? ((p.totalQuantity / totalProductQuantity) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <div
                        key={p.name}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                productColors[index % productColors.length],
                            }}
                          />
                          <span className="truncate" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                        <span className="flex-shrink-0 font-medium text-xs text-primary">
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Partner Performance Table */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">
            {language === 'en' ? 'Partner Performance' : 'পার্টনার পারফরম্যান্স'}
          </CardTitle>
          <Input
            placeholder={
              language === 'en' ? 'Search by salon name...' : 'সেলুনের নাম দিয়ে খুঁজুন...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              {language === 'en' ? 'Loading data...' : 'ডেটা লোড হচ্ছে...'}
            </p>
          ) : filteredPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {language === 'en' ? 'No partners found.' : 'কোনো পার্টনার পাওয়া যায়নি।'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-4">{language === 'en' ? 'Salon Name' : 'সেলুনের নাম'}</th>
                  <th className="py-2 pr-4">{language === 'en' ? 'Phone' : 'ফোন'}</th>
                  <th className="py-2 pr-4">{language === 'en' ? 'Total Waste' : 'মোট বর্জ্য'}</th>
                  <th className="py-2">{language === 'en' ? 'Status' : 'স্ট্যাটাস'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((s) => {
                  const isStar = s.totalWaste > 80;
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{s.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{s.phone}</td>
                      <td className="py-2 pr-4">{s.totalWaste.toFixed(1)} Kg</td>
                      <td className="py-2">
                        <Badge
                          className={
                            isStar
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {isStar
                            ? language === 'en'
                              ? 'Star Partner'
                              : 'স্টার পার্টনার'
                            : language === 'en'
                            ? 'Standard'
                            : 'স্ট্যান্ডার্ড'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
