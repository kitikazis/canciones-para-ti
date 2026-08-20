import { motion } from 'framer-motion';
import { dedication } from '../data/songs';

interface Props {
  visitorName?: string | null;
}

/**
 * La portada. Una sola idea por pantalla y sin rodeos: a quién va, el
 * título, y la dedicatoria. Nada de «Para cerrar» ni flechas de deslizar.
 */
export default function Opening({ visitorName }: Props) {
  return (
    <header className="px-5 pt-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <p className="k">Para {visitorName || dedication.toName}</p>
          <p className="k tnum">{new Date().getFullYear()}</p>
        </div>

        <h1 className="display mt-12 text-[3.4rem] leading-[0.92]">
          {dedication.title}
        </h1>

        <p className="copy mt-6">{dedication.intro}</p>

        <div className="mt-14 border-t border-rule pt-8">
          <p className="copy text-ink">{dedication.message}</p>

          <div className="mt-8">
            <p className="k">{dedication.signature}</p>
            <p className="display mt-2 text-2xl">{dedication.fromName}</p>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
