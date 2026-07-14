-- ─────────────────────────────────────────────────────────────
--  Configuración de la base de datos (versión SEGURA).
--  Dashboard → SQL Editor → New query → pega esto → Run.
--
--  Si ya habías corrido la versión anterior (con lectura pública),
--  no pasa nada: este script la reemplaza por la versión segura.
-- ─────────────────────────────────────────────────────────────

-- 1) Tabla donde se guardan los registros de "¿Quién eres?"
create table if not exists public.visitors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- 2) Activa la seguridad por filas (Row Level Security).
alter table public.visitors enable row level security;

-- 3) Cualquier visitante puede GUARDAR su nombre (insert), sin login.
drop policy if exists "cualquiera puede registrarse" on public.visitors;
create policy "cualquiera puede registrarse"
  on public.visitors
  for insert
  to anon
  with check (true);

-- 4) SOLO usuarios con sesión iniciada pueden LEER los registros.
--    (El panel /admin inicia sesión con Supabase Auth.)
--    Quitamos la vieja política de lectura pública si existía:
drop policy if exists "lectura de registros" on public.visitors;
drop policy if exists "lectura solo admin" on public.visitors;
create policy "lectura solo admin"
  on public.visitors
  for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────
--  MENSAJES (la nota que deja Vannia al final de la página)
-- ─────────────────────────────────────────────────────────────

-- 5) Tabla de mensajes.
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- 6) Seguridad por filas.
alter table public.messages enable row level security;

-- 7) Cualquiera puede ENVIAR un mensaje (insert), sin login.
drop policy if exists "cualquiera puede enviar mensaje" on public.messages;
create policy "cualquiera puede enviar mensaje"
  on public.messages
  for insert
  to anon
  with check (true);

-- 8) Solo el admin (con sesión) puede LEER los mensajes.
drop policy if exists "lectura mensajes solo admin" on public.messages;
create policy "lectura mensajes solo admin"
  on public.messages
  for select
  to authenticated
  using (true);
