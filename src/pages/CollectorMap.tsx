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

  // Compute nearest salon (by straight-line distance) and request OSRM route
  useEffect(() => {
    const buildRoute = async () => {
      if (!userLocation || pendingPickups.length === 0) {
        setRouteCoords([]);
        return;
      }

      const withCoords = pendingPickups.filter((p) => p.salons?.lat && p.salons?.lng);
      if (withCoords.length === 0) {
        setRouteCoords([]);
        return;
      }

      // Find nearest salon by haversine distance
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

      const destLat = nearest.salons.lat;
      const destLng = nearest.salons.lng;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        const coords: LeafletLatLng[] =
          json?.routes?.[0]?.geometry?.coordinates?.map((c: [number, number]) => [c[1], c[0]]) ?? [];
        if (coords.length > 0) {
          setRouteCoords(coords);
        } else {
          setRouteCoords([userLocation, [destLat, destLng]]);
        }
      } catch {
        setRouteCoords([userLocation, [destLat, destLng]]);
      }
    };

    buildRoute();
  }, [userLocation, pendingPickups]);

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
      });
    });

    return markers;
  }, [language, pendingPickups, userLocation]);

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
              ? `${pendingPickups.length} pending pickups`
              : `${pendingPickups.length}টি বকেয়া পিকআপ`}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
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
    </div>
  );
};

export default CollectorMap;

