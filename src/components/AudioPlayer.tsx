import { useEffect, useMemo, useRef, useState } from 'react';
import { activeLine, fetchSyncedLyrics, parseLrc, type LrcLine } from '../lib/lrc';
import { translateToSpanish } from '../lib/translate';

interface Props {
  src: string;
  cover?: string;
  title: string;
  /** Artista — se usa para buscar la letra sincronizada automáticamente. */
  artist?: string;
  /** Letra sincronizada a mano en formato LRC (opcional, tiene prioridad). */
  syncedLyrics?: string;
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${ss}`;
}

export default function AudioPlayer({ src, cover, title, artist, syncedLyrics }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [loading, setLoading] = useState(false);

  // Volumen (para PC). En móvil se usan los botones del teléfono.
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Letra sincronizada (karaoke).
  const manual = useMemo(
    () => (syncedLyrics ? parseLrc(syncedLyrics) : null),
    [syncedLyrics],
  );
  const [lines, setLines] = useState<LrcLine[] | null>(manual);
  const [showLyrics, setShowLyrics] = useState(true);

  // Traducción al español (para canciones en inglés). null = sin traducción.
  const [trans, setTrans] = useState<string[] | null>(null);

  // Pantalla completa (tipo YouTube).
  const [fullscreen, setFullscreen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Busca la letra con tiempos si no se pasó a mano.
  useEffect(() => {
    if (manual || !artist) return;
    const ctrl = new AbortController();
    fetchSyncedLyrics(artist, title, dur || undefined, ctrl.signal)
      .then((r) => r && setLines(r))
      .catch(() => {});
    return () => ctrl.abort();
  }, [manual, artist, title, dur]);

  // Traduce la letra al español (si está en inglés). Guarda en caché para
  // que la próxima vez sea instantáneo. '' = ya está en español, no traducir.
  useEffect(() => {
    if (!lines || !lines.length) return;
    const key = `tr_es_${title}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) {
        setTrans(cached ? (JSON.parse(cached) as string[]) : null);
        return;
      }
    } catch {
      /* localStorage no disponible: seguimos sin caché */
    }

    const ctrl = new AbortController();
    translateToSpanish(
      lines.map((l) => l.text),
      ctrl.signal,
    )
      .then((r) => {
        const ok = r && r.lines.length === lines.length ? r.lines : null;
        setTrans(ok);
        try {
          localStorage.setItem(key, ok ? JSON.stringify(ok) : '');
        } catch {
          /* ignoramos si no se puede guardar */
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [lines, title]);

  // Aplica el volumen al elemento de audio.
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.volume = volume;
      el.muted = muted;
    }
  }, [volume, muted]);

  // Sincroniza el estado si se sale de pantalla completa con el sistema
  // (tecla Escape, botón «atrás», etc.).
  useEffect(() => {
    const onChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement;
      if (!fsEl) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // Con pantalla completa: cerrar con Escape y bloquear el scroll del fondo
  // (respaldo para navegadores que no soportan la API en un <div>, ej. iOS).
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && exitFullscreen();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  const active = lines ? activeLine(lines, cur + 0.2) : -1;

  // Mantiene centrada la línea que suena mientras avanza la canción.
  // Se recalcula al cambiar de línea, al abrir/cerrar pantalla completa,
  // al mostrar/ocultar la letra y al girar el móvil.
  useEffect(() => {
    const center = (smooth: boolean) => {
      const c = scrollRef.current;
      const el = lineRefs.current[active];
      if (!c || !el) return;
      const top = el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2;
      c.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    };
    center(true);

    const onResize = () => center(false);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [active, fullscreen, showLyrics]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      setLoading(true);
      el.play().finally(() => setLoading(false));
    } else {
      el.pause();
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;
    const t = Number(e.target.value);
    el.currentTime = t;
    setCur(t);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
  }

  async function enterFullscreen() {
    setFullscreen(true);
    const el = rootRef.current as
      | (HTMLDivElement & {
          webkitRequestFullscreen?: () => Promise<void> | void;
        })
      | null;
    try {
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* iOS y algunos navegadores no lo soportan en un <div>: usamos el
         overlay a pantalla completa por CSS, que igual permite girar. */
    }
  }

  function exitFullscreen() {
    const d = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    try {
      if (d.fullscreenElement && d.exitFullscreen) d.exitFullscreen();
      else if (d.webkitFullscreenElement && d.webkitExitFullscreen)
        d.webkitExitFullscreen();
    } catch {
      /* ignoramos */
    }
    setFullscreen(false);
  }

  const hasLyrics = Boolean(lines && lines.length);

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden bg-black ${
        fullscreen
          ? 'fixed inset-0 z-[120] h-full w-full'
          : 'relative aspect-video w-full'
      }`}
    >
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Carátula de fondo */}
      {cover ? (
        <img
          src={cover}
          alt={`Carátula de ${title}`}
          className={`absolute inset-0 h-full w-full object-cover opacity-90 ${
            fullscreen ? 'scale-110 blur-md' : ''
          }`}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-wine to-wine-deep" />
      )}
      <div className="absolute inset-0 bg-black/35" />

      {/* Karaoke: letra sincronizada sobre la carátula */}
      {showLyrics && hasLyrics && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]">
          <div
            ref={scrollRef}
            className="relative h-full overflow-y-auto scroll-smooth px-6 text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Espaciador: permite centrar la primera línea */}
            <div className="h-1/2" aria-hidden />

            {lines!.map((ln, i) => (
              <div
                key={i}
                ref={(el) => (lineRefs.current[i] = el)}
                onClick={() => {
                  if (ref.current) ref.current.currentTime = ln.time;
                }}
                className={`cursor-pointer py-1.5 transition-all duration-300 ${
                  i === active ? 'scale-[1.03]' : ''
                }`}
              >
                <p
                  className={`font-display leading-snug transition-colors duration-300 ${
                    fullscreen ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-xl'
                  } ${
                    i === active
                      ? 'font-medium text-white drop-shadow'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  {ln.text}
                </p>
                {trans && trans[i] && (
                  <p
                    className={`mt-0.5 italic leading-snug transition-colors duration-300 ${
                      fullscreen ? 'text-base sm:text-xl' : 'text-xs sm:text-sm'
                    } ${i === active ? 'text-gold' : 'text-white/30'}`}
                  >
                    {trans[i]}
                  </p>
                )}
              </div>
            ))}

            {/* Espaciador: permite centrar la última línea */}
            <div className="h-1/2" aria-hidden />
          </div>
        </div>
      )}

      {/* Pantalla completa / salir (arriba a la izquierda) */}
      {(cover || hasLyrics) && (
        <button
          type="button"
          onClick={fullscreen ? exitFullscreen : enterFullscreen}
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
          title={fullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur-sm transition hover:text-white"
        >
          {fullscreen ? <MinimizeIcon /> : <ExpandIcon />}
        </button>
      )}

      {/* Controles superiores: volumen (PC) y botón de letra */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {/* Volumen — visible en escritorio */}
        <div className="group hidden items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur-sm sm:flex">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            className="text-white/90 transition hover:text-white"
          >
            <VolumeIcon level={muted ? 0 : volume} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={changeVolume}
            aria-label="Volumen"
            title="Volumen"
            className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 accent-wine opacity-0 transition-all duration-300 group-hover:w-20 group-hover:opacity-100"
          />
        </div>

        {/* Mostrar / ocultar letra sincronizada */}
        {hasLyrics && (
          <button
            type="button"
            onClick={() => setShowLyrics((s) => !s)}
            aria-pressed={showLyrics}
            title={showLyrics ? 'Ocultar letra' : 'Mostrar letra'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition ${
              showLyrics
                ? 'bg-white text-wine'
                : 'bg-black/45 text-white/90 hover:text-white'
            }`}
          >
            <LyricsIcon />
            Letra
          </button>
        )}
      </div>

      {/* Barra inferior: play/pausa + progreso */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent pt-10 ${
          fullscreen ? 'px-6 pb-8' : 'px-4 pb-3'
        }`}
      >
        {/* Play / pausa */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pausar ${title}` : `Reproducir ${title}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-wine shadow-lg transition hover:scale-105 active:scale-95"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-wine/30 border-t-wine" />
          ) : playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="7" y="5" width="4" height="14" rx="1" />
              <rect x="13" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progreso + tiempos */}
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={dur || 0}
            value={cur}
            step={0.1}
            onChange={seek}
            aria-label="Barra de progreso"
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-wine"
          />
          <div className="mt-1.5 flex justify-between text-[11px] font-medium text-white/80">
            <span>{fmt(cur)}</span>
            <span>{fmt(dur)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h6V4M20 14h-6v6M14 10l7-7M3 21l7-7" />
    </svg>
  );
}

function VolumeIcon({ level }: { level: number }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
      {level === 0 ? (
        <path d="m23 9-6 6M17 9l6 6" />
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          {level > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
        </>
      )}
    </svg>
  );
}

function LyricsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </svg>
  );
}
