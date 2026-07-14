import { motion } from 'framer-motion';

export type TabKey = 'inicio' | 'vannia' | 'yamir';

interface BottomNavProps {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}

const items: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'inicio', label: 'Inicio', icon: <HomeIcon /> },
  { key: 'vannia', label: 'Vannia', icon: <NoteIcon /> },
  { key: 'yamir', label: 'Yamir', icon: <DiscIcon /> },
];

export default function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-border bg-cream-bg/85 backdrop-blur-lg">
      <div
        className="mx-auto flex max-w-md items-stretch justify-around px-3 pt-1.5"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
      >
        {items.map((it) => {
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                active ? 'text-wine' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute -top-[7px] h-[2px] w-8 rounded-full bg-wine"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
              <span className={active ? 'scale-110 transition' : 'transition'}>
                {it.icon}
              </span>
              <span className="tracking-wide">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V6l10-2v10" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="14" r="2.5" />
    </svg>
  );
}

function DiscIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
