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

const PIN_COLOR = '#426755';
const PIN_SELECTED = '#345544';

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=cb1_4tc5_1_8ba4483f280ab3a321bd5a9e`,
      center: [3.37414, 6.51873],
      zoom: 16.5,
      maxBounds: [
        [3.368, 6.513],
        [3.381, 6.525],
      ],
      attributionControl: false,
    });

    map.on('load', () => {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });
      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#426755',
          'line-width': 6,
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapData) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mapData.places.forEach((p) => {
  const isSelected = selectedPlace?.id === p.id;
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', p.name);
  el.textContent = p.name;
  el.style.cssText = `
    border: none;
    cursor: pointer;
    font-family: Inter, system-ui, sans-serif;
    font-size: ${isSelected ? '11px' : '10px'};
    font-weight: ${isSelected ? '600' : '500'};
    line-height: 1.2;
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 2px 6px;
    border-radius: 999px;
    background: ${isSelected ? '#426755' : '#f9f7ea'};
    color: ${isSelected ? '#f9f7ea' : '#161616'};
    box-shadow: 0 1px 2px rgba(0,0,0,0.18);
    border: 1px solid ${isSelected ? '#345544' : 'rgba(66,103,85,0.35)'};
  `;

  const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
    .setLngLat([p.lng, p.lat])
    .addTo(map);

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectPlace(p.id);
  });

  markersRef.current.push(marker);
});
  }, [mapData, selectedPlace, onSelectPlace]);

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
      background: #426755; border: 3px solid #f9f7ea;
      box-shadow: 0 0 0 2px #426755, 0 1px 4px rgba(0,0,0,0.3);
    `;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource(routeSourceId) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (!route || !route.geometry.length) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      });
      return;
    }

    source.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route.geometry },
    });

    const bounds = new maplibregl.LngLatBounds();
    route.geometry.forEach((c) => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 800 });
  }, [route]);

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

  useEffect(() => {
    (window as any).__yabatechGoToUser = goToUser;
    (window as any).__yabatechZoom = (delta: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.zoomTo(map.getZoom() + delta, { duration: 250 });
    };
    (window as any).__yabatechResetNorth = () => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ bearing: 0, pitch: 0, duration: 400 });
    };
  }, [goToUser]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
