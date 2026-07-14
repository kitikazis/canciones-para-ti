import { useState } from 'react';

/** Extrae el ID de un enlace de YouTube (watch, youtu.be o embed). */
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

interface Props {
  videoId: string;
  cover?: string;
  title: string;
}

export default function YouTubePlayer({ videoId, cover, title }: Props) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={`Reproductor de ${title}`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // Portada con botón de play (carga el video solo al tocarlo).
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Reproducir ${title}`}
      className="group relative block aspect-video w-full overflow-hidden"
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-wine to-wine-deep" />
      )}

      {/* Velo oscuro para dar contraste al botón */}
      <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/25" />

      {/* Botón de play */}
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-wine shadow-lg transition group-hover:scale-105 group-active:scale-95">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>

      {/* Etiqueta discreta */}
      <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
        Reproducir
      </span>
    </button>
  );
}
