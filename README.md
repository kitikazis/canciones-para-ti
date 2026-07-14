# Canciones para ti 💿

Una página web personal para dedicar canciones a alguien especial. Muestra una
colección de canciones con reproductor propio, **letra karaoke sincronizada**,
traducción al español y una dedicatoria final.

## ✨ Características

- 🎵 **Reproductor propio** — cada canción suena completa dentro de la web (MP3
  alojados en Supabase Storage), sin depender de YouTube.
- 🎤 **Karaoke sincronizado** — la letra se ilumina línea por línea al ritmo de
  la canción. Se busca automáticamente en [lrclib.net](https://lrclib.net).
- 🌎 **Traducción al español** — las canciones en inglés muestran la traducción
  debajo de cada verso (vía Google Translate, con caché en el navegador).
- 🔊 **Control de volumen** en escritorio.
- 🖼️ **Portadas en alta calidad** con vista a **pantalla completa** tipo YouTube
  (rotable en móvil).
- 🔐 **Panel de administración** (`/admin`) con login real de Supabase Auth para
  ver los registros de visitantes.
- 🌗 Tema claro / oscuro y animaciones suaves.

## 🛠️ Tecnología

- **React 18** + **TypeScript**
- **Vite** (build y desarrollo)
- **Tailwind CSS** (estilos)
- **Framer Motion** (animaciones)
- **React Router** (rutas limpias)
- **Supabase** (base de datos, autenticación y almacenamiento de audio)

## 🚀 Puesta en marcha

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/`.

| URL | Qué muestra |
|-----|-------------|
| `/` | La página con la bienvenida «¿Quién eres?» y las canciones |
| `/admin` | Panel de administración (pide iniciar sesión) |

### Variables de entorno

Copia `.env.example` a `.env` y rellena tus valores de Supabase:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

> La `ANON_KEY` es pública por diseño; los datos están protegidos por las
> políticas RLS definidas en `supabase-setup.sql`.

## 🎸 Añadir o editar canciones

Todo se edita en un solo archivo: [`src/data/songs.ts`](src/data/songs.ts).

```ts
{
  title: 'Nombre de la canción',
  artist: 'Artista',
  audio: 'https://.../cancion.mp3',   // MP3 en Supabase Storage
  cover: 'https://.../portada.jpg',
  spotifyUrl: 'https://open.spotify.com/track/...',
  youtubeUrl: 'https://youtu.be/...',
}
```

La letra karaoke y su traducción se obtienen **automáticamente** por artista +
título. Si quieres ajustarla a mano, usa el campo opcional `syncedLyrics` en
formato LRC (`[00:12.30] línea`).

> Consejo: nombra los archivos de audio **sin tildes ni caracteres raros** al
> subirlos al bucket (ej. `eres-tu.mp3`).

## 📦 Compilar para producción

```bash
npm run build      # genera la carpeta dist/
npm run preview    # previsualiza la build localmente
```

## 🌐 Despliegue

El proyecto ya incluye la configuración para URLs limpias:

- **Netlify** → usa `public/_redirects`. Build command: `npm run build`,
  publish directory: `dist`.
- **Vercel** → usa `vercel.json`.

Recuerda agregar las variables de entorno (`VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY`) en la configuración del hosting.

---

Hecho con cariño. 💛
