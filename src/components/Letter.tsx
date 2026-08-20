import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { track, visitorId } from '../lib/track';
import { dedication } from '../data/songs';

interface LetterProps {
  onEnter: (name: string) => void;
}

type Phase = 'ask' | 'read';

/**
 * La entrada. Antes pedía permiso («Una carta para ti», «Escribe tu
 * nombre para abrirla»); ahora pregunta y ya. Directo suena más seguro.
 */
export default function Letter({ onEnter }: LetterProps) {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<Phase>('ask');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) {
      setError('Escribe tu nombre.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      localStorage.setItem('visitor_name', value);
    } catch {
      /* sin almacenamiento: seguimos igual */
    }

    if (isSupabaseConfigured && supabase) {
      // El id lo generamos aquí: leerlo de vuelta exigiría dar permiso
      // de lectura a los visitantes, y esa tabla solo la lee el admin.
      const { error: dbError } = await supabase
        .from('visitors')
        .insert({ id: visitorId(), name: value });
      if (dbError) {
        setSaving(false);
        setError('No se pudo continuar. Inténtalo otra vez.');
        console.error(dbError);
        return;
      }
    }

    track('enter', { meta: { name: value } });
    setSaving(false);
    setPhase('read');
  }

  const shown = name.trim() || dedication.toName;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 sm:px-6">
      <AnimatePresence mode="wait">
        {phase === 'ask' ? (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
          >
            <p className="k">Antes de entrar</p>
            <h1 className="display mt-10 text-[3rem] leading-[0.95]">
              ¿Quién eres?
            </h1>

            <form onSubmit={handleSubmit} className="mt-12">
              <label htmlFor="nombre" className="k">
                Tu nombre
              </label>
              <input
                id="nombre"
                autoFocus
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                maxLength={80}
                autoComplete="name"
                className="field mt-2"
              />

              {error && <p className="k-accent mt-3">{error}</p>}

              <button type="submit" disabled={saving} className="btn-solid mt-10">
                {saving ? 'Entrando' : 'Entrar'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.article
            key="read"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="k">Para</p>
            <h1 className="display mt-3 text-[3rem] leading-[0.95]">{shown}</h1>

            <div className="mt-10 space-y-5 border-t border-rule pt-8">
              <p className="copy">{dedication.intro}</p>
              <p className="copy text-ink">{dedication.message}</p>
            </div>

            <div className="mt-10">
              <p className="k">{dedication.signature}</p>
              <p className="display mt-2 text-2xl">{dedication.fromName}</p>
            </div>

            <button onClick={() => onEnter(shown)} className="btn-solid mt-12">
              Empezar
            </button>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  );
}
