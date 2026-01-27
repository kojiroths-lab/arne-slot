import { useMemo, useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import L from 'leaflet';
import { LeafletMap, LeafletLatLng } from '@/components/maps/LeafletMap';
import { supabase } from '@/lib/supabaseClient';

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
  const [userLocation, setUserLocation] = useState<LeafletLatLng | null>(null);
  const [pendingPickups, setPendingPickups] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<LeafletLatLng[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null);
  const [routeStats, setRouteStats] = useState<{ duration: number; distance: number } | null>(null);

  // Load pending pickups with joined salon data
  useEffect(() => {
    const fetchPickups = async () => {
      const { data, error } = await supabase
        .from('collector_pickups')
        .select('id, quantity_kg, salon_id, salons (id, name, address, lat, lng)')
        .eq('status', 'pending');

      if (!error && data) {
        setPendingPickups(data as any[]);
      } else {
        setPendingPickups([]);
      }
    };

    fetchPickups();
  }, []);

  // Track live collector location
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      // Fallback to central Dhaka if geolocation unavailable
      setUserLocation([23.7591, 90.3805]);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
      },
      () => {
        // On error keep previous or fallback
        if (!userLocation) {
          setUserLocation([23.7591, 90.3805]);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );

    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: build OSRM route and stats to a specific pickup
  const buildRouteToPickup = useCallback(
    async (pickup: any) => {
      if (!userLocation || !pickup?.salons?.lat || !pickup?.salons?.lng) {
        setRouteCoords([]);
        setRouteStats(null);
        return;
      }

      const [uLat, uLng] = userLocation;
      const destLat = pickup.salons.lat;
      const destLng = pickup.salons.lng;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        const coords: LeafletLatLng[] =
          json?.routes?.[0]?.geometry?.coordinates?.map((c: [number, number]) => [c[1], c[0]]) ?? [];

        const duration = json?.routes?.[0]?.duration ?? 0; // seconds
        const distance = json?.routes?.[0]?.distance ?? 0; // meters
        setRouteStats({ duration, distance });

        if (coords.length > 0) {
          setRouteCoords(coords);
        } else {
          setRouteCoords([userLocation, [destLat, destLng]]);
        }
      } catch {
        setRouteCoords([userLocation, [destLat, destLng]]);
        setRouteStats(null);
      }
    },
    [userLocation],
  );

  // Compute nearest salon (by straight-line distance) on load and request OSRM route
  useEffect(() => {
    if (!userLocation || pendingPickups.length === 0) {
      setRouteCoords([]);
      setRouteStats(null);
      setSelectedPickup(null);
      return;
    }

    const withCoords = pendingPickups.filter((p) => p.salons?.lat && p.salons?.lng);
    if (withCoords.length === 0) {
      setRouteCoords([]);
      setRouteStats(null);
      setSelectedPickup(null);
      return;
    }

    // If a pickup is already selected, keep it; otherwise choose nearest
    if (selectedPickup?.salons?.lat && selectedPickup?.salons?.lng) {
      buildRouteToPickup(selectedPickup);
      return;
    }

    const [uLat, uLng] = userLocation;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const distance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371e3;
      const phi1 = toRad(lat1);
      const phi2 = toRad(lat2);
      const dPhi = toRad(lat2 - lat1);
      const dLambda = toRad(lng2 - lng1);
      const a =
        Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let nearest = withCoords[0];
    let bestDist = distance(uLat, uLng, withCoords[0].salons.lat, withCoords[0].salons.lng);
    for (let i = 1; i < withCoords.length; i++) {
      const s = withCoords[i];
      const d = distance(uLat, uLng, s.salons.lat, s.salons.lng);
      if (d < bestDist) {
        bestDist = d;
        nearest = s;
      }
    }

    setSelectedPickup(nearest);
    buildRouteToPickup(nearest);
  }, [userLocation, pendingPickups, selectedPickup, buildRouteToPickup]);

  const mapMarkers = useMemo(() => {
    const markers: any[] = [];

    if (userLocation) {
      markers.push({
        id: 'collector',
        position: userLocation,
        icon: userIcon,
        popupHtml: `<div style="text-align:center"><strong>${
          language === 'en' ? 'Your Location' : 'আপনার অবস্থান'
        }</strong></div>`,
      });
    }

    pendingPickups.forEach((pickup) => {
      const salon = pickup.salons;
      if (!salon?.lat || !salon?.lng) return;

      const pendingKg = Number(pickup.quantity_kg) || 0;
      const destLat = salon.lat;
      const destLng = salon.lng;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

      markers.push({
        id: pickup.id,
        position: [destLat, destLng] as LeafletLatLng,
        icon: salonIcon,
        popupHtml: `
          <div style="padding:4px 6px; font-size:12px; max-width:180px;">
            <div style="font-weight:600; margin-bottom:2px;">${salon.name || ''}</div>
            <div style="opacity:.75; margin-bottom:2px;">${pendingKg.toFixed(1)} Kg pending</div>
            <div style="opacity:.7; margin-bottom:4px;">${salon.address || ''}</div>
            <a href="${mapsUrl}" target="_blank" rel="noreferrer" style="display:inline-block;padding:4px 8px;border-radius:999px;background:#16a34a;color:white;text-decoration:none;">
              ${language === 'en' ? 'Navigate' : 'নেভিগেট করুন'}
            </a>
          </div>
        `,
        onClick: () => {
          setSelectedPickup(pickup);
          buildRouteToPickup(pickup);
        },
      });
    });

    return markers;
  }, [language, pendingPickups, userLocation, buildRouteToPickup]);

  const durationMinutes = routeStats ? Math.round(routeStats.duration / 60) : null;
  const distanceKm = routeStats ? (routeStats.distance / 1000).toFixed(1) : null;

  const currentSalon = selectedPickup?.salons;
  const currentPendingKg = selectedPickup ? Number(selectedPickup.quantity_kg) || 0 : 0;
  const mapsUrl = currentSalon
    ? `https://www.google.com/maps/dir/?api=1&destination=${currentSalon.lat},${currentSalon.lng}`
    : null;

  return (
    <div className="relative flex flex-col h-[calc(100vh-8rem)] md:h-screen bg-background">
      {/* Header */}
      <div className="p-4 bg-background z-10">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Collection Routes' : 'সংগ্রহ রুট'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en'
              ? `${pendingPickups.length} pending pickups`
              : `${pendingPickups.length}টি বকেয়া পিকআপ`}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0 pb-[220px]">
        {userLocation && (
          <LeafletMap
            className="h-full w-full absolute inset-0"
            center={userLocation}
            zoom={13}
            markers={mapMarkers}
            polyline={{ positions: routeCoords, color: '#047857', weight: 4 }}
          />
        )}
      </div>

      {/* Bottom Sheet - Live Route Dashboard */}
      {currentSalon && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-3 pb-4">
          <div className="mx-auto max-w-3xl rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border border-border pt-3 px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {language === 'en' ? 'Next Stop' : 'পরবর্তী গন্তব্য'}
              </p>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-3 truncate">
              {currentSalon.name || (language === 'en' ? 'Selected Salon' : 'নির্বাচিত সেলুন')}
            </h2>

            {/* Big stats row */}
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  {/* Simple truck/van glyph */}
                  <span className="text-lg">🚚</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'ETA' : 'আনুমানিক সময়'}
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    {durationMinutes !== null ? `${durationMinutes} min` : language === 'en' ? '—' : '—'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'Distance' : 'দূরত্ব'}
                </p>
                <p className="text-base font-semibold text-muted-foreground">
                  {distanceKm !== null ? `${distanceKm} km` : language === 'en' ? '—' : '—'}
                </p>
              </div>
            </div>

            {/* Details row */}
            <div className="mb-3 space-y-1 text-sm">
              <p className="text-foreground line-clamp-2">
                {currentSalon.address || (language === 'en' ? 'No address available' : 'ঠিকানা পাওয়া যায়নি')}
              </p>
              <p className="text-muted-foreground">
                {language === 'en'
                  ? `Pending: ${currentPendingKg.toFixed(1)} kg`
                  : `বকেয়া: ${currentPendingKg.toFixed(1)} কেজি`}
              </p>
            </div>

            {/* Action button */}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full"
              >
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
                >
                  <span>📍</span>
                  {language === 'en' ? 'Navigate (Google Maps)' : 'গুগল ম্যাপসে নেভিগেট করুন'}
                </button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorMap;

