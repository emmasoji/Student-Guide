import type { Place, Route, CategoryItem, MapData } from '../types';

const BASE = import.meta.env.VITE_API_BASE || '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchMapData(): Promise<MapData> {
  return request<MapData>('/campus/map-data');
}

export async function searchPlaces(q: string): Promise<{ results: Place[]; total: number }> {
  return request(`/campus/search?q=${encodeURIComponent(q)}`);
}

export async function getPlace(id: string): Promise<Place> {
  return request(`/campus/places/${id}`);
}

export async function getCategories(): Promise<CategoryItem[]> {
  return request('/campus/categories');
}

export async function getNearby(
  lat: number,
  lng: number,
  radius_m = 300,
  category?: string
): Promise<{ results: Place[]; total: number }> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_m: String(radius_m),
  });
  if (category) params.set('category', category);
  return request(`/campus/nearby?${params}`);
}

export async function requestRoute(params: {
  origin_lat: number;
  origin_lng: number;
  destination_id?: string;
  destination_lat?: number;
  destination_lng?: number;
}): Promise<Route> {
  return request('/navigation/route', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
