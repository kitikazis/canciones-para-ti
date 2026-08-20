import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Song } from '../data/songs';
import { activeLine, fetchSyncedLyrics, parseLrc, type LrcLine } from '../lib/lrc';
import { translateToSpanish } from '../lib/translate';
import { accentFromImage, rgbTriple, DEFAULT_ACCENT } from '../lib/palette';
import { track, WatchTimer } from '../lib/track';
import YouTubePlayer, { youtubeId } from './YouTubePlayer';
import LyricsSheet from './LyricsSheet';

interface Props {
  list: Song[];
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

/**
 * El reproductor manda: hay UNO por sección, no uno por canción. La
 * carátula ocupa la pantalla, el título va debajo a tamaño de cartel y
 * el resto del repertorio se consulta en la lista de abajo.
 */
export default function Player({ list }: Props) {
  const [index, setIndex] = useState(0);
  const song = list[index];

  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sheet, setSheet] = useState(false);

  const ytId = youtubeId(song?.youtubeUrl);
  const isAudio = Boolean(song?.audio);

  // ── El acento sale de la carátula ──
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  useEffect(() => {
    let alive = true;
    if (!song?.cover) {
      setAccent(DEFAULT_ACCENT);
      return;
    }
    accentFromImage(song.cover).then((c) => alive && setAccent(c));
    return () => {
      alive = false;
    };
  }, [song?.cover]);

  // ── Letra sincronizada ──
  const manual = useMemo(
    () => (song?.syncedLyrics ? parseLrc(song.syncedLyrics) : null),
    [song?.syncedLyrics],
  );
  const [lines, setLines] = useState<LrcLine[] | null>(manual);
  const [trans, setTrans] = useState<string[] | null>(null);

  useEffect(() => {
    setLines(manual);
    setTrans(null);
    setShowLyrics(false);
  }, [manual, index]);

  useEffect(() => {
    if (manual || !song?.artist) return;
    const ctrl = new AbortController();
    fetchSyncedLyrics(song.artist, song.title, dur || undefined, ctrl.signal)
      .then((r) => r && setLines(r))
      .catch(() => {});
    return () => ctrl.abort();
  }, [manual, song?.artist, song?.title, dur]);

  // Traducción al español, con caché para que la segunda vez sea instantánea.
  useEffect(() => {
    if (!lines?.length || !song) return;
    const key = `tr_es_${song.title}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) {
        setTrans(cached ? (JSON.parse(cached) as string[]) : null);
        return;
      }
    } catch {
      /* sin caché disponible */
    }
    const ctrl = new AbortController();
    translateToSpanish(lines.map((l) => l.text), ctrl.signal)
      .then((r) => {
        const ok = r && r.lines.length === lines.length ? r.lines : null;
        setTrans(ok);
        try {
          localStorage.setItem(key, ok ? JSON.stringify(ok) : '');
        } catch {
          /* ignoramos */
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [lines, song?.title]);

  // ── Volumen ──
  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.volume = volume;
      el.muted = muted;
    }
  }, [volume, muted]);

  // ── Registro de escucha ──
  // Un contador por pista: al cambiar de canción, el de la anterior
  // vuelca lo que llevaba antes de morir.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !song) return;

    const base = { song: song.title, artist: song.artist, source: 'audio' as const };
    const timer = new WatchTimer(base);
    let interval: number | undefined;

    const total = () => (isFinite(el.duration) ? el.duration : undefined);
    const info = () => ({ ...base, position: el.currentTime, duration: total() });

    const onPlay = () => {
      timer.update({ duration: total() });
      timer.start();
      track('play', info());
      window.clearInterval(interval);
      interval = window.setInterval(() => timer.flush(el.currentTime), 20_000);
    };
    const onPause = () => {
      if (el.ended) return; // 'ended' ya lo registra; no lo contamos dos veces
      window.clearInterval(interval);
      timer.flush(el.currentTime);
      track('pause', info());
    };
    const onEnded = () => {
      window.clearInterval(interval);
      timer.flush(el.currentTime);
      track('ended', { ...info(), seconds: Math.round(timer.watched) });
    };
    const onLeave = () => timer.flush(el.currentTime, true);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    window.addEventListener('pagehide', onLeave);

    return () => {
      window.clearInterval(interval);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      window.removeEventListener('pagehide', onLeave);
      timer.flush(el.currentTime, true);
    };
  }, [index, song?.title, song?.artist]);

  // ── Pasar de pista ──
  const go = useCallback(
    (next: number, autoplay = true) => {
      const n = (next + list.length) % list.length;
      setIndex(n);
      setCur(0);
      setDur(0);
      if (autoplay) {
        // El elemento aún no tiene la fuente nueva: esperamos un tic.
        window.setTimeout(() => audioRef.current?.play().catch(() => {}), 60);
      }
    },
    [list.length],
  );

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      setLoading(true);
      el.play().finally(() => setLoading(false));
    } else {
      el.pause();
    }
  }

  // ── Pantalla completa (para el karaoke) ──
  async function enterFullscreen() {
    setFullscreen(true);
    const el = rootRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> })
      | null;
    try {
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* algunos navegadores lo rechazan: seguimos en pantalla completa falsa */
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

  // Si sale con Escape o el botón atrás, sincronizamos el estado.
  useEffect(() => {
    const onChange = () => {
      const d = document as Document & { webkitFullscreenElement?: Element };
      if (!d.fullscreenElement && !d.webkitFullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  if (!song) return null;

  const active = lines ? activeLine(lines, cur + 0.2) : -1;
  const hasLyrics = Boolean(lines?.length);
  const upNext = list.map((s, i) => ({ s, i })).filter(({ i }) => i !== index);

  return (
    <div
      ref={rootRef}
      style={{ ['--accent' as string]: rgbTriple(accent) }}
      className={fullscreen ? 'fixed inset-0 z-[120] overflow-y-auto bg-cream-bg' : ''}
    >
      {/* ── Carátula ── */}
      <div className="relative aspect-square w-full overflow-hidden bg-cream-surface">
        {isAudio ? (
          <>
            {song.cover ? (
              <motion.img
                key={song.cover}
                src={song.cover}
                alt={`Carátula de ${song.title}`}
                crossOrigin="anonymous"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-cream-surface" />
            )}

            {/* La carátula se funde con el fondo: el título de abajo
                queda dentro de la imagen, no pegado a ella. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream-bg" />

            {/* Karaoke encima de la portada */}
            <AnimatePresence>
              {showLyrics && hasLyrics && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[rgb(var(--ground))]/88"
                >
                  <LyricScroll
                    lines={lines!}
                    trans={trans}
                    active={active}
                    big={fullscreen}
                    onSeek={(t) => {
                      if (audioRef.current) audioRef.current.currentTime = t;
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controles de la esquina */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <span className="k rounded-[2px] bg-[rgb(var(--ground))]/60 px-2 py-1 text-ink">
                {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-2">
                {hasLyrics && (
                  <button
                    onClick={() => setShowLyrics((s) => !s)}
                    aria-pressed={showLyrics}
                    className={`k rounded-[2px] px-2.5 py-1 transition-colors ${
                      showLyrics
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--ground))]'
                        : 'bg-[rgb(var(--ground))]/60 text-ink hover:text-ink'
                    }`}
                  >
                    Letra
                  </button>
                )}
                {(song.cover || hasLyrics) && (
                  <button
                    onClick={fullscreen ? exitFullscreen : enterFullscreen}
                    aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    className="k rounded-[2px] bg-[rgb(var(--ground))]/60 px-2.5 py-1 text-ink"
                  >
                    {fullscreen ? 'Cerrar' : 'Ampliar'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : ytId ? (
          <YouTubePlayer
            videoId={ytId}
            cover={song.cover}
            title={song.title}
            artist={song.artist}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="k">Sin reproductor</p>
          </div>
        )}
      </div>

      {/* ── Ficha y controles ── */}
      <div className="relative -mt-10 px-5 sm:px-6">
        <h2 className="display text-[2.4rem] sm:text-[3rem]">{song.title}</h2>
        {song.artist && <p className="k mt-2.5">{song.artist}</p>}

        {isAudio && (
          <>
            <audio
              ref={audioRef}
              src={song.audio}
              preload="none"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
              onEnded={() => go(index + 1)}
            />

            <input
              type="range"
              className="track-bar mt-6 w-full"
              min={0}
              max={dur || 0}
              step={0.1}
              value={cur}
              onChange={(e) => {
                const t = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = t;
                setCur(t);
              }}
              aria-label="Posición de la canción"
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="k tnum">{fmt(cur)}</span>
              <span className="k tnum">{fmt(dur)}</span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-9">
              <button
                onClick={() => go(index - 1)}
                aria-label="Anterior"
                className="text-muted transition-colors hover:text-ink"
              >
                <SkipIcon back />
              </button>

              <button
                onClick={toggle}
                aria-label={playing ? 'Pausar' : 'Reproducir'}
                className="flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95"
                style={{ background: 'rgb(var(--accent))' }}
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--ground))]/40 border-t-[rgb(var(--ground))]" />
                ) : playing ? (
                  <PauseIcon />
                ) : (
                  <PlayIcon />
                )}
              </button>

              <button
                onClick={() => go(index + 1)}
                aria-label="Siguiente"
                className="text-muted transition-colors hover:text-ink"
              >
                <SkipIcon />
              </button>
            </div>

            {/* Volumen: solo en escritorio; en móvil están los botones
                físicos del teléfono. */}
            <div className="mt-5 hidden items-center gap-3 sm:flex">
              <button
                onClick={() => setMuted((m) => !m)}
                className="k hover:text-ink"
                aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              >
                {muted ? 'Silencio' : 'Volumen'}
              </button>
              <input
                type="range"
                className="track-bar w-28"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setMuted(v === 0);
                }}
                aria-label="Volumen"
              />
            </div>
          </>
        )}

        {/* Notas de la canción */}
        {(song.why || song.lyric) && (
          <div className="mt-8 border-t border-rule pt-6">
            {song.why && <p className="copy">{song.why}</p>}
            {song.lyric && (
              <p className="copy mt-4 text-ink">«{song.lyric}»</p>
            )}
          </div>
        )}

        {/* Enlaces */}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track('open_link', {
                  song: song.title,
                  artist: song.artist,
                  source: 'spotify',
                  meta: { url: song.spotifyUrl },
                })
              }
              className="btn-quiet"
            >
              Spotify
            </a>
          )}
          {/* Letra completa: solo cuando no hay karaoke sincronizado,
              porque si lo hay ya se lee sobre la carátula. */}
          {!hasLyrics && (song.lyrics || song.artist) && (
            <button
              onClick={() => {
                setSheet(true);
                track('lyrics', { song: song.title, artist: song.artist });
              }}
              className="btn-quiet"
            >
              Letra
            </button>
          )}
          {ytId && (
            <a
              href={`https://www.youtube.com/watch?v=${ytId}`}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track('open_link', {
                  song: song.title,
                  artist: song.artist,
                  source: 'youtube',
                  meta: { videoId: ytId },
                })
              }
              className="btn-quiet"
            >
              YouTube
            </a>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sheet && <LyricsSheet song={song} onClose={() => setSheet(false)} />}
      </AnimatePresence>

      {/* ── A continuación ── */}
      {upNext.length > 0 && !fullscreen && (
        <div className="mt-10 px-5 sm:px-6">
          <p className="k border-t border-rule pt-4">A continuación</p>
          <ul className="mt-1">
            {upNext.map(({ s, i }) => (
              <li key={`${s.title}-${i}`}>
                <button
                  onClick={() => go(i)}
                  className="flex w-full items-center gap-3.5 border-b border-rule py-3 text-left transition-opacity hover:opacity-70"
                >
                  {s.cover ? (
                    <img
                      src={s.cover}
                      alt=""
                      className="h-11 w-11 shrink-0 object-cover"
                    />
                  ) : (
                    <span className="h-11 w-11 shrink-0 bg-cream-surface" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-ink">
                      {s.title}
                    </span>
                    {s.artist && (
                      <span className="k mt-1 block truncate">{s.artist}</span>
                    )}
                  </span>
                  <span className="k tnum shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Letra que se desplaza sola ───────────────────────────────────────
function LyricScroll({
  lines,
  trans,
  active,
  big,
  onSeek,
}: {
  lines: LrcLine[];
  trans: string[] | null;
  active: number;
  big: boolean;
  onSeek: (t: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = refs.current[active];
    const box = scrollRef.current;
    if (!el || !box) return;
    box.scrollTo({
      top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-6 text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="h-1/2" aria-hidden />
      {lines.map((ln, i) => (
        <button
          key={i}
          ref={(el) => (refs.current[i] = el)}
          onClick={() => onSeek(ln.time)}
          className="block w-full py-1.5 text-center"
        >
          <span
            className={`block leading-snug transition-colors duration-300 ${
              big ? 'text-2xl sm:text-4xl' : 'text-lg'
            } ${i === active ? 'font-semibold text-ink' : 'text-faint'}`}
          >
            {ln.text}
          </span>
          {trans?.[i] && (
            <span
              className={`mt-0.5 block leading-snug transition-colors duration-300 ${
                big ? 'text-base sm:text-xl' : 'text-xs'
              }`}
              style={{ color: i === active ? 'rgb(var(--accent))' : undefined }}
            >
              {trans[i]}
            </span>
          )}
        </button>
      ))}
      <div className="h-1/2" aria-hidden />
    </div>
  );
}

// ── Íconos ───────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(var(--ground))" className="ml-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgb(var(--ground))">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function SkipIcon({ back }: { back?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={back ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M6 5v14l9-7zM17 5h2v14h-2z" />
    </svg>
  );
}
