import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { songs, songsYamir, type Song } from '../data/songs';
import Opening from '../components/Opening';
import Player from '../components/Player';
import Letter from '../components/Letter';
import MessageBox from '../components/MessageBox';
import BottomNav, { type TabKey } from '../components/BottomNav';
import { track } from '../lib/track';

const NAME_KEY = 'visitor_name';
const ORDER: Record<TabKey, number> = { inicio: 0, vannia: 1, yamir: 2 };

export default function Home() {
  const [name, setName] = useState<string | null>(() =>
    localStorage.getItem(NAME_KEY),
  );
  const [tab, setTab] = useState<TabKey>('inicio');
  const dir = useRef(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    if (name) track('page_view', { meta: { name } });
  }, [name]);

  function changeTab(next: TabKey) {
    dir.current = ORDER[next] > ORDER[tab] ? 1 : -1;
    setTab(next);
    track('tab', { meta: { from: tab, to: next } });
  }

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

  return (
    <>
      <div className="mx-auto max-w-md pb-28">
        <AnimatePresence mode="wait" custom={dir.current}>
          <motion.div
            key={tab}
            custom={dir.current}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 20 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -20 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'inicio' && (
              <>
                <Opening visitorName={name} />
                <MessageBox visitorName={name} />
              </>
            )}

            {tab === 'vannia' && (
              <Section kicker="Para ella" list={songs} />
            )}

            {tab === 'yamir' && (
              <Section
                kicker="De él"
                list={songsYamir}
                empty="Todavía no hay nada aquí."
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav tab={tab} onChange={changeTab} />
    </>
  );
}

/**
 * Una sección es su reproductor. No hay tarjetas ni cabecera grande: la
 * carátula entra directamente por arriba y ocupa la pantalla, que es la
 * idea de esta dirección.
 */
function Section({
  kicker,
  list,
  empty,
}: {
  kicker: string;
  list: Song[];
  empty?: string;
}) {
  if (list.length === 0) {
    return (
      <div className="px-5 pt-24 sm:px-6">
        <p className="k">{kicker}</p>
        <p className="copy mt-4">{empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between px-5 pb-3 pt-6 sm:px-6">
        <p className="k">{kicker}</p>
        <p className="k tnum">{String(list.length).padStart(2, '0')} pistas</p>
      </div>
      <Player list={list} />
    </div>
  );
}
