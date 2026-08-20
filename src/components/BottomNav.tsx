import { motion } from 'framer-motion';

export type TabKey = 'inicio' | 'vannia' | 'yamir';

interface BottomNavProps {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}

const items: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'vannia', label: 'Vannia' },
  { key: 'yamir', label: 'Yamir' },
];

export default function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-cream-bg">
      <div
        className="mx-auto flex max-w-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {items.map((it) => {
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 px-2 py-4"
            >
              {active && (
                <motion.span
                  layoutId="nav-marca"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: 'rgb(var(--accent))' }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className={`k ${active ? 'text-ink' : ''}`}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
