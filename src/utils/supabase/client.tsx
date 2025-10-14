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
  try {
    const accessToken = await getAccessToken();
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-370afec0`;

    console.log(`[fetchFromServer] Petición a: ${endpoint}`, {
      method: options.method || 'GET',
      hasToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none'
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('[fetchFromServer] Usando access token del usuario');
    } else {
      // Si no hay token de usuario, usar la anon key
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
      console.log('[fetchFromServer] Usando publicAnonKey (sin sesión)');
    }

    const url = `${baseUrl}${endpoint}`;
    console.log('[fetchFromServer] URL completa:', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[fetchFromServer] Respuesta de ${endpoint}:`, response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchFromServer] Error en ${endpoint}:`, errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || `Error HTTP ${response.status}` };
      }
      
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[fetchFromServer] Datos recibidos de ${endpoint}:`, Object.keys(data).join(', '));
    return data;
  } catch (error: any) {
    console.error(`[fetchFromServer] Excepción en ${endpoint}:`, error.message || error);
    throw error;
  }
}
