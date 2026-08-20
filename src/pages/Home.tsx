import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { songs, songsYamir, type Song } from '../data/songs';
import Hero from '../components/Hero';
import SongCard from '../components/SongCard';
import Closing from '../components/Closing';
import Letter from '../components/Letter';
import MessageBox from '../components/MessageBox';
import BottomNav, { type TabKey } from '../components/BottomNav';
import { track } from '../lib/track';

const NAME_KEY = 'visitor_name';
const ORDER: Record<TabKey, number> = { inicio: 0, vannia: 1, yamir: 2 };

export default function Home() {
  // Recordamos si esta persona ya entró para no volver a mostrar la carta.
  const [name, setName] = useState<string | null>(() =>
    localStorage.getItem(NAME_KEY),
  );
  const [tab, setTab] = useState<TabKey>('inicio');
  const dir = useRef(0);

  // Al cambiar de sección, subimos arriba.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  // Una visita = una carga de la página (solo si ya tenemos su nombre).
  useEffect(() => {
    if (name) track('page_view', { meta: { name } });
  }, [name]);

  function changeTab(next: TabKey) {
    dir.current = ORDER[next] > ORDER[tab] ? 1 : -1;
    setTab(next);
    track('tab', { meta: { from: tab, to: next } });
  }

  // ── Entrada: la carta que se abre ──
  if (!name) {
    return (
      <Letter
        onEnter={(enteredName) => {
          localStorage.setItem(NAME_KEY, enteredName);
          setName(enteredName);
        }}
      />
    );
  }

  // ── App con barra inferior ──
  return (
    <>
      <div className="pb-28">
        <AnimatePresence mode="wait" custom={dir.current}>
          <motion.div
            key={tab}
            custom={dir.current}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 48 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -48 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'inicio' && (
              <>
                <Hero visitorName={name} />
                <Closing />
                <MessageBox visitorName={name} />
                <p className="pb-6 text-center text-[11px] uppercase tracking-[0.25em] text-ink-soft/50">
                  Para {name}
                </p>
              </>
            )}

            {tab === 'vannia' && (
              <SongList
                eyebrow="Para ella"
                title="Canciones para Vannia"
                list={songs}
              />
            )}

            {tab === 'yamir' && (
              <SongList
                eyebrow="De él"
                title="Canciones de Yamir"
                list={songsYamir}
                empty="Aún no hay canciones aquí. Pronto Yamir añadirá las suyas."
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav tab={tab} onChange={changeTab} />
    </>
  );
}

function SongList({
  eyebrow,
  title,
  list,
  empty,
}: {
  eyebrow: string;
  title: string;
  list: Song[];
  empty?: string;
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 pt-20 sm:px-6">
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl font-medium text-ink sm:text-5xl">
          {title}
        </h2>
        <div className="mx-auto mt-5 hairline" />
      </motion.div>

      {list.length > 0 ? (
        <div className="flex flex-col gap-5">
          {list.map((song, i) => (
            <SongCard key={i} song={song} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-cream-border bg-cream-surface/50 p-12 text-center text-sm text-ink-soft">
          {empty}
        </div>
      )}
    </section>
  );
}
