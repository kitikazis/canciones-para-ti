// ─────────────────────────────────────────────────────────────
//  Registro de actividad del visitante.
//
//  Todo lo de aquí es "dispara y olvida": si Supabase falla o no está
//  configurado, la web sigue funcionando igual. El seguimiento NUNCA
//  debe romper la experiencia de quien está viendo la página.
// ─────────────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from './supabase';

const NAME_KEY = 'visitor_name';
const ID_KEY = 'visitor_id';
const SESSION_KEY = 'session_id';

/** Tipos de evento que registramos. */
export type EventType =
  | 'enter' // escribió su nombre y abrió la carta
  | 'page_view' // cargó la página
  | 'tab' // cambió de sección (Inicio / Vannia / Yamir)
  | 'play' // le dio play a una canción o video
  | 'pause' // la pausó
  | 'progress' // tramo de segundos realmente vistos
  | 'ended' // la terminó
  | 'lyrics' // abrió la letra
  | 'open_link' // se fue a Spotify / YouTube
  | 'message'; // envió un mensaje

export interface TrackPayload {
  song?: string;
  artist?: string;
  source?: 'youtube' | 'audio' | 'spotify';
  position?: number;
  duration?: number;
  seconds?: number;
  meta?: Record<string, unknown>;
}

function uuid(): string {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {
    /* seguimos con el respaldo */
  }
  // Respaldo para navegadores viejos o contextos sin crypto.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function safeGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    /* modo incógnito o almacenamiento lleno: seguimos sin guardar */
  }
}

/**
 * Id estable de la persona. Se crea una sola vez y vive en localStorage,
 * así el mismo visitante se reconoce aunque vuelva otro día.
 */
export function visitorId(): string {
  let id = safeGet(localStorage, ID_KEY);
  if (!id) {
    id = uuid();
    safeSet(localStorage, ID_KEY, id);
  }
  return id;
}

/** Nombre que escribió al entrar. */
export function visitorName(): string | null {
  return safeGet(localStorage, NAME_KEY);
}

/**
 * Id de ESTA visita. Vive en sessionStorage, así que al cerrar la pestaña
 * se renueva: sirve para separar "vino tres veces" de "estuvo una hora".
 */
export function sessionId(): string {
  let s = safeGet(sessionStorage, SESSION_KEY);
  if (!s) {
    s = uuid();
    safeSet(sessionStorage, SESSION_KEY, s);
  }
  return s;
}

function buildRow(type: EventType, p: TrackPayload) {
  return {
    visitor_id: visitorId(),
    visitor_name: visitorName(),
    session_id: sessionId(),
    type,
    song_title: p.song ?? null,
    song_artist: p.artist ?? null,
    source: p.source ?? null,
    position: p.position != null ? Math.round(p.position) : null,
    duration: p.duration != null ? Math.round(p.duration) : null,
    seconds: p.seconds != null ? Math.round(p.seconds) : null,
    meta: p.meta ?? null,
  };
}

/** Registra un evento. No espera respuesta ni lanza errores. */
export function track(type: EventType, p: TrackPayload = {}) {
  if (!isSupabaseConfigured || !supabase) return;
  supabase
    .from('events')
    .insert(buildRow(type, p))
    .then(({ error }) => {
      if (error) console.debug('[track] no se pudo registrar:', error.message);
    });
}

/**
 * Igual que `track`, pero pensado para cuando la página se está cerrando.
 * Usa `keepalive`, que le pide al navegador que termine de enviar la
 * petición aunque la pestaña ya no exista. `supabase-js` no lo hace, por
 * eso aquí llamamos a la API REST a pelo.
 */
export function trackBeacon(type: EventType, p: TrackPayload = {}) {
  if (!isSupabaseConfigured) return;
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  try {
    fetch(`${url}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(buildRow(type, p)),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* si falla, no pasa nada: es solo el último tramo */
  }
}

/**
 * Contador de tiempo REALMENTE visto.
 *
 * No sirve mirar la duración del video: hay que medir el tiempo de reloj
 * mientras está sonando, y parar la cuenta al pausar, al cambiar de
 * pestaña o al cerrar. Esta clase lleva esa cuenta y va enviando los
 * segundos acumulados en tramos, para que no se pierda todo si el
 * visitante cierra de golpe.
 */
export class WatchTimer {
  private startedAt: number | null = null;
  private pending = 0;
  private total = 0;

  constructor(private base: TrackPayload) {}

  /** Datos del medio (por si la duración se conoce más tarde). */
  update(base: Partial<TrackPayload>) {
    this.base = { ...this.base, ...base };
  }

  /** Empieza (o reanuda) a contar. */
  start() {
    if (this.startedAt == null) this.startedAt = Date.now();
  }

  /**
   * Deja de contar y guarda lo acumulado, sin enviar todavía.
   * Se usa cuando el video se queda cargando (buffering): no queremos
   * contar ese tiempo como visto, pero tampoco generar una fila por cada
   * microcorte.
   */
  pause() {
    if (this.startedAt == null) return;
    const secs = (Date.now() - this.startedAt) / 1000;
    this.startedAt = null;
    // Descartamos tramos absurdos (el portátil estuvo suspendido, etc.).
    if (secs > 0 && secs < 60 * 60) {
      this.pending += secs;
      this.total += secs;
    }
  }

  /** Segundos vistos en total durante esta visita. */
  get watched(): number {
    const live =
      this.startedAt != null ? (Date.now() - this.startedAt) / 1000 : 0;
    return this.total + live;
  }

  /**
   * Envía los segundos acumulados desde el último envío.
   * `beacon` = true cuando la página se está cerrando.
   */
  flush(position?: number, beacon = false) {
    this.pause();
    if (this.pending < 1) return; // menos de un segundo no merece una fila
    const seconds = this.pending;
    this.pending = 0;
    const payload: TrackPayload = {
      ...this.base,
      position,
      seconds,
      meta: { ...(this.base.meta ?? {}), total: Math.round(this.total) },
    };
    if (beacon) trackBeacon('progress', payload);
    else track('progress', payload);
  }
}
