import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { track } from '../lib/track';

interface MessageBoxProps {
  /** Nombre de quien escribe (ya lo sabemos por la entrada). */
  visitorName?: string | null;
}

export default function MessageBox({ visitorName }: MessageBoxProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) {
      setError('Escribe algo antes de enviar.');
      return;
    }

    setSending(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase no está configurado; el mensaje no se guardó.');
      setSent(true);
      return;
    }

    const { error: dbError } = await supabase
      .from('messages')
      .insert({ name: visitorName ?? null, message: value });

    setSending(false);
    if (dbError) {
      setError('No se pudo enviar. Inténtalo de nuevo.');
      console.error(dbError);
      return;
    }
    track('message', { meta: { length: value.length } });
    setSent(true);
  }

  return (
    <section className="px-5 pb-24 sm:px-6">
      <motion.div
        className="mx-auto max-w-lg rounded-2xl border border-cream-border bg-cream-surface p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
      >
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="gracias"
              className="py-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-wine/40 text-wine">
                <CheckIcon />
              </span>
              <p className="mt-5 font-display text-2xl italic text-ink">
                Recibido.
              </p>
              <p className="mt-1 text-sm text-ink-soft">Gracias por escribir.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="text-center">
                <p className="eyebrow">Tu turno</p>
                <h2 className="mt-2 font-display text-3xl font-medium text-ink sm:text-4xl">
                  Escríbeme
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                  {visitorName
                    ? `Déjame unas palabras, ${visitorName}.`
                    : 'Déjame unas palabras.'}
                </p>
              </div>

              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Tu mensaje..."
                rows={4}
                maxLength={1000}
                className="mt-6 w-full resize-none rounded-xl border border-cream-border bg-cream-bg/60 px-4 py-3
                  text-ink placeholder:text-ink-soft/40 outline-none transition
                  focus:border-wine/60"
              />

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-ink-soft/60">{text.length}/1000</span>
                {error && <span className="text-wine-soft">{error}</span>}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn-primary mt-4 w-full"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
