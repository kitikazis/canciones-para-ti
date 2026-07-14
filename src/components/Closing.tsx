import { motion } from 'framer-motion';
import { dedication } from '../data/songs';

export default function Closing() {
  return (
    <section className="px-5 py-20 sm:px-6">
      <motion.div
        className="mx-auto max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
      >
        <p className="eyebrow">Para cerrar</p>

        <p className="mt-6 font-display text-2xl italic leading-relaxed text-ink sm:text-3xl">
          {dedication.message}
        </p>

        <div className="mx-auto mt-8 hairline" />

        <p className="mt-6 text-sm text-ink-soft">{dedication.signature}</p>
        <p className="mt-1 font-display text-3xl text-ink">{dedication.fromName}</p>
      </motion.div>
    </section>
  );
}
