import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Locate, LocateFixed, Compass } from 'lucide-react';
import { CampusMap } from './components/CampusMap';
import { SearchDropdown } from './components/SearchDropdown';
import { BottomNav, type TabId } from './components/BottomNav';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { useGeolocation } from './hooks/useGeolocation';
import {
  fetchMapData,
  getPlace,
  getCategories,
  requestRoute,
} from './lib/api';
import type { Place, Route, MapData, CategoryItem } from './types';

export default function App() {
  const [tab, setTab] = useState<TabId>('map');
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
      setSearchOpen(false);
    } catch {
      // ignore
    }
  }, []);

  const handleSearchSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
    setRoute(null);
    setFlyTo({ lat: place.lat, lng: place.lng, zoom: 17.8 });
    setSearchOpen(false);
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

  const zoomIn = () => (window as any).__yabatechZoom?.(1);
  const zoomOut = () => (window as any).__yabatechZoom?.(-1);

  if (tab === 'home') {
    return (
      <div className={`relative w-full h-full flex flex-col ${darkMode ? 'bg-ink text-cream' : 'bg-surface text-text'}`}>
        <main className="flex-1 flex items-center justify-center p-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </main>
        <BottomNav active={tab} onChange={setTab} darkMode={darkMode} />
      </div>
    );
  }

  if (tab === 'ai') {
    return (
      <div className={`relative w-full h-full flex flex-col ${darkMode ? 'bg-ink text-cream' : 'bg-surface text-text'}`}>
        <main className="flex-1 flex items-center justify-center p-6">
          <h1 className="text-2xl font-semibold">AI Chat</h1>
        </main>
        <BottomNav active={tab} onChange={setTab} darkMode={darkMode} />
      </div>
    );
  }

  if (tab === 'profile') {
    return (
      <div className={`relative w-full h-full flex flex-col ${darkMode ? 'bg-ink text-cream' : 'bg-surface text-text'}`}>
        <main className="flex-1 flex items-center justify-center p-6">
          <h1 className="text-2xl font-semibold">User Profile</h1>
        </main>
        <BottomNav active={tab} onChange={setTab} darkMode={darkMode} />
      </div>
    );
  }

  // Map tab
  return (
    <div className={`relative w-full h-full overflow-hidden ${darkMode ? 'bg-ink' : 'bg-surface'}`}>
      <CampusMap
        mapData={filteredMapData}
        selectedPlace={selectedPlace}
        route={route}
        userLocation={geo.location}
        onSelectPlace={handleSelectPlace}
        flyTo={flyTo}
      />

      {/* Search — hidden when detail modal is open */}
      {!selectedPlace && (
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pointer-events-none">
          <div className="pointer-events-auto relative w-full">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full shadow-elevated text-left
                ${darkMode ? 'bg-ink text-cream border border-white/10' : 'bg-surface text-text border border-surface-border'}`}
              aria-label="Search places"
            >
              <Search className="w-5 h-10 text-forest shrink-0" />
              <span className={`text-sm truncate ${darkMode ? 'text-cream/50' : 'text-text-light'}`}>
                Search places...
              </span>
            </button>
            <SearchDropdown
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              onSelect={handleSearchSelect}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Bottom-left controls — hidden when detail open */}
      {!selectedPlace && (
        <div className="absolute bottom-24 left-3 z-20 flex flex-col items-center gap-2">
          <button type="button" onClick={zoomIn} className="panel p-2.5 shadow-elevated" aria-label="Zoom in">
            <Plus className="w-5 h-5 text-forest" />
          </button>
          <button type="button" onClick={zoomOut} className="panel p-2.5 shadow-elevated" aria-label="Zoom out">
            <Minus className="w-5 h-5 text-forest" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!geo.tracking) geo.startTracking();
              handleCenterUser();
            }}
            className={`panel p-2.5 shadow-elevated ${geo.tracking ? 'bg-forest text-cream' : ''}`}
            aria-label="My location"
          >
            {geo.tracking ? <LocateFixed className="w-5 h-5" /> : <Locate className="w-5 h-5 text-forest" />}
          </button>
          <button
            type="button"
            onClick={() => (window as any).__yabatechResetNorth?.()}
            className="panel p-2.5 shadow-elevated"
            aria-label="Reset north"
          >
            <Compass className="w-5 h-5 text-forest" />
          </button>
        </div>
      )}

      {/* Full-page place modal — NOT inside bottom-24 */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          route={route}
          userLocation={geo.location}
          navigating={loadingRoute}
          onClose={() => {
            setSelectedPlace(null);
            setRoute(null);
          }}
          onNavigate={handleNavigate}
          onClearRoute={() => setRoute(null)}
        />
      )}

      {/* Navbar — hide when detail open so modal is truly full page */}
      {!selectedPlace && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <BottomNav active={tab} onChange={setTab} darkMode={darkMode} />
        </div>
      )}

      {!mapData && !loadError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface/80">
          <div className="panel px-6 py-4 text-sm text-text-muted">Loading campus map...</div>
        </div>
      )}
    </div>
  );
}