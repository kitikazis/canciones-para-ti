# Guía — «¿Quién eres?» + panel de admin seguro

## Rutas (URLs limpias)

| URL | Qué muestra |
|---|---|
| `/` | La página: primero **«¿Quién eres?»**, luego las canciones |
| `/admin` | El **panel de admin** (pide iniciar sesión) |

En desarrollo: `http://localhost:5173/` y `http://localhost:5173/admin`.

---

## Puesta en marcha (ya está casi todo hecho)

### 1. Base de datos
Ya creaste la tabla `visitors`. Si cambiaste algo, vuelve a correr
`supabase-setup.sql` en **SQL Editor** (ya trae la versión segura: la
lectura de registros solo funciona con sesión iniciada).

### 2. Claves
El archivo `.env` ya tiene tu `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### 3. Crear tu usuario admin (para entrar a `/admin`)
El panel usa **login real** de Supabase, así que necesitas un usuario:

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe tu **correo** y una **contraseña**.
3. Marca **Auto Confirm User** (para no tener que confirmar por correo).
4. **Create user**.

Esa combinación **correo + contraseña** es tu acceso al panel `/admin`.
(Puedes crear varios usuarios si quieres que más de una persona entre.)

### 4. Ejecutar
```bash
npm install
npm run dev
```

- **Página:** `http://localhost:5173/` → «¿Quién eres?» → escribe un nombre →
  **Entrar** (se guarda en Supabase).
- **Admin:** `http://localhost:5173/admin` → inicia sesión con el correo y
  contraseña que creaste → verás todos los registros. Botón **Cerrar sesión**
  arriba a la derecha.

> El nombre del visitante se recuerda en el navegador para no volver a
> preguntar al recargar. Para ver de nuevo la bienvenida, usa una ventana de
> incógnito o borra los datos del sitio.

---

## Seguridad (cómo quedó)

- Los visitantes pueden **guardar** su nombre sin login (política de `insert`).
- **Nadie puede leer** los registros sin iniciar sesión: la política de `select`
  es solo para usuarios `authenticated`. Aunque alguien tenga la clave pública,
  no puede listar los nombres.
- El panel `/admin` inicia sesión con Supabase Auth y obtiene ese permiso.

---

## Desplegar en internet (opcional)

El proyecto ya incluye la config para URLs limpias en hosting:

- **Vercel** → usa `vercel.json` (reescribe todo a `index.html`).
- **Netlify** → usa `public/_redirects`.

Pasos generales:
1. Sube el proyecto a GitHub.
2. En Vercel/Netlify: **Import project** → framework **Vite**.
3. En la configuración del hosting, agrega las variables de entorno
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (las mismas del `.env`).
4. Deploy. Comparte el link. El panel seguirá en `tusitio.com/admin`.
