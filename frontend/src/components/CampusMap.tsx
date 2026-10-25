import { useEffect, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import type { Place, Route, UserLocation, MapData } from '../types';

interface Props {
  mapData: MapData | null;
  selectedPlace: Place | null;
  route: Route | null;
  userLocation: UserLocation | null;
  onSelectPlace: (id: string) => void;
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
}

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const mapId = import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined;

// YABATECH campus centre (fallback)
const CAMPUS_CENTER = { lat: 6.51873, lng: 3.37414 };

// Cleaner map style – reduces POI clutter
const CLEAN_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
];

function MapInner({
  mapData,
  selectedPlace,
  route,
  userLocation,
  onSelectPlace,
  flyTo,
}: Props) {
  const map = useMap();

  // Start at user location once available
  useEffect(() => {
    if (!map || !userLocation) return;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    map.setZoom(17.5);
  }, [map, userLocation?.lat, userLocation?.lng]);

  // External flyTo requests (from search / place selection)
  useEffect(() => {
    if (!map || !flyTo) return;
    map.panTo({ lat: flyTo.lat, lng: flyTo.lng });
    if (flyTo.zoom) map.setZoom(flyTo.zoom);
  }, [map, flyTo]);

  // Draw / clear walking route
  useEffect(() => {
    if (!map) return;

    const existing = (map as any).__routePolyline as google.maps.Polyline | undefined;
    if (existing) {
      existing.setMap(null);
      (map as any).__routePolyline = undefined;
    }

    if (!route?.geometry?.length) return;

    const path = route.geometry.map(([lng, lat]) => ({ lat, lng }));
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#1e3a5f',
      strokeOpacity: 0.9,
      strokeWeight: 5,
    });
    polyline.setMap(map);
    (map as any).__routePolyline = polyline;

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 70);
  }, [map, route]);

  // Expose simple zoom / locate helpers for the floating buttons in App.tsx
  useEffect(() => {
    if (!map) return;

    (window as any).__yabatechZoom = (delta: number) => {
      map.setZoom((map.getZoom() ?? 16) + delta);
    };
    (window as any).__yabatechGoToUser = () => {
      if (userLocation) {
        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
        map.setZoom(17.5);
      }
    };
    (window as any).__yabatechResetNorth = () => {
      map.setHeading(0);
      map.setTilt(0);
    };
  }, [map, userLocation]);

  const places = mapData?.places ?? [];

  return (
    <>
      {places.map((p) => {
        const isSelected = selectedPlace?.id === p.id;
        return (
          <AdvancedMarker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => onSelectPlace(p.id)}
            zIndex={isSelected ? 20 : 10}
          >
            <button
              type="button"
              className="place-label"
              style={{
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: isSelected ? 11 : 10,
                fontWeight: isSelected ? 600 : 500,
                lineHeight: 1.2,
                maxWidth: 110,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '3px 8px',
                borderRadius: 999,
                background: isSelected ? '#1e3a5f' : '#f8f7f2',
                color: isSelected ? '#f8f7f2' : '#1a1a1a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                border: `1px solid ${isSelected ? '#1e3a5f' : 'rgba(30,58,95,0.25)'}`,
              }}
            >
              {p.name}
            </button>
          </AdvancedMarker>
        );
      })}

      {/* User location blue dot */}
      {userLocation && (
        <AdvancedMarker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          zIndex={30}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#1e3a5f',
              border: '3px solid #fff',
              boxShadow: '0 0 0 2px #1e3a5f, 0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
        </AdvancedMarker>
      )}
    </>
  );
}

export function CampusMap(props: Props) {
  const [initialCenter, setInitialCenter] = useState(CAMPUS_CENTER);
  const [ready, setReady] = useState(false);

  // Try to get user location as soon as the component mounts
  useEffect(() => {
    if (!navigator.geolocation) {
      setReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInitialCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setReady(true);
      },
      () => {
        // Permission denied or error → stay on campus centre
        setReady(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  if (!apiKey) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface text-sm text-text-muted">
        Missing VITE_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface text-sm text-text-muted">
        Getting your location…
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={initialCenter}
        defaultZoom={17.5}
        gestureHandling="greedy"
        disableDefaultUI={true}
        keyboardShortcuts={false}
        clickableIcons={false}          // ← kills Google POI popups
        mapId={mapId}
        styles={CLEAN_STYLES}
        style={{ width: '100%', height: '100%' }}
        className="absolute inset-0 w-full h-full"
        // Optional: restrict to campus area if you want
        // restriction={{
        //   latLngBounds: {
        //     north: 6.525,
        //     south: 6.513,
        //     east: 3.381,
        //     west: 3.368,
        //   },
        //   strictBounds: false,
        // }}
      >
        <MapInner {...props} />
      </Map>
    </APIProvider>
  );
}