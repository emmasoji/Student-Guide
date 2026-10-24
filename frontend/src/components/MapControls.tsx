import { LocateFixed, Locate, Crosshair } from 'lucide-react';

interface Props {
  tracking: boolean;
  hasLocation: boolean;
  error: string | null;
  onToggleTracking: () => void;
  onCenterUser: () => void;
}

export function MapControls({ tracking, hasLocation, error, onToggleTracking, onCenterUser }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={`panel p-2.5 shadow-elevated ${tracking ? 'bg-primary text-white' : 'bg-surface text-text'}`}
        onClick={onToggleTracking}
        title={tracking ? 'Stop location tracking' : 'Start location tracking'}
        aria-label={tracking ? 'Stop tracking' : 'Start tracking'}
      >
        {tracking ? <LocateFixed className="w-5 h-5" /> : <Locate className="w-5 h-5" />}
      </button>
      {hasLocation && (
        <button
          type="button"
          className="panel p-2.5 bg-surface text-text shadow-elevated"
          onClick={onCenterUser}
          title="Center on my location"
          aria-label="Center on my location"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      )}
      {error && (
        <div className="panel px-2.5 py-1.5 text-xs text-accent-danger max-w-[140px] shadow-elevated">
          {error}
        </div>
      )}
    </div>
  );
}
