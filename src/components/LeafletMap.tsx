'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// ═══ Brand colors ═══
const BRAND_COLOR = '#c5a643';
const INK_COLOR = '#1a1a1a';

// ═══ Fix Leaflet default icon paths (webpack/turbopack issue) ═══
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface ScanMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  location: string | null;
  city: string | null;
  country: string | null;
  context: string;
  scannedAt: string;
  finderName: string | null;
}

interface LeafletMapProps {
  scans: ScanMapPoint[];
  destination: string | null;
}

// Context colors for markers
const CONTEXT_MARKER_COLORS: Record<string, string> = {
  departure_airport_urgent: '#EF4444',
  arrival_airport: '#22c55e',
  in_transit: '#3b82f6',
  static_location: BRAND_COLOR,
};

function createCircleIcon(color: string, number: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="${color}" stroke="${INK_COLOR}" stroke-width="2.5"/>
    <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="system-ui">${number}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function LeafletMap({ scans, destination }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Points with coordinates, reversed (most recent last for line drawing)
    const points = scans
      .filter((s) => s.latitude && s.longitude)
      .reverse(); // oldest first

    if (points.length === 0) return;

    // Destroy previous map
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution in bottom-right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OpenStreetMap')
      .addTo(map);

    // Draw trajectory line (oldest → newest)
    if (points.length >= 2) {
      const latlngs = points.map((p) => [p.latitude, p.longitude] as [number, number]);
      L.polyline(latlngs, {
        color: INK_COLOR,
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 8',
        lineCap: 'round',
      }).addTo(map);
    }

    // Add markers (numbered, newest = biggest)
    const totalPoints = points.length;
    points.forEach((point, idx) => {
      const num = idx + 1;
      const color = CONTEXT_MARKER_COLORS[point.context] || BRAND_COLOR;
      const isLatest = idx === totalPoints - 1;
      const size = isLatest ? 44 : 36;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="${INK_COLOR}" stroke-width="2.5"/>
        <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" fill="white" font-size="${isLatest ? 16 : 13}" font-weight="bold" font-family="system-ui">${num}</text>
      </svg>`;

      const icon = L.divIcon({
        html: svg,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });

      const loc = point.location || point.city || point.country || 'Position inconnue';
      const dateStr = new Date(point.scannedAt).toLocaleString('fr-FR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });

      const contextLabels: Record<string, string> = {
        departure_airport_urgent: '🛫 Départ',
        arrival_airport: '🛬 Arrivée',
        in_transit: '🔄 En transit',
        static_location: '📍 Position',
      };
      const contextLabel = contextLabels[point.context] || '📍 Scan';

      L.marker([point.latitude, point.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:160px">
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px">${contextLabel}</div>
            <div style="font-size:12px;color:#1a1a1a">${loc}</div>
            ${point.finderName ? `<div style="font-size:11px;color:#666;margin-top:2px">👤 ${point.finderName}</div>` : ''}
            <div style="font-size:11px;color:#999;margin-top:4px">🕐 ${dateStr}</div>
          </div>`,
          { className: '' }
        );
    });

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [scans]);

  if (scans.filter((s) => s.latitude && s.longitude).length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#c5a643]/10 rounded-xl">
        <p className="text-sm text-[#1a1a1a]/60 text-center px-4">
          📍 Aucune position GPS disponible pour afficher la carte
        </p>
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full rounded-xl" />
    </>
  );
}