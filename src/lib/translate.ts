// ─────────────────────────────────────────────────────────────
//  Traducción al español de la letra (para canciones en inglés).
//  Usa el endpoint público de Google Translate (gratis, con CORS).
//  Traduce por lotes conservando una línea por verso, para que la
//  traducción quede alineada debajo de cada línea del karaoke.
// ─────────────────────────────────────────────────────────────

export interface Translated {
  /** Traducción al español, una entrada por cada línea de entrada. */
  lines: string[];
  /** Idioma de origen detectado (ej. "en", "es"). */
  source: string;
}

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

async function translateChunk(
  chunk: string[],
  signal?: AbortSignal,
): Promise<{ out: string[]; source: string }> {
  const q = encodeURIComponent(chunk.join('\n'));
  const url = `${ENDPOINT}?client=gtx&sl=auto&tl=es&dt=t&q=${q}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('translate failed');

  const data = await res.json();
  const source: string = data?.[2] || 'auto';
  const joined: string = (data?.[0] as unknown[])
    .map((s) => (s as string[])[0])
    .join('');
  const out = joined.split('\n').map((l) => l.trim());
  return { out, source };
}

/**
 * Traduce líneas al español. Devuelve una traducción por línea (misma
 * cantidad que la entrada) o `null` si el texto ya está en español o
 * si algo falla. `source` indica el idioma detectado.
 */
export async function translateToSpanish(
  texts: string[],
  signal?: AbortSignal,
): Promise<Translated | null> {
  if (!texts.length) return null;

  const CHUNK = 20;
  const result: string[] = [];
  let source = 'auto';

  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK);
    const { out, source: s } = await translateChunk(chunk, signal);
    source = s;

    // Si el original ya está en español, no hace falta traducir.
    if (source === 'es') return null;

    if (out.length === chunk.length) {
      result.push(...out);
    } else {
      // Desajuste raro de segmentos: traduce línea por línea para no
      // perder la alineación verso ↔ traducción.
      for (const line of chunk) {
        const { out: o } = await translateChunk([line], signal);
        result.push(o.join(' ').trim());
      }
    }
  }

  return result.length === texts.length ? { lines: result, source } : null;
}
