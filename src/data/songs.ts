// ─────────────────────────────────────────────────────────────
//  ✏️  EDITA AQUÍ  —  este es el único archivo que necesitas tocar
//  para personalizar la página con tus canciones y tu dedicatoria.
// ─────────────────────────────────────────────────────────────

export interface Song {
  /** Nombre de la canción */
  title: string;
  /** Artista o grupo */
  artist: string;
  /** Por qué esta canción / qué te recuerda de ella (opcional) */
  why?: string;
  /** Un fragmento de la letra que te encanta (opcional) */
  lyric?: string;
  /**
   * Letra completa (opcional). Si la dejas vacía, la página intenta
   * buscarla automáticamente por artista + título al pulsar "Ver letra".
   * Para que la búsqueda funcione, la canción necesita tener `artist`.
   */
  lyrics?: string;
  /**
   * Letra sincronizada (karaoke) en formato LRC — cada línea con su tiempo,
   * ej. "[00:12.30] Una línea". Es OPCIONAL: si la dejas vacía, la página la
   * busca automáticamente por artista + título. Solo la pones a mano si la
   * automática no aparece o quieres ajustar los tiempos.
   */
  syncedLyrics?: string;
  /**
   * Enlace directo a un archivo de audio (MP3/M4A) — por ejemplo el que
   * subes a Supabase Storage. Si está, se usa el reproductor propio y
   * suena completa dentro de la web (sin depender de YouTube).
   */
  audio?: string;
  /** Enlace para escucharla en Spotify (opcional) */
  spotifyUrl?: string;
  /** Enlace para escucharla en YouTube (opcional) */
  youtubeUrl?: string;
  /** Carátula de la canción (URL de la imagen, opcional) */
  cover?: string;
}

export interface Dedication {
  /** Título grande de la portada */
  title: string;
  /** Nombre de la persona a quien va dedicada */
  toName: string;
  /** Frase corta bajo el título */
  intro: string;
  /** La dedicatoria principal (aparece al final) */
  message: string;
  /** Con qué firmas (ej. "Con cariño,") */
  signature: string;
  /** Tu nombre (quien dedica) */
  fromName: string;
}

export const dedication: Dedication = {
  title: 'Para ti',
  toName: 'Vannia',
  intro: 'Algunas canciones dejaron de ser solo canciones el día que te conocí.',
  message:
    'Reuní aquí las canciones que me hacen pensar en ti. Cada una guarda un momento, ' +
    'una sonrisa o unas ganas enormes de estar a tu lado. Espero que, mientras las ' +
    'escuchas, sientas todo lo que no siempre sé decir con palabras.',
  signature: 'Con cariño,',
  fromName: 'Yamir',
};

export const songs: Song[] = [
  {
    title: 'Eres tú',
    artist: 'Peint',
    audio: 'https://xbszrtnpmrykoqhdpviw.supabase.co/storage/v1/object/public/canciones/Eres%20Tu%20%20Peint%20%20Letra.mp3',
    spotifyUrl: 'https://open.spotify.com/track/2dMrr6HYgfrPRMOdHtEKKY',
    youtubeUrl: 'https://www.youtube.com/watch?v=N8FAxgBWEDY',
    cover: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b273fecf9dae1b27a86eaa18a2e3',
  },
  {
    title: 'Die For You',
    artist: 'Joji',
    audio: 'https://xbszrtnpmrykoqhdpviw.supabase.co/storage/v1/object/public/canciones/Joji%20-%20Die%20For%20You.mp3',
    spotifyUrl: 'https://open.spotify.com/track/00WLowvlN5cjkYpQV6pjo4',
    youtubeUrl: 'https://youtu.be/kIEWJ1ljEro',
    cover: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b273cdd1a8a427b3f81f4f4f4f7d',
  },
  {
    title: 'Sweet',
    artist: 'Cigarettes After Sex',
    audio: 'https://xbszrtnpmrykoqhdpviw.supabase.co/storage/v1/object/public/canciones/Cigarettes%20After%20Sex.mp3',
    spotifyUrl: 'https://open.spotify.com/track/2KhrPRV0V1FS2l4eQMJUWt',
    youtubeUrl: 'https://youtu.be/PdMDEP2aVZE',
    cover: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b273030234caa8b2d0e92e69db78',
  },
  {
    title: 'Amor Amarillo',
    artist: 'Gustavo Cerati',
    audio: 'https://xbszrtnpmrykoqhdpviw.supabase.co/storage/v1/object/public/canciones/Gustavo%20Cerati%20-%20Amor%20Amarillo.mp3',
    spotifyUrl: 'https://open.spotify.com/track/0HX8RMVq75HxkY29P0mfWn',
    youtubeUrl: 'https://youtu.be/iluWuweGX7s',
    cover: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b273a2ec3791d9fd51ad343cc885',
  },
];

// ─────────────────────────────────────────────────────────────
//  🎸  TUS canciones (Yamir). Añádelas aquí con el mismo formato
//  de arriba. Ejemplo:
//    { title: 'Nombre', artist: 'Artista',
//      youtubeUrl: 'https://youtu.be/XXXXXXXXXXX', cover: '...' }
// ─────────────────────────────────────────────────────────────
export const songsYamir: Song[] = [
  {
    title: 'Más humano',
    artist: 'LATIN MAFIA',
    audio: 'https://xbszrtnpmrykoqhdpviw.supabase.co/storage/v1/object/public/canciones/LATIN%20MAFIA_%20Mas%20humano.mp3',
    spotifyUrl: 'https://open.spotify.com/track/2XfWWZqfTpNmZdmVgsmqKZ',
    youtubeUrl: 'https://youtu.be/X-6AkgvH4dM',
    cover: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b273cf4f4f845b90703dcc9fdc83',
  },
  {
    title: 'Coming Up Roses',
    artist: 'Harry Styles',
    audio: 'https://xbszrtnpmrykoqhdpviw.supabase.co/storage/v1/object/public/canciones/Harry%20Styles%20-%20Coming%20Up%20Roses.mp3',
    spotifyUrl: 'https://open.spotify.com/track/0QPdjsMOUhwouq1NS3HwfQ',
    youtubeUrl: 'https://youtu.be/fO_Z9W1OEfs',
    cover: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b27374959140f550b11049c18a38',
  },
];
