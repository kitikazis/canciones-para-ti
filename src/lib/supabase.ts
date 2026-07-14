import { createClient } from '@supabase/supabase-js';

// Las claves viven en el archivo .env (ver .env.example y INSTRUCCIONES.md).
// Nunca subas tu .env a git: ya está en .gitignore.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true cuando ya pusiste tus claves de Supabase en el .env */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Si aún no configuras el .env, el cliente será null y la app te avisará
// con un mensaje amable en vez de romperse.
export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/** Un registro de la tabla `visitors` */
export interface Visitor {
  id: string;
  name: string;
  created_at: string;
}

/** Un mensaje de la tabla `messages` */
export interface Message {
  id: string;
  name: string | null;
  message: string;
  created_at: string;
}
