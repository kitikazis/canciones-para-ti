// ─────────────────────────────────────────────────────────────
//  El color de acento sale de la carátula que está sonando.
//
//  Es lo que hace que la página cambie de temperatura con cada
//  canción en vez de tener una paleta fija: con una portada fría la
//  web se enfría, con una cálida se calienta.
//
//  Funciona porque el CDN de las carátulas responde con
//  `Access-Control-Allow-Origin: *`; sin eso, el navegador marcaría
//  el lienzo como contaminado y no dejaría leer los píxeles.
// ─────────────────────────────────────────────────────────────

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Color de reserva cuando no hay carátula o no se puede leer. */
export const DEFAULT_ACCENT: Rgb = { r: 176, g: 122, b: 96 };

// Una carátula solo se analiza una vez por sesión.
const cache = new Map<string, Rgb>();

function toHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function toRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: Math.round(channel(h + 1 / 3) * 255),
    g: Math.round(channel(h) * 255),
    b: Math.round(channel(h - 1 / 3) * 255),
  };
}

/**
 * Ajusta el color para que sirva de acento sobre fondo oscuro.
 *
 * Un color sacado de una foto puede ser precioso y a la vez ilegible:
 * demasiado oscuro se pierde contra el fondo, demasiado pálido se
 * lava. Aquí se le fija un rango de luminosidad y saturación, así
 * cualquier carátula produce un acento que se ve.
 */
function makeUsable(c: Rgb): Rgb {
  const { h, s, l } = toHsl(c.r, c.g, c.b);
  const s2 = Math.min(0.78, Math.max(0.42, s));
  const l2 = Math.min(0.68, Math.max(0.52, l));
  return toRgb(h, s2, l2);
}

/**
 * Busca el color más característico de una imagen.
 *
 * No vale la media de todos los píxeles: eso da siempre un barro
 * grisáceo. Se agrupan los píxeles por tono, se descartan los muy
 * oscuros, muy claros y muy grises, y gana el grupo con más peso,
 * contando cada píxel según lo vivo que sea.
 */
export function accentFromImage(url: string): Promise<Rgb> {
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);

  return new Promise((resolve) => {
    const done = (c: Rgb) => {
      cache.set(url, c);
      resolve(c);
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = () => done(DEFAULT_ACCENT);
    img.onload = () => {
      try {
        const size = 48; // suficiente para el tono; más sería tiempo tirado
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return done(DEFAULT_ACCENT);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        // 18 cajones de tono (20 grados cada uno).
        const bins = new Array(18).fill(null).map(() => ({
          weight: 0,
          r: 0,
          g: 0,
          b: 0,
        }));

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue; // píxel transparente
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const { h, s, l } = toHsl(r, g, b);
          if (l < 0.12 || l > 0.92 || s < 0.18) continue; // sin carácter

          const bin = bins[Math.min(17, Math.floor(h * 18))];
          const w = s * (1 - Math.abs(l - 0.5)); // vivo y ni negro ni blanco
          bin.weight += w;
          bin.r += r * w;
          bin.g += g * w;
          bin.b += b * w;
        }

        const best = bins.reduce((a, b) => (b.weight > a.weight ? b : a));
        if (best.weight <= 0) return done(DEFAULT_ACCENT);

        done(
          makeUsable({
            r: Math.round(best.r / best.weight),
            g: Math.round(best.g / best.weight),
            b: Math.round(best.b / best.weight),
          }),
        );
      } catch {
        // Lienzo contaminado (el CDN dejó de mandar CORS) u otro fallo.
        done(DEFAULT_ACCENT);
      }
    };

    img.src = url;
  });
}

/** Formato que espera Tailwind en las variables: "244 63 94". */
export function rgbTriple(c: Rgb): string {
  return `${c.r} ${c.g} ${c.b}`;
}
