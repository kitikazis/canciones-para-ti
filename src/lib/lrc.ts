// ─────────────────────────────────────────────────────────────
//  Letra sincronizada (karaoke).
//  Lee el formato LRC («[00:12.30] línea») y busca la letra con
//  tiempos automáticamente en lrclib.net (gratis, sin clave).
// ─────────────────────────────────────────────────────────────

export interface LrcLine {
  /** Momento (en segundos) en que empieza esta línea. */
  time: number;
  /** Texto de la línea. */
  text: string;
}

// Etiqueta de tiempo tipo [mm:ss.xx] (los centésimos/milésimos son opcionales).
const TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** Convierte texto LRC en líneas con su tiempo en segundos, ordenadas. */
export function parseLrc(lrc: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const tags = [...raw.matchAll(TAG)];
    if (!tags.length) continue;
    const text = raw.replace(TAG, '').trim();
    if (!text) continue; // saltamos líneas vacías / solo instrumentales
    for (const m of tags) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const frac = m[3] ? Number((m[3] + '000').slice(0, 3)) / 1000 : 0;
      out.push({ time: min * 60 + sec + frac, text });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

/** Índice de la línea activa para el tiempo `t` (la última cuyo tiempo ≤ t). */
export function activeLine(lines: LrcLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let res = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) {
      res = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return res;
}

interface LrcResult {
  syncedLyrics?: string | null;
  duration?: number;
}

/**
 * Busca la letra sincronizada por artista + título en lrclib.net.
 * Devuelve las líneas con tiempos, o `null` si no hay versión sincronizada.
 * Si se pasa `duration` (segundos del audio), prefiere el resultado de
 * duración más parecida para acertar con la versión correcta.
 */
export async function fetchSyncedLyrics(
  artist: string,
  title: string,
  duration?: number,
  signal?: AbortSignal,
): Promise<LrcLine[] | null> {
  const url =
    `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}` +
    `&track_name=${encodeURIComponent(title)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;

  const data: LrcResult[] = await res.json().catch(() => []);
  const withSync = data.filter((r) => r.syncedLyrics);
  if (!withSync.length) return null;

  // Elige la versión más cercana en duración si conocemos la del audio.
  const best =
    duration && duration > 0
      ? withSync.reduce((a, b) =>
          Math.abs((b.duration ?? 0) - duration) <
          Math.abs((a.duration ?? 0) - duration)
            ? b
            : a,
        )
      : withSync[0];

  const lines = parseLrc(best.syncedLyrics as string);
  return lines.length ? lines : null;
}
