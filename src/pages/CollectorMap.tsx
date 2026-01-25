import { useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import L from 'leaflet';
import { LeafletMap } from '@/components/maps/LeafletMap';
import { wasteLogs, salons } from '@/data/mockData';

// Custom icons
const createIcon = (color: string) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const userIcon = createIcon('#3B82F6');
const salonIcon = createIcon('#EF4444');

const CollectorMap = () => {
  const { language } = useLanguage();

  // User location (simulated - Dhaka)
  const userLocation: [number, number] = [23.7591, 90.3805];

  const pendingLogs = wasteLogs.filter(log => log.status === 'pending');

  const getSalonCoords = useCallback((salonId: string): [number, number] => {
    const salon = salons.find(s => s.id === salonId);
    return salon ? [salon.lat, salon.lng] : userLocation;
  }, []);

  const getSalonDetails = useCallback((salonId: string) => {
    return salons.find(s => s.id === salonId);
  }, []);

  const routeCoords = useMemo(() => {
    const coords: [number, number][] = [userLocation];
    pendingLogs.forEach(log => {
      coords.push(getSalonCoords(log.salonId));
    });
    return coords;
  }, [pendingLogs, getSalonCoords]);

  const mapMarkers = useMemo(() => {
    const markers = [
      {
        id: 'collector',
        position: userLocation,
        icon: userIcon,
        popupHtml: `<div style="text-align:center"><strong>${
          language === 'en' ? 'Your Location' : 'আপনার অবস্থান'
        }</strong></div>`,
      },
    ];

    pendingLogs.forEach((log) => {
      const coords = getSalonCoords(log.salonId);
      const salon = getSalonDetails(log.salonId);
      markers.push({
        id: log.id,
        position: coords,
        icon: salonIcon,
        popupHtml: `<div style="padding:2px 4px"><div style="font-weight:600">${
          salon?.name ?? ''
        }</div><div style="opacity:.75;font-size:12px">${log.weight} Kg</div></div>`,
      });
    });

    return markers;
  }, [language, pendingLogs, getSalonCoords, getSalonDetails]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-screen">
      {/* Header */}
      <div className="p-4 bg-background">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Collection Routes' : 'সংগ্রহ রুট'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? `${pendingLogs.length} pending pickups` 
              : `${pendingLogs.length}টি বকেয়া পিকআপ`}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <LeafletMap
          className="h-full w-full absolute inset-0"
          center={userLocation}
          zoom={12}
          markers={mapMarkers}
          polyline={{ positions: routeCoords, color: '#047857', weight: 3, dashArray: '10, 10' }}
        />
      </div>
    </div>
  );
};

export default CollectorMap;

