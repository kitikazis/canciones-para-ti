import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dedication } from '../data/songs';

interface LetterProps {
  /** Se llama cuando ya leyó la carta y entra a las canciones. */
  onEnter: (name: string) => void;
}

type Phase = 'sealed' | 'opening' | 'reading';

export default function Letter({ onEnter }: LetterProps) {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<Phase>('sealed');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) {
      setError('Escribe tu nombre para abrirla.');
      return;
    }

    setSaving(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      const { error: dbError } = await supabase
        .from('visitors')
        .insert({ name: value });
      if (dbError) {
        setSaving(false);
        setError('No se pudo continuar. Inténtalo de nuevo.');
        console.error(dbError);
        return;
      }
    }

    setSaving(false);
    setPhase('opening');
    // Da tiempo a la animación del sobre antes de mostrar la carta.
    window.setTimeout(() => setPhase('reading'), 1200);
  }

  const displayName = name.trim() || dedication.toName;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <AnimatePresence mode="wait">
        {phase !== 'reading' ? (
          <motion.div
            key="envelope"
            className="flex w-full max-w-[300px] flex-col items-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ── El sobre ── */}
            <div
              className="relative aspect-[7/5] w-[260px]"
              style={{ perspective: 1000 }}
            >
              {/* Cuerpo del sobre */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl border border-cream-border bg-cream-bg shadow-glow">
                {/* Pliegues laterales sutiles */}
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute bottom-0 left-0 h-full w-full [clip-path:polygon(0_100%,50%_38%,0_0)] bg-cream-surface/40" />
                  <div className="absolute bottom-0 right-0 h-full w-full [clip-path:polygon(100%_100%,50%_38%,100%_0)] bg-cream-surface/40" />
                  <div className="absolute bottom-0 left-0 h-full w-full [clip-path:polygon(0_100%,50%_54%,100%_100%)] bg-cream-surface/70" />
                </div>
              </div>

              {/* La carta que asoma al abrir */}
              <motion.div
                className="absolute inset-x-6 top-6 rounded-md border border-cream-border bg-cream-surface"
                style={{ height: '70%' }}
                initial={{ y: 0, opacity: 0 }}
                animate={
                  phase === 'opening'
                    ? { y: '-38%', opacity: 1 }
                    : { y: 0, opacity: 0 }
                }
                transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Solapa superior (se abre) */}
              <motion.div
                className="absolute left-0 top-0 h-1/2 w-full origin-top [clip-path:polygon(0_0,100%_0,50%_100%)] border-t border-cream-border bg-cream-surface"
                style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                animate={{ rotateX: phase === 'opening' ? -172 : 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />

              {/* Sello con la inicial */}
              <motion.div
                className="absolute left-1/2 top-[38%] z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-wine font-display text-lg text-white ring-4 ring-cream-bg"
                animate={{
                  scale: phase === 'opening' ? 0 : 1,
                  opacity: phase === 'opening' ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {displayName.charAt(0).toUpperCase()}
              </motion.div>
            </div>

            {/* ── Nombre + abrir ── */}
            <form onSubmit={handleOpen} className="mt-8 w-full text-center">
              <p className="eyebrow">Una carta para ti</p>
              <p className="mx-auto mt-2 text-sm leading-relaxed text-ink-soft">
                Escribe tu nombre para abrirla.
              </p>

              <div className="mx-auto mt-5 w-full max-w-[240px]">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Tu nombre"
                  maxLength={80}
                  disabled={phase === 'opening'}
                  className="w-full border-0 border-b border-cream-border bg-transparent pb-2 text-center
                    font-display text-2xl text-ink placeholder:text-ink-soft/40
                    outline-none transition focus:border-wine/70"
                />
              </div>

              {error && <p className="mt-3 text-sm text-wine-soft">{error}</p>}

              <button
                type="submit"
                disabled={saving || phase === 'opening'}
                className="btn-accent mt-6"
              >
                {saving ? 'Abriendo...' : 'Abrir la carta'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="reading"
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-cream-border bg-cream-surface px-7 py-12 shadow-glow sm:px-12 sm:py-14">
              <p className="eyebrow text-center">Para</p>
              <h1 className="mt-2 text-center font-display text-5xl font-medium italic text-ink sm:text-6xl">
                {displayName}
              </h1>

              <div className="mx-auto mt-7 hairline" />

              <div className="mt-8 space-y-5 font-display text-xl leading-relaxed text-ink-soft sm:text-2xl">
                <p>{dedication.intro}</p>
                <p>{dedication.message}</p>
              </div>

              <p className="mt-9 text-sm text-ink-soft">{dedication.signature}</p>
              <p className="mt-1 font-display text-2xl text-ink">
                {dedication.fromName}
              </p>

              <div className="mt-10 text-center">
                <button
                  onClick={() => onEnter(displayName)}
                  className="btn-primary"
                >
                  Escuchar las canciones
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
