import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  ChevronLeft,
  Heart,
  Maximize2,
  Minimize2,
  Navigation,
  MapPin,
  Info,
} from 'lucide-react';
import type { Place, Route, UserLocation } from '../types';
import { formatDistance, formatDuration } from '../lib/api';

const CARTO_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
interface Props {
  place: Place;
  route: Route | null;
  userLocation: UserLocation | null;
  navigating: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onClearRoute: () => void;
}

export function PlaceDetailModal({
  place,
  route,
  userLocation,
  navigating,
  onClose,
  onNavigate,
  onClearRoute,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  // Init / destroy map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: CARTO_STYLE,
      center: [place.lng, place.lat],
      zoom: 16.5,
      attributionControl: false,
      interactive: true,
    });

    map.on('load', () => {
      const el = document.createElement('div');
      el.innerHTML = `
        <svg viewBox="0 0 24 36" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path fill="#426755" stroke="#f9f7ea" stroke-width="1.5"
            d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
          <circle cx="12" cy="12" r="4.5" fill="#f9f7ea"/>
        </svg>
      `;
      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      map.addSource('detail-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });
      map.addLayer({
        id: 'detail-route-line',
        type: 'line',
        source: 'detail-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#426755',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [place.id, place.lat, place.lng]);

  // Draw / clear route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource('detail-route') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (route && route.geometry.length > 0) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route.geometry },
      });
      const bounds = new maplibregl.LngLatBounds();
      route.geometry.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 600 });
    } else {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      });
      map.flyTo({ center: [place.lng, place.lat], zoom: 16.5, duration: 500 });
    }
  }, [route, place.lat, place.lng]);

  // Resize when expand toggles
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.resize(), 50);
    return () => clearTimeout(t);
  }, [expanded]);

  const handleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      if (!route) onNavigate();
    } else {
      setExpanded(false);
      onClearRoute();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-surface">
      {/* MAP */}
      <div
        className={`relative shrink-0 overflow-hidden transition-all duration-300 ${
          expanded ? 'flex-1' : 'h-[42vh]'
        }`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        <button
          type="button"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
              onClearRoute();
            } else {
              onClose();
            }
          }}
          className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-surface shadow-elevated flex items-center justify-center"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-text" />
        </button>

        <button
          type="button"
          onClick={handleExpand}
          className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-surface shadow-elevated flex items-center justify-center"
          aria-label={expanded ? 'Collapse map' : 'Expand map and show route'}
        >
          {expanded ? (
            <Minimize2 className="w-5 h-5 text-forest" />
          ) : (
            <Maximize2 className="w-5 h-5 text-forest" />
          )}
        </button>
      </div>

      {/* DETAILS */}
      {!expanded && (
        <div className="flex-1 overflow-y-auto bg-surface">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-text leading-tight">{place.name}</h1>
              <p className="text-sm text-text-muted capitalize mt-1">
                {place.category.replace('_', ' ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className="w-10 h-10 rounded-full border border-surface-border flex items-center justify-center shrink-0"
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-5 h-5 ${liked ? 'fill-danger text-danger' : 'text-text-muted'}`}
              />
            </button>
          </div>

          <div className="px-4 flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium border border-forest/30 text-forest bg-forest/5">
              {place.category.replace('_', ' ')}
            </span>
            {place.verified ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-forest/30 text-forest bg-forest/5">
                Verified
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-danger/30 text-danger bg-danger/5">
                Approximate
              </span>
            )}
          </div>

          {place.description && (
            <div className="px-4 mb-4">
              <p className="text-sm text-text-muted leading-relaxed">{place.description}</p>
            </div>
          )}

          <div className="px-4 mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4 text-forest shrink-0" />
              <span>
                {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
              </span>
            </div>
            {!place.verified && (
              <div className="flex items-start gap-2 text-xs text-danger">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Location is approximate. Confirm on the ground.</span>
              </div>
            )}
          </div>

          {route && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-surface-muted border border-surface-border">
              <p className="text-sm font-medium text-text mb-1">Walking route</p>
              <p className="text-sm text-text-muted">
                {formatDistance(route.distance_m)} · {formatDuration(route.duration_s)}
              </p>
              {route.message && (
                <p className="text-xs text-text-light mt-1">{route.message}</p>
              )}
            </div>
          )}

          <div className="px-4 pb-8 pt-2">
            <button
              type="button"
              onClick={() => {
                onNavigate();
                setExpanded(true);
              }}
              disabled={navigating}
              className="btn-primary w-full py-3.5 rounded-full text-base"
            >
              <Navigation className="w-5 h-5" />
              {navigating ? 'Calculating...' : 'Get directions'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}