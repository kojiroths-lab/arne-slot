import { useLanguage } from '@/contexts/LanguageContext';
import L from 'leaflet';
import { Store, Weight, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { salons } from '@/data/mockData';
import { LeafletMap } from '@/components/maps/LeafletMap';

// Custom salon icon
const salonIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #047857; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const AdminMap = () => {
  const { t, language } = useLanguage();

  // Center on Dhaka
  const centerPosition: [number, number] = [23.7691, 90.3905];

  const totalWaste = salons.reduce((sum, salon) => sum + salon.totalWaste, 0);
  const totalEarnings = salons.reduce((sum, salon) => sum + salon.totalEarnings, 0);

  const stats = [
    { 
      icon: Store, 
      value: salons.length, 
      labelEn: 'Partner Salons', 
      labelBn: 'পার্টনার সেলুন',
      color: 'text-primary'
    },
    { 
      icon: Weight, 
      value: `${totalWaste} Kg`, 
      labelEn: 'Total Waste', 
      labelBn: 'মোট বর্জ্য',
      color: 'text-secondary'
    },
    { 
      icon: TrendingUp, 
      value: `৳${totalEarnings.toLocaleString()}`, 
      labelEn: 'Distributed', 
      labelBn: 'বিতরিত',
      color: 'text-earnings'
    },
  ];

  const mapMarkers = salons.map((salon) => ({
    id: salon.id,
    position: [salon.lat, salon.lng] as [number, number],
    icon: salonIcon,
    popupHtml: `
      <div style="padding:6px; min-width:200px">
        <div style="font-weight:700; margin-bottom:4px">${
          language === 'en' ? salon.name : salon.nameBn
        }</div>
        <div style="opacity:.75; font-size:12px; margin-bottom:8px">${
          language === 'en' ? salon.address : salon.addressBn
        }</div>
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px">
          <span style="opacity:.75">${language === 'en' ? 'Total Waste:' : 'মোট বর্জ্য:'}</span>
          <strong>${salon.totalWaste} ${t('kg')}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px">
          <span style="opacity:.75">${language === 'en' ? 'Earnings:' : 'আয়:'}</span>
          <strong>৳${salon.totalEarnings.toLocaleString()}</strong>
        </div>
      </div>
    `,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-screen">
      {/* Header */}
      <div className="p-4 bg-background">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Operations Map' : 'অপারেশন মানচিত্র'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'All registered salon partners' 
              : 'সমস্ত নিবন্ধিত সেলুন অংশীদার'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {stats.map((stat) => (
            <Card key={stat.labelEn} className="shadow-card animate-fade-up">
              <CardContent className="p-3 text-center">
                <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'en' ? stat.labelEn : stat.labelBn}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 relative min-h-0">
        <LeafletMap className="h-full w-full absolute inset-0" center={centerPosition} zoom={11} markers={mapMarkers} />
      </div>
    </div>
  );
};

export default AdminMap;
