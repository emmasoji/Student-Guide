import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { searchPlaces } from '../lib/api';
import type { Place } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (place: Place) => void;
  darkMode?: boolean;
}

export function SearchDropdown({ open, onClose, onSelect, darkMode = false }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const data = await searchPlaces(query.trim());
        setResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  if (!open) return null;

  return (
    <div
      className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-elevated overflow-hidden border
        ${darkMode ? 'bg-ink border-white/10 text-cream' : 'bg-surface border-surface-border text-text'}`}
    >
      <div className="relative p-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          className={`w-full rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none
            ${darkMode ? 'bg-white/10 text-cream placeholder:text-cream/50' : 'bg-surface-muted text-text placeholder:text-text-light'}`}
          placeholder="Search buildings, halls..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <div className="px-4 py-3 text-sm opacity-60 text-center">Searching...</div>
        )}
        {!loading && query && results.length === 0 && (
          <div className="px-4 py-3 text-sm opacity-60 text-center">No places found</div>
        )}
        {!loading &&
          results.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`w-full flex items-start gap-3 px-4 py-2.5 text-left border-t
                ${darkMode ? 'border-white/5 hover:bg-white/10' : 'border-surface-border hover:bg-forest/10'}`}
              onClick={() => {
                onSelect(p);
                onClose();
              }}
            >
              <MapPin className="w-4 h-4 mt-0.5 text-forest shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs opacity-60 capitalize">
                  {p.category.replace('_', ' ')}
                  {!p.verified && ' · Approximate'}
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
