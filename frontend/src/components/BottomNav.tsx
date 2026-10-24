import { Home, Sparkles, Map, User } from 'lucide-react';

export type TabId = 'home' | 'ai' | 'map' | 'profile';

const TABS: { id: TabId; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'ai', icon: Sparkles, label: 'AI' },
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'profile', icon: User, label: 'Profile' },
];

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
  darkMode?: boolean;
}

export function BottomNav({ active, onChange, darkMode = false }: Props) {
  return (
    <nav
      className="pointer-events-auto flex items-center justify-center px-3 pb-4 pt-2"
      aria-label="Main navigation"
    >
      <div
        className={`flex items-center gap-1 rounded-full px-2 py-1.5
          ${darkMode ? 'bg-ink border border-white/10' : 'bg-surface border border-surface-border'}`}
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-center rounded-full transition-all
                ${isActive ? 'w-12 h-12 bg-forest text-cream' : 'w-11 h-11 text-text-muted hover:text-forest'}`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
