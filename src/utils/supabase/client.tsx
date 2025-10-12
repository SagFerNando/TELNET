import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Crear cliente Supabase singleton para el frontend
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClient;
}

// Función auxiliar para obtener el access token actual
export async function getAccessToken() {
  const client = createClient();
  const { data: { session } } = await client.auth.getSession();
  return session?.access_token || null;
}

// Función auxiliar para verificar si hay una sesión activa
export async function getCurrentUser() {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

// Función para hacer peticiones autenticadas al servidor
export async function fetchFromServer(
  endpoint: string,
  options: RequestInit = {}
) {
  const accessToken = await getAccessToken();
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-370afec0`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    // Si no hay token de usuario, usar la anon key
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error en la petición' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
