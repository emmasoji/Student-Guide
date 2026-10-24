import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { searchPlaces } from '../lib/api';
import type { Place } from '../types';

interface Props {
  onSelect: (place: Place) => void;
  categories: { id: string; label: string }[];
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
}

export function SearchBar({ onSelect, categories, activeCategory, onCategoryChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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
        setOpen(true);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
        <input
          type="search"
          className="input pl-9 pr-9"
          placeholder="Search buildings, halls, facilities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          aria-label="Search campus places"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-light hover:text-text"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${
            !activeCategory
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-text-muted border-surface-border hover:border-primary'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(activeCategory === c.id ? null : c.id)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${
              activeCategory === c.id
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-muted border-surface-border hover:border-primary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-30 mt-1 w-full panel overflow-hidden max-h-72 overflow-y-auto">
          {loading && (
            <div className="px-3 py-4 text-sm text-text-muted text-center">Searching...</div>
          )}
          {!loading &&
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-surface-muted border-b border-surface-border last:border-0"
                onClick={() => {
                  onSelect(p);
                  setQuery(p.name);
                  setOpen(false);
                }}
              >
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text truncate">{p.name}</div>
                  <div className="text-xs text-text-light capitalize">
                    {p.category.replace('_', ' ')}
                    {!p.verified && ' · Approximate'}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
