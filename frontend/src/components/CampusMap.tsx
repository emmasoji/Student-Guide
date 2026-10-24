import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Place, Route, UserLocation, MapData } from '../types';

interface Props {
  mapData: MapData | null;
  selectedPlace: Place | null;
  route: Route | null;
  userLocation: UserLocation | null;
  onSelectPlace: (id: string) => void;
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  gate: '#c53030',
  lecture_hall: '#2b6cb0',
  laboratory: '#276749',
  library: '#6b46c1',
  cafeteria: '#c05621',
  hostel: '#2c7a7b',
  administrative: '#1e3a5f',
  facility: '#4a5568',
};

export function CampusMap({
  mapData,
  selectedPlace,
  route,
  userLocation,
  onSelectPlace,
  flyTo,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeSourceId = 'route-line';

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [3.37414, 6.51873],
      zoom: 16.5,
      maxBounds: [
        [3.368, 6.513],
        [3.381, 6.525],
      ],
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1e3a5f',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Markers for places
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapData) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mapData.places.forEach((p) => {
      const el = document.createElement('button');
      el.className = 'campus-marker';
      el.setAttribute('aria-label', p.name);
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${CATEGORY_COLORS[p.category] || '#4a5568'};
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        cursor: pointer; padding: 0; display: flex;
        align-items: center; justify-content: center;
      `;
      if (selectedPlace?.id === p.id) {
        el.style.width = '34px';
        el.style.height = '34px';
        el.style.borderWidth = '3px';
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16, closeButton: true }).setHTML(
            `<div style="padding:10px 12px;min-width:140px">
              <div style="font-weight:600;font-size:13px;color:#1a202c">${p.name}</div>
              <div style="font-size:11px;color:#718096;margin-top:2px;text-transform:capitalize">${p.category.replace('_', ' ')}</div>
              ${!p.verified ? '<div style="font-size:10px;color:#c05621;margin-top:4px">Approximate location</div>' : ''}
            </div>`
          )
        )
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPlace(p.id);
      });

      markersRef.current.push(marker);
    });
  }, [mapData, selectedPlace, onSelectPlace]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    const el = document.createElement('div');
    el.style.cssText = `
      width: 18px; height: 18px; border-radius: 50%;
      background: #2b6cb0; border: 3px solid white;
      box-shadow: 0 0 0 2px #2b6cb0, 0 1px 4px rgba(0,0,0,0.3);
    `;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

  // Route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource(routeSourceId) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (!route || !route.geometry.length) {
      source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
      return;
    }
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route.geometry },
    });

    // Fit bounds to route
    const bounds = new maplibregl.LngLatBounds();
    route.geometry.forEach((c) => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 800 });
  }, [route]);

  // Fly to target
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 17.5,
      duration: 900,
    });
  }, [flyTo]);

  const goToUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 17.5,
        duration: 800,
      });
    }
  }, [userLocation]);

  // Expose goToUser via a custom event or just leave for parent controls
  useEffect(() => {
    (window as any).__yabatechGoToUser = goToUser;
  }, [goToUser]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full" />
  );
}
