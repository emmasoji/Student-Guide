import { useState, useEffect, useCallback } from 'react';
import { CampusMap } from './components/CampusMap';
import { SearchBar } from './components/SearchBar';
import { DestinationPanel } from './components/DestinationPanel';
import { RoutePanel } from './components/RoutePanel';
import { MapControls } from './components/MapControls';
import { useGeolocation } from './hooks/useGeolocation';
import {
  fetchMapData,
  getPlace,
  getCategories,
  requestRoute,
} from './lib/api';
import type { Place, Route, MapData, CategoryItem } from './types';

export default function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const geo = useGeolocation();

  useEffect(() => {
    Promise.all([fetchMapData(), getCategories()])
      .then(([md, cats]) => {
        setMapData(md);
        setCategories(cats);
      })
      .catch((err) => {
        setLoadError(err.message || 'Failed to load campus data');
      });
  }, []);

  // Filter markers by category on the client (mapData stays full)
  const filteredMapData = mapData
    ? {
        ...mapData,
        places: activeCategory
          ? mapData.places.filter((p) => p.category === activeCategory)
          : mapData.places,
      }
    : null;

  const handleSelectPlace = useCallback(async (id: string) => {
    try {
      const place = await getPlace(id);
      setSelectedPlace(place);
      setRoute(null);
      setFlyTo({ lat: place.lat, lng: place.lng, zoom: 17.8 });
    } catch {
      // ignore
    }
  }, []);

  const handleSearchSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
    setRoute(null);
    setFlyTo({ lat: place.lat, lng: place.lng, zoom: 17.8 });
  }, []);

  const handleNavigate = useCallback(async () => {
    if (!selectedPlace) return;
    setLoadingRoute(true);
    try {
      let originLat = 6.51873;
      let originLng = 3.37414;
      if (geo.location) {
        originLat = geo.location.lat;
        originLng = geo.location.lng;
      } else {
        // Use main gate as default origin when no location
        originLat = 6.5172;
        originLng = 3.3730;
      }
      const r = await requestRoute({
        origin_lat: originLat,
        origin_lng: originLng,
        destination_id: selectedPlace.id,
      });
      setRoute(r);
    } catch (err: any) {
      alert(err.message || 'Could not calculate route');
    } finally {
      setLoadingRoute(false);
    }
  }, [selectedPlace, geo.location]);

  const handleCenterUser = useCallback(() => {
    if (geo.location) {
      setFlyTo({ lat: geo.location.lat, lng: geo.location.lng, zoom: 17.5 });
    } else {
      geo.getOnce();
    }
  }, [geo]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map */}
      <CampusMap
        mapData={filteredMapData}
        selectedPlace={selectedPlace}
        route={route}
        userLocation={geo.location}
        onSelectPlace={handleSelectPlace}
        flyTo={flyTo}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="mb-2 flex items-center gap-2">
            <div className="panel px-3 py-1.5 text-sm font-semibold text-primary shadow-elevated">
              YABATECH Campus Nav
            </div>
          </div>
          <SearchBar
            onSelect={handleSearchSelect}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </div>

      {/* Map controls (right side) */}
      <div className="absolute top-1/2 right-3 -translate-y-1/2 z-20">
        <MapControls
          tracking={geo.tracking}
          hasLocation={!!geo.location}
          error={geo.error}
          onToggleTracking={() => (geo.tracking ? geo.stopTracking() : geo.startTracking())}
          onCenterUser={handleCenterUser}
        />
      </div>

      {/* Bottom panels */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 flex flex-col items-center gap-2 pointer-events-none">
        {route && selectedPlace && (
          <div className="pointer-events-auto w-full flex justify-center">
            <RoutePanel
              route={route}
              destinationName={selectedPlace.name}
              onClose={() => setRoute(null)}
            />
          </div>
        )}
        {selectedPlace && !route && (
          <div className="pointer-events-auto w-full flex justify-center">
            <DestinationPanel
              place={selectedPlace}
              onClose={() => {
                setSelectedPlace(null);
                setRoute(null);
              }}
              onNavigate={handleNavigate}
              navigating={loadingRoute}
            />
          </div>
        )}
      </div>

      {/* Loading / error overlays */}
      {!mapData && !loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface/80">
          <div className="panel px-6 py-4 text-sm text-text-muted">Loading campus map...</div>
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface/90">
          <div className="panel px-6 py-5 max-w-sm text-center">
            <p className="text-sm font-medium text-text">Could not load campus data</p>
            <p className="text-xs text-text-muted mt-1">{loadError}</p>
            <p className="text-xs text-text-light mt-3">
              Ensure the backend is running at the configured API URL.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
