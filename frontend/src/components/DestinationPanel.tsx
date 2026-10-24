import { X, Navigation, MapPin, Info } from 'lucide-react';
import type { Place } from '../types';

interface Props {
  place: Place;
  onClose: () => void;
  onNavigate: () => void;
  navigating: boolean;
}

export function DestinationPanel({ place, onClose, onNavigate, navigating }: Props) {
  return (
    <div className="panel p-4 w-full max-w-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text truncate">{place.name}</h2>
          <p className="text-xs text-text-muted capitalize mt-0.5">
            {place.category.replace('_', ' ')}
          </p>
        </div>
        <button type="button" className="btn-ghost p-1" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {place.description && (
        <p className="mt-3 text-sm text-text-muted leading-relaxed">{place.description}</p>
      )}

      {!place.verified && (
        <div className="mt-3 flex items-start gap-2 text-xs text-accent-warning bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Location is approximate. Confirm on the ground.</span>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={onNavigate}
          disabled={navigating}
        >
          <Navigation className="w-4 h-4" />
          {navigating ? 'Calculating...' : 'Get directions'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            // parent will fly via selected place
          }}
          title="Show on map"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
