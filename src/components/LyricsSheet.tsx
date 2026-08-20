import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Song } from '../data/songs';

interface LyricsSheetProps {
  song: Song;
  onClose: () => void;
}

type State =
  | { status: 'loading' }
  | { status: 'ok'; lyrics: string }
  | { status: 'empty' };

export default function LyricsSheet({ song, onClose }: LyricsSheetProps) {
  const [state, setState] = useState<State>(
    song.lyrics
      ? { status: 'ok', lyrics: song.lyrics }
      : { status: 'loading' },
  );

  // Cierra con la tecla Escape y bloquea el scroll del fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Si no hay letra escrita, la buscamos por artista + título.
  useEffect(() => {
    if (song.lyrics) return;
    let cancel = false;

    async function fetchLyrics() {
      if (!song.artist) {
        setState({ status: 'empty' });
        return;
      }
      try {
        const res = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(
            song.artist,
          )}/${encodeURIComponent(song.title)}`,
        );
        const data = await res.json().catch(() => null);
        const lyrics: string | undefined = data?.lyrics?.trim();
        if (cancel) return;
        setState(lyrics ? { status: 'ok', lyrics } : { status: 'empty' });
      } catch {
        if (!cancel) setState({ status: 'empty' });
      }
    }

    fetchLyrics();
    return () => {
      cancel = true;
    };
  }, [song]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-black/60 "
        onClick={onClose}
      />

      {/* Hoja */}
      <motion.div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden
          rounded-none border border-rule bg-cream-surface
          "
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Agarradera (móvil) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-cream-border" />
        </div>

        {/* Encabezado */}
        <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
          {song.cover && (
            <img
              src={song.cover}
              alt=""
              className="h-11 w-11 shrink-0 rounded-md object-cover ring-1 ring-cream-border"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate display text-xl font-medium leading-tight text-ink">
              {song.title}
            </p>
            {song.artist && (
              <p className="truncate text-xs uppercase tracking-[0.15em] text-ink-soft">
                {song.artist}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule text-ink-soft transition hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="overflow-y-auto px-6 py-6">
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10 text-ink-soft">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-wine/30 border-t-wine" />
              <p className="text-sm">Buscando la letra...</p>
            </div>
          )}

          {state.status === 'empty' && (
            <div className="py-10 text-center">
              <p className="text-sm text-ink-soft">
                No encontré la letra de esta canción.
              </p>
              {!song.artist && (
                <p className="mt-2 text-xs text-ink-soft/70">
                  Tip: añade el artista en <code>songs.ts</code> para poder
                  buscarla automáticamente.
                </p>
              )}
            </div>
          )}

          {state.status === 'ok' && (
            <>
              <p className="whitespace-pre-wrap display text-lg leading-relaxed text-ink-soft">
                {state.lyrics}
              </p>
              <p className="mt-8 text-center text-[11px] uppercase tracking-[0.2em] text-ink-soft/40">
                Letra con fines personales
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
