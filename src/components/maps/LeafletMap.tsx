import { useEffect, useRef } from "react";
import L from "leaflet";

export type LeafletLatLng = [number, number];

export type LeafletMarker = {
  id: string;
  position: LeafletLatLng;
  /** Raw HTML string for popup body. Keep it simple and trusted (no user-generated HTML). */
  popupHtml?: string;
  /** Optional Leaflet icon instance (e.g., L.divIcon / L.icon) */
  icon?: L.Icon | L.DivIcon;
  /** Optional click handler invoked when the marker is clicked */
  onClick?: () => void;
};

type Props = {
  className?: string;
  center: LeafletLatLng;
  zoom: number;
  markers?: LeafletMarker[];
  /** Optional bounds to fit (e.g. full route). When provided, map will fit these and NOT force center/zoom otherwise. */
  fitBounds?: LeafletLatLng[];
  polyline?: {
    positions: LeafletLatLng[];
    color?: string;
    weight?: number;
    dashArray?: string;
  };
};

/**
 * A tiny Leaflet wrapper (no react-leaflet) to avoid runtime issues caused by Context consumers.
 */
export function LeafletMap({ className, center, zoom, markers = [], polyline, fitBounds }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<{ markers: L.LayerGroup; polyline?: L.Polyline } | null>(null);
  const prevFitBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    layerRef.current = { markers: markersLayer };
    mapRef.current = map;

    // Invalidate size after a short delay to ensure container is fully rendered
    const timeoutId = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle container resize and visibility changes
  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return;

    const map = mapRef.current;
    const container = containerRef.current;

    // Invalidate size when container becomes visible or resizes
    const invalidateSize = () => {
      if (mapRef.current) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        });
      }
    };

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(invalidateSize);
    resizeObserver.observe(container);

    // Also check visibility changes
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        invalidateSize();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // Initial invalidation
    invalidateSize();

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  // Fit bounds when requested (e.g. when a route is available).
  // This avoids fighting with user panning/zooming and only adjusts view explicitly.
  useEffect(() => {
    if (!mapRef.current || !fitBounds || fitBounds.length === 0) return;

    const serialized = JSON.stringify(fitBounds);
    if (prevFitBoundsRef.current === serialized) return;
    prevFitBoundsRef.current = serialized;

    try {
      const bounds = L.latLngBounds(fitBounds.map(([lat, lng]) => L.latLng(lat, lng)));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } catch {
      // Ignore bounds errors
    }
  }, [fitBounds]);

  // Update overlays (markers + polyline)
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    layerRef.current.markers.clearLayers();

    markers.forEach((m) => {
      const marker = L.marker(m.position, m.icon ? { icon: m.icon } : undefined);
      if (m.popupHtml) marker.bindPopup(m.popupHtml);
      if (m.onClick) {
        marker.on('click', () => {
          m.onClick && m.onClick();
        });
      }
      marker.addTo(layerRef.current!.markers);
    });

    if (layerRef.current.polyline) {
      layerRef.current.polyline.remove();
      layerRef.current.polyline = undefined;
    }

    if (polyline && polyline.positions.length > 1) {
      const line = L.polyline(polyline.positions, {
        color: polyline.color ?? "#047857",
        weight: polyline.weight ?? 3,
        dashArray: polyline.dashArray,
      });
      line.addTo(mapRef.current);
      layerRef.current.polyline = line;
    }
  }, [markers, polyline]);

  return <div ref={containerRef} className={className} style={{ minHeight: '100%', minWidth: '100%' }} />;
}
