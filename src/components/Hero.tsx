import { motion } from 'framer-motion';
import { dedication } from '../data/songs';

interface HeroProps {
  /** Nombre de quien acaba de entrar, para saludarle con sobriedad. */
  visitorName?: string | null;
}

export default function Hero({ visitorName }: HeroProps) {
  return (
    <header className="relative flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative z-10 max-w-xl">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {visitorName ? `Para ${visitorName}` : 'Una playlist con dedicatoria'}
        </motion.p>

        <motion.h1
          className="mt-6 font-display text-7xl font-medium leading-none text-ink sm:text-8xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {dedication.title}
        </motion.h1>

        <motion.p
          className="mt-4 font-display text-2xl italic text-wine-soft"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {visitorName || dedication.toName}
        </motion.p>

        <motion.div
          className="mx-auto mt-8 hairline"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        />

        <motion.p
          className="mx-auto mt-8 max-w-md text-base leading-relaxed text-ink-soft"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          {dedication.intro}
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-2 text-ink-soft/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.25em]">Desliza</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </motion.span>
      </motion.div>
    </header>
  );
}
