import { useState, useCallback, useRef, useEffect } from 'react';
import type { UserLocation } from '../types';

interface GeoState {
  location: UserLocation | null;
  tracking: boolean;
  error: string | null;
  permission: PermissionState | 'unknown';
}

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 15000,
};

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    location: null,
    tracking: false,
    error: null,
    permission: 'unknown',
  });
  const watchId = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState((s) => ({
      ...s,
      location: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
      },
      error: null,
    }));
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    let message = 'Location unavailable';
    if (err.code === err.PERMISSION_DENIED) message = 'Location permission denied';
    else if (err.code === err.POSITION_UNAVAILABLE) message = 'Position unavailable';
    else if (err.code === err.TIMEOUT) message = 'Location request timed out';
    setState((s) => ({ ...s, error: message, tracking: false }));
    clearWatch();
  }, [clearWatch]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported by this browser' }));
      return;
    }
    clearWatch();
    setState((s) => ({ ...s, tracking: true, error: null }));
    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, OPTIONS);
  }, [clearWatch, onSuccess, onError]);

  const stopTracking = useCallback(() => {
    clearWatch();
    setState((s) => ({ ...s, tracking: false }));
  }, [clearWatch]);

  const getOnce = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported by this browser' }));
      return;
    }
    setState((s) => ({ ...s, error: null }));
    navigator.geolocation.getCurrentPosition(onSuccess, onError, OPTIONS);
  }, [onSuccess, onError]);

  useEffect(() => {
    return () => clearWatch();
  }, [clearWatch]);

  // Check permission status when available
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setState((s) => ({ ...s, permission: result.state }));
        result.onchange = () => setState((s) => ({ ...s, permission: result.state }));
      }).catch(() => {});
    }
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    getOnce,
  };
}
