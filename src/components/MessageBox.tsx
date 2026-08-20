import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { track } from '../lib/track';

interface MessageBoxProps {
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
      setError('Escribe algo primero.');
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
      setError('No se pudo enviar. Inténtalo otra vez.');
      console.error(dbError);
      return;
    }

    track('message', { meta: { length: value.length } });
    setSent(true);
  }

  return (
    <section className="mt-16 px-5 pb-10 sm:px-6">
      <div className="rule" />
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.p
            key="ok"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="display py-12 text-3xl"
          >
            Enviado.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            exit={{ opacity: 0 }}
            className="pt-8"
          >
            <p className="k">Responder</p>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Escribe"
              rows={4}
              maxLength={1000}
              className="mt-4 w-full resize-none border-0 border-b border-rule bg-transparent
                px-0 py-3 text-[15px] leading-relaxed text-ink outline-none
                transition-colors placeholder:text-faint focus:border-[rgb(var(--accent))]"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="k tnum">{text.length}/1000</span>
              {error && <span className="k-accent">{error}</span>}
            </div>

            <button type="submit" disabled={sending} className="btn-line mt-7">
              {sending ? 'Enviando' : 'Enviar'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
