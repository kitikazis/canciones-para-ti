import { useEffect, useRef, useState } from 'react';
import { track, WatchTimer } from '../lib/track';

/** Extrae el ID de un enlace de YouTube (watch, youtu.be o embed). */
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Carga de la IFrame Player API de YouTube ──────────────────
//
// Un <iframe> normal es una caja negra: no avisa de nada. Para saber si
// le dio play, cuándo pausó y cuánto vio de verdad hay que usar esta API,
// que carga un script global y nos deja escuchar los cambios de estado.
// El script se pide UNA sola vez aunque haya diez canciones en la página.
let apiPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const w = window as any;
    if (w.YT?.Player) return resolve(w.YT);

    // YouTube llama a esta función global cuando el script está listo.
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(w.YT);
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
  return apiPromise;
}

interface Props {
  videoId: string;
  cover?: string;
  title: string;
  artist?: string;
}

export default function YouTubePlayer({ videoId, cover, title, artist }: Props) {
  const [playing, setPlaying] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!playing || !hostRef.current) return;

    let cancelled = false;
    let interval: number | undefined;
    const base = {
      song: title,
      artist,
      source: 'youtube' as const,
      meta: { videoId },
    };
    const timer = new WatchTimer(base);

    // Segundo actual del video (envuelto porque la API puede no estar lista).
    const at = (): number | undefined => {
      try {
        return playerRef.current?.getCurrentTime?.();
      } catch {
        return undefined;
      }
    };
    const total = (): number | undefined => {
      try {
        return playerRef.current?.getDuration?.();
      } catch {
        return undefined;
      }
    };

    // Si cierra la pestaña a media canción, mandamos el último tramo con
    // `keepalive` para que no se pierda.
    const onLeave = () => timer.flush(at(), true);
    window.addEventListener('pagehide', onLeave);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;

      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            timer.update({ duration: e.target?.getDuration?.() });
          },
          onStateChange: (e: any) => {
            const state = e.data;
            const common = { ...base, position: at(), duration: total() };

            if (state === YT.PlayerState.PLAYING) {
              timer.start();
              track('play', common);
              // Vamos mandando lo visto cada 20 s: así, aunque se cierre
              // el navegador de golpe, no se pierde casi nada.
              window.clearInterval(interval);
              interval = window.setInterval(() => timer.flush(at()), 20_000);
            } else if (state === YT.PlayerState.PAUSED) {
              window.clearInterval(interval);
              timer.flush(at());
              track('pause', common);
            } else if (state === YT.PlayerState.ENDED) {
              window.clearInterval(interval);
              timer.flush(at());
              track('ended', { ...common, seconds: Math.round(timer.watched) });
            } else if (state === YT.PlayerState.BUFFERING) {
              // Se quedó cargando: paramos la cuenta pero no enviamos aún.
              timer.pause();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('pagehide', onLeave);
      timer.flush(at(), true);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* el reproductor ya no existe */
      }
      playerRef.current = null;
    };
  }, [playing, videoId, title, artist]);

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden bg-black">
        {/* YouTube SUSTITUYE este div por su iframe, por eso va dentro de
            otro que React sí controla. */}
        <div ref={hostRef} className="h-full w-full" />
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
