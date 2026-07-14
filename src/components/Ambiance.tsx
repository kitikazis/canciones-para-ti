import { motion } from 'framer-motion';

/**
 * Fondo "vivo": luces suaves que se desplazan muy lento tras el contenido.
 * Da una sensación soñadora y envolvente sin recargar el diseño.
 */
export default function Ambiance() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-[15%] top-[-12%] h-[55vh] w-[55vh] rounded-full bg-wine/15 blur-[100px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-18%] top-[18%] h-[52vh] w-[52vh] rounded-full bg-wine-deep/15 blur-[110px]"
        animate={{ x: [0, -55, 0], y: [0, 55, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-1/3 h-[48vh] w-[48vh] rounded-full bg-gold/10 blur-[120px]"
        animate={{ x: [0, 45, 0], y: [0, -35, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
