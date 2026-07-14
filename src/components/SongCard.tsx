import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Song } from '../data/songs';
import LyricsSheet from './LyricsSheet';
import YouTubePlayer, { youtubeId } from './YouTubePlayer';
import AudioPlayer from './AudioPlayer';

interface Props {
  song: Song;
  index: number;
}

// Convierte un enlace normal de Spotify en la URL del reproductor incrustado.
function spotifyEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/track\/([A-Za-z0-9]+)/);
  return match ? `https://open.spotify.com/embed/track/${match[1]}` : null;
}

export default function SongCard({ song, index }: Props) {
  const ytId = youtubeId(song.youtubeUrl);
  const embedUrl = spotifyEmbedUrl(song.spotifyUrl);
  const number = String(index + 1).padStart(2, '0');
  const [showLyrics, setShowLyrics] = useState(false);

  // Se puede ver la letra si la escribiste, o si hay artista para buscarla.
  const canShowLyrics = Boolean(song.lyrics || song.artist);

  return (
    <motion.article
      className="overflow-hidden rounded-2xl border border-cream-border bg-cream-surface shadow-soft"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {/* Reproductor protagonista: MP3 propio > YouTube */}
      {song.audio ? (
        <AudioPlayer
          src={song.audio}
          cover={song.cover}
          title={song.title}
          artist={song.artist}
          syncedLyrics={song.syncedLyrics}
        />
      ) : ytId ? (
        <YouTubePlayer videoId={ytId} cover={song.cover} title={song.title} />
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-sm tracking-widest text-gold/70">
            {number}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-2xl font-medium leading-tight text-ink sm:text-3xl">
              {song.title}
            </h3>
            {song.artist && (
              <p className="mt-0.5 truncate text-xs uppercase tracking-[0.15em] text-ink-soft">
                {song.artist}
              </p>
            )}
          </div>
        </div>

        {song.why && (
          <p className="mt-4 font-display text-lg italic leading-relaxed text-ink-soft">
            {song.why}
          </p>
        )}

        {song.lyric && (
          <blockquote className="mt-4 border-l border-gold/50 pl-4 text-sm leading-relaxed text-ink-soft">
            «{song.lyric}»
          </blockquote>
        )}

        {/* Respaldo: si no hay MP3 ni YouTube, usa el reproductor de Spotify */}
        {!song.audio && !ytId && embedUrl && (
          <div className="mt-5 overflow-hidden rounded-xl">
            <iframe
              src={embedUrl}
              title={`Reproductor de ${song.title}`}
              width="100%"
              height={152}
              frameBorder={0}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="rounded-xl"
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-listen"
              title="Escuchar en Spotify"
            >
              <SpotifyIcon />
              Spotify
            </a>
          )}
          {canShowLyrics && (
            <button onClick={() => setShowLyrics(true)} className="btn-listen">
              <LyricsIcon />
              Ver letra
            </button>
          )}
          {ytId && (
            <a
              href={`https://www.youtube.com/watch?v=${ytId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-listen"
              title="Si no se reproduce aquí, ábrelo en YouTube"
            >
              <ExternalIcon />
              YouTube
            </a>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLyrics && (
          <LyricsSheet song={song} onClose={() => setShowLyrics(false)} />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function LyricsIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.59 14.44a.62.62 0 0 1-.86.21c-2.35-1.44-5.31-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.3.18.39.56.21.85zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.66-6.79-2.13-9.98-1.17a.78.78 0 1 1-.45-1.5c3.64-1.1 8.16-.57 11.24 1.32.37.22.49.71.26 1.09zm.11-2.84c-3.23-1.92-8.55-2.1-11.63-1.16a.94.94 0 1 1-.55-1.8c3.53-1.07 9.4-.86 13.12 1.35a.94.94 0 1 1-.95 1.61z" />
    </svg>
  );
}
