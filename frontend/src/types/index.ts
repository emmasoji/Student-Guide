export type PlaceCategory =
  | 'gate'
  | 'lecture_hall'
  | 'laboratory'
  | 'library'
  | 'cafeteria'
  | 'hostel'
  | 'administrative'
  | 'facility';

export interface Place {
  id: string;
  name: string;
  aliases: string[];
  category: PlaceCategory;
  description?: string | null;
  lat: number;
  lng: number;
  verified: boolean;
  entrance_lat?: number | null;
  entrance_lng?: number | null;
}

export interface RouteStep {
  instruction: string;
  distance_m: number;
  duration_s: number;
  lat: number;
  lng: number;
}

export interface Route {
  geometry: [number, number][]; // [lng, lat]
  distance_m: number;
  duration_s: number;
  steps: RouteStep[];
  source: string;
  message?: string | null;
}

export interface CategoryItem {
  id: string;
  label: string;
  count: number;
}

export interface MapData {
  places: Array<{
    id: string;
    name: string;
    category: PlaceCategory;
    lat: number;
    lng: number;
    verified: boolean;
  }>;
  bounds: { south: number; west: number; north: number; east: number };
  center: { lat: number; lng: number };
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  timestamp: number;
}
