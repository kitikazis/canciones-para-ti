import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  type Visitor,
  type Message,
  type ActivityEvent,
} from '../lib/supabase';

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Al montar, revisamos si ya hay una sesión iniciada y nos suscribimos
  // a los cambios (login / logout).
  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <CenteredCard>
        <p className="text-sm text-wine-soft">
          Supabase no está configurado. Revisa tu archivo <code>.env</code>.
        </p>
      </CenteredCard>
    );
  }

  if (checkingSession) {
    return (
      <CenteredCard>
        <div className="flex flex-col items-center gap-3 text-ink-soft">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-wine/30 border-t-wine" />
          <p className="text-sm">Cargando...</p>
        </div>
      </CenteredCard>
    );
  }

  return session ? <Dashboard email={session.user.email ?? ''} /> : <Login />;
}

// ── Pantalla de acceso (login real con correo + contraseña) ─────────
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase!.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (authError) {
      setError('Correo o contraseña incorrectos.');
      console.error(authError);
    }
    // Si el login es correcto, onAuthStateChange actualiza la vista solo.
  }

  return (
    <CenteredCard>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-wine/12 text-wine ring-1 ring-wine/25">
          <LockIcon />
        </span>
        <p className="eyebrow">Panel privado</p>
        <h1 className="mt-3 font-display text-4xl font-medium text-gradient">
          Registros
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Inicia sesión para ver quién ha entrado.
        </p>

        <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-3 text-left">
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="username"
            className="field"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            className="field"
          />

          {error && (
            <p className="text-center text-sm text-wine-soft">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <Link
          to="/"
          className="mt-5 inline-block text-xs text-ink-soft transition hover:text-wine"
        >
          ← Volver a la página
        </Link>
      </motion.div>
    </CenteredCard>
  );
}

type Tab = 'visitas' | 'mensajes' | 'actividad';

// ── Panel con pestañas: Visitas, Mensajes y Actividad ───────────────
function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>('visitas');

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function loadVisitors() {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase!
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (e) {
      setError('No se pudieron cargar las visitas.');
      console.error(e);
      return;
    }
    setVisitors(data ?? []);
  }

  async function loadMessages() {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase!
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (e) {
      setError('No se pudieron cargar los mensajes.');
      console.error(e);
      return;
    }
    setMessages(data ?? []);
    setMessagesLoaded(true);
  }

  async function loadEvents() {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase!
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);
    setLoading(false);
    if (e) {
      setError('No se pudo cargar la actividad.');
      console.error(e);
      return;
    }
    setEvents((data ?? []) as ActivityEvent[]);
    setEventsLoaded(true);
  }

  useEffect(() => {
    loadVisitors();
  }, []);

  // Carga los mensajes la primera vez que abres esa pestaña.
  useEffect(() => {
    if (tab === 'mensajes' && !messagesLoaded) loadMessages();
    if (tab === 'actividad' && !eventsLoaded) loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Resúmenes de actividad ──
  // Solo las filas de tipo 'progress' llevan segundos vistos de verdad;
  // las demás son marcas de "hizo esto en tal momento".
  const activity = useMemo(() => {
    const totalSeconds = events.reduce(
      (a, e) => a + (e.type === 'progress' ? e.seconds ?? 0 : 0),
      0,
    );
    const plays = events.filter((e) => e.type === 'play').length;
    const people = new Set(
      events.map((e) => e.visitor_name || e.visitor_id || '?'),
    ).size;
    return { totalSeconds, plays, people };
  }, [events]);

  const bySong = useMemo(() => {
    const m = new Map<
      string,
      { title: string; artist: string | null; seconds: number; plays: number }
    >();
    for (const e of events) {
      if (!e.song_title) continue;
      const cur = m.get(e.song_title) ?? {
        title: e.song_title,
        artist: e.song_artist,
        seconds: 0,
        plays: 0,
      };
      if (e.type === 'progress') cur.seconds += e.seconds ?? 0;
      if (e.type === 'play') cur.plays += 1;
      m.set(e.song_title, cur);
    }
    return [...m.values()].sort((a, b) => b.seconds - a.seconds);
  }, [events]);

  const byPerson = useMemo(() => {
    const m = new Map<
      string,
      { name: string; seconds: number; last: string; list: ActivityEvent[] }
    >();
    for (const e of events) {
      const key = e.visitor_name || e.visitor_id || 'Anónimo';
      const cur = m.get(key) ?? {
        name: key,
        seconds: 0,
        last: e.created_at,
        list: [],
      };
      if (e.type === 'progress') cur.seconds += e.seconds ?? 0;
      if (e.created_at > cur.last) cur.last = e.created_at;
      cur.list.push(e);
      m.set(key, cur);
    }
    return [...m.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [events]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return visitors.filter(
      (v) => new Date(v.created_at).toDateString() === today,
    ).length;
  }, [visitors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((v) => v.name.toLowerCase().includes(q));
  }, [visitors, query]);

  const refresh = () =>
    tab === 'visitas'
      ? loadVisitors()
      : tab === 'mensajes'
        ? loadMessages()
        : loadEvents();

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Panel privado</p>
          <h1 className="mt-2 font-display text-5xl font-medium text-gradient">
            Registros
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Sesión: <span className="text-ink">{email}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="btn-listen" disabled={loading}>
            <RefreshIcon spinning={loading} />
            {loading ? 'Cargando' : 'Actualizar'}
          </button>
          <Link to="/" className="btn-listen">
            Ver página
          </Link>
          <button onClick={() => supabase!.auth.signOut()} className="btn-listen">
            Salir
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mt-8 flex w-full rounded-full border border-cream-border bg-cream-surface p-1 sm:inline-flex sm:w-auto">
        <TabButton active={tab === 'visitas'} onClick={() => setTab('visitas')}>
          Visitas
          <Badge>{visitors.length}</Badge>
        </TabButton>
        <TabButton active={tab === 'mensajes'} onClick={() => setTab('mensajes')}>
          Mensajes
          {messagesLoaded && <Badge>{messages.length}</Badge>}
        </TabButton>
        <TabButton
          active={tab === 'actividad'}
          onClick={() => setTab('actividad')}
        >
          Actividad
          {eventsLoaded && <Badge>{events.length}</Badge>}
        </TabButton>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-wine/40 bg-wine/5 p-4 text-sm text-wine-soft">
          {error}
        </p>
      )}

      {/* ── Pestaña VISITAS ── */}
      {tab === 'visitas' && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Total" value={visitors.length} />
            <Stat label="Hoy" value={todayCount} />
            <Stat label="Último" value={visitors[0]?.name ?? '—'} small />
          </div>

          {visitors.length > 0 && (
            <div className="relative mt-6">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-soft/60">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre..."
                className="field pl-12"
              />
            </div>
          )}

          {!error && visitors.length === 0 && !loading && (
            <EmptyState text="Todavía no hay visitas. Cuando alguien escriba su nombre en «¿Quién eres?», aparecerá aquí." />
          )}

          {filtered.length === 0 && visitors.length > 0 && (
            <p className="mt-6 text-center text-sm text-ink-soft">
              Sin resultados para «{query}».
            </p>
          )}

          {filtered.length > 0 && (
            <ul className="mt-6 flex flex-col gap-2">
              {filtered.map((v, i) => (
                <Row key={v.id} index={i}>
                  <Avatar name={v.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{v.name}</p>
                    <p className="text-xs text-ink-soft">{fullDate(v.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-soft/70">
                    {timeAgo(v.created_at)}
                  </span>
                </Row>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ── Pestaña MENSAJES ── */}
      {tab === 'mensajes' && (
        <>
          {!error && messagesLoaded && messages.length === 0 && !loading && (
            <EmptyState text="Todavía no hay mensajes. Cuando alguien te escriba una nota al final de la página, aparecerá aquí." />
          )}

          {messages.length > 0 && (
            <ul className="mt-6 flex flex-col gap-3">
              {messages.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  className="rounded-2xl border border-cream-border bg-cream-surface p-4 transition-colors hover:border-wine/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name ?? '?'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">
                        {m.name || 'Anónimo'}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {fullDate(m.created_at)} · {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap border-l-2 border-gold/50 pl-4 font-display text-lg italic leading-relaxed text-ink">
                    {m.message}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ── Pestaña ACTIVIDAD ── */}
      {tab === 'actividad' && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat
              label="Tiempo escuchado"
              value={fmtDur(activity.totalSeconds)}
              small
            />
            <Stat label="Reproducciones" value={activity.plays} />
            <Stat label="Personas" value={activity.people} />
          </div>

          {!error && eventsLoaded && events.length === 0 && !loading && (
            <EmptyState text="Todavía no hay actividad. En cuanto alguien entre y le dé play a una canción, verás aquí qué escuchó y cuánto tiempo estuvo." />
          )}

          {/* Ranking de canciones por tiempo real escuchado */}
          {bySong.length > 0 && (
            <section className="mt-10">
              <h2 className="eyebrow">Lo más escuchado</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {bySong.map((song, i) => (
                  <Row key={song.title} index={i}>
                    <span className="w-6 shrink-0 text-center font-display text-sm text-gold/70">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">
                        {song.title}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        {song.artist || 'Sin artista'} · {song.plays}{' '}
                        {song.plays === 1 ? 'reproducción' : 'reproducciones'}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-lg text-wine-soft">
                      {fmtDur(song.seconds)}
                    </span>
                  </Row>
                ))}
              </ul>
            </section>
          )}

          {/* Qué hizo cada persona, paso a paso */}
          {byPerson.length > 0 && (
            <section className="mt-10">
              <h2 className="eyebrow">Qué hizo cada persona</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {byPerson.map((person, i) => {
                  const open = openPerson === person.name;
                  return (
                    <motion.li
                      key={person.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                      className="overflow-hidden rounded-2xl border border-cream-border bg-cream-surface transition-colors hover:border-wine/30"
                    >
                      <button
                        onClick={() => setOpenPerson(open ? null : person.name)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left"
                      >
                        <Avatar name={person.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">
                            {person.name}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {fmtDur(person.seconds)} escuchados ·{' '}
                            {person.list.length}{' '}
                            {person.list.length === 1 ? 'acción' : 'acciones'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-ink-soft/70">
                          {timeAgo(person.last)}
                        </span>
                      </button>

                      {open && (
                        <ol className="border-t border-cream-border/70 px-4 py-3">
                          {person.list.slice(0, 60).map((e) => (
                            <li
                              key={e.id}
                              className="flex flex-col gap-0.5 border-l border-cream-border py-1.5 pl-4 text-sm sm:flex-row sm:gap-3"
                            >
                              <span className="shrink-0 text-xs text-ink-soft/70 sm:w-28">
                                {fullDate(e.created_at)}
                              </span>
                              <span className="min-w-0 flex-1 text-ink-soft">
                                {describe(e)}
                              </span>
                            </li>
                          ))}
                          {person.list.length > 60 && (
                            <li className="pl-4 pt-2 text-xs text-ink-soft/60">
                              …y {person.list.length - 60} acciones más.
                            </li>
                          )}
                        </ol>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Lectura humana de la actividad ──────────────────────────────────

/** Segundos a algo legible: "45 s", "12 min", "1 h 20 min". */
function fmtDur(total: number): string {
  const s = Math.round(total);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** Convierte una fila de `events` en una frase. */
function describe(e: ActivityEvent): string {
  const song = e.song_title ? `«${e.song_title}»` : '';
  switch (e.type) {
    case 'enter':
      return 'Escribió su nombre y abrió la carta';
    case 'page_view':
      return 'Entró a la página';
    case 'tab': {
      const to = (e.meta as { to?: string } | null)?.to;
      return to ? `Se fue a la sección «${to}»` : 'Cambió de sección';
    }
    case 'play':
      return `Le dio play a ${song}`;
    case 'pause':
      return `Pausó ${song}${
        e.position != null ? ` en el minuto ${mmss(e.position)}` : ''
      }`;
    case 'progress':
      return `Escuchó ${fmtDur(e.seconds ?? 0)} de ${song}`;
    case 'ended':
      return `Terminó ${song} entera`;
    case 'lyrics':
      return `Abrió la letra de ${song}`;
    case 'open_link':
      return `Se fue a ${e.source === 'spotify' ? 'Spotify' : 'YouTube'} con ${song}`;
    case 'message':
      return 'Te envió un mensaje';
    default:
      return e.type;
  }
}

/** Segundos a "m:ss", para decir en qué punto de la canción pasó algo. */
function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

// ── Piezas reutilizables ────────────────────────────────────────────
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium transition sm:flex-none sm:gap-2 sm:px-5 sm:text-sm ${
        active
          ? 'bg-wine text-white shadow-[0_8px_20px_-10px_rgba(190,18,60,0.9)]'
          : 'text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[11px] font-semibold">
      {children}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-wine/25 to-wine-deep/25 font-display text-lg font-medium text-wine-soft ring-1 ring-wine/20">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Row({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      className="flex items-center gap-4 rounded-2xl border border-cream-border bg-cream-surface px-4 py-3 transition-colors hover:border-wine/30"
    >
      {children}
    </motion.li>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-cream-border bg-cream-surface p-3 text-center sm:p-4">
      <p
        className={`truncate font-display font-medium text-ink ${
          small ? 'text-base sm:text-xl' : 'text-2xl sm:text-4xl'
        }`}
        title={String(value)}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-ink-soft sm:text-[11px] sm:tracking-[0.18em]">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-cream-border bg-cream-surface/50 p-12 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-cream-border text-ink-soft">
        <InboxIcon />
      </span>
      <p className="mx-auto max-w-sm text-sm text-ink-soft">{text}</p>
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-cream-border bg-cream-surface/70 p-8 text-center shadow-glow backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

// ── Utilidades ──────────────────────────────────────────────────────
function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

// ── Íconos locales ──────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13h4l2 3h4l2-3h4" />
      <path d="M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}
