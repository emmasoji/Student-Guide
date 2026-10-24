import { X, Clock, Route as RouteIcon, AlertCircle } from 'lucide-react';
import type { Route } from '../types';
import { formatDistance, formatDuration } from '../lib/api';

interface Props {
  route: Route;
  destinationName: string;
  onClose: () => void;
}

export function RoutePanel({ route, destinationName, onClose }: Props) {
  return (
    <div className="panel p-4 w-full max-w-sm max-h-[50vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-text">To {destinationName}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1">
              <RouteIcon className="w-3.5 h-3.5" />
              {formatDistance(route.distance_m)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(route.duration_s)}
            </span>
          </div>
        </div>
        <button type="button" className="btn-ghost p-1" onClick={onClose} aria-label="Close route">
          <X className="w-4 h-4" />
        </button>
      </div>

      {route.message && (
        <div className="mt-3 flex items-start gap-2 text-xs text-text-muted bg-surface-muted border border-surface-border rounded-lg px-2.5 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{route.message}</span>
        </div>
      )}

      <div className="mt-4 space-y-0">
        <p className="text-xs font-medium text-text-light uppercase tracking-wide mb-2">Steps</p>
        {route.steps.length === 0 ? (
          <p className="text-sm text-text-muted">No turn-by-turn steps available.</p>
        ) : (
          route.steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-3 py-2 border-b border-surface-border last:border-0"
            >
              <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text">{step.instruction}</p>
                <p className="text-xs text-text-light mt-0.5">
                  {formatDistance(step.distance_m)} · {formatDuration(step.duration_s)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
