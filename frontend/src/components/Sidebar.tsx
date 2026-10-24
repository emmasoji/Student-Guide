import {
  MapPin,
  Building2,
  BookOpen,
  Coffee,
  Home,
  X,
  Sun,
  Moon,
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'explore', label: 'Explore Campus', icon: MapPin },
  { id: 'buildings', label: 'Buildings', icon: Building2 },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'cafeteria', label: 'Cafeteria', icon: Coffee },
  { id: 'hostels', label: 'Hostels', icon: Home },
];

interface Props {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectItem?: (id: string) => void;
}

export function Sidebar({ open, onClose, darkMode, onToggleDarkMode, onSelectItem }: Props) {
  if (!open) return null;

  return (
    <>
      <div
        className="absolute inset-0 z-40 bg-ink/40"
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={`absolute top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col shadow-elevated
          ${darkMode ? 'bg-ink text-cream' : 'bg-surface text-text'}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-surface-border/30">
          <span className="font-semibold text-base">YABATECH Nav</span>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-surface-muted'}`}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectItem?.(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors
                  ${darkMode ? 'hover:bg-white/10' : 'hover:bg-forest/10 hover:text-forest'}`}
              >
                <Icon className="w-5 h-5 shrink-0 text-forest" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className={`px-4 py-4 border-t ${
            darkMode ? 'border-white/10' : 'border-surface-border'
          }`}
        >
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-surface-muted hover:bg-forest/10'}`}
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Light mode' : 'Dark mode'}
            </span>
            <span
              className={`w-10 h-6 rounded-full relative transition-colors ${
                darkMode ? 'bg-forest' : 'bg-surface-border'
              }`}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-cream shadow transition-all"
                style={{ left: darkMode ? 18 : 2 }}
              />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
