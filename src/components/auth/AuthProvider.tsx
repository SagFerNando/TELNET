import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '../../utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'usuario' | 'operador' | 'experto';
  city?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, role: string, additionalData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (supabaseUser: User) => {
    try {
      const { fetchFromServer } = await import('../../utils/supabase/client');
      
      console.log('Cargando datos para usuario:', supabaseUser.email);
      
      const userData = await fetchFromServer('/auth/me');

      console.log('Datos recibidos del servidor:', userData);

      if (!userData) {
        throw new Error('No se recibieron datos del usuario');
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: userData.name || supabaseUser.user_metadata.name || 'Usuario',
        phone: userData.phone || supabaseUser.user_metadata.phone || '',
        role: userData.role || supabaseUser.user_metadata.role || 'usuario',
        city: userData.city || supabaseUser.user_metadata.city || '',
      });

      console.log('Usuario cargado exitosamente con rol:', userData.role);
    } catch (error: any) {
      console.error('Error cargando datos del usuario:', error);
      console.error('Detalles del error:', error.message || error);
      
      // Si falla, usar datos de metadata de auth como fallback
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || 'Usuario',
        phone: supabaseUser.user_metadata?.phone || '',
        role: supabaseUser.user_metadata?.role || 'usuario',
        city: supabaseUser.user_metadata?.city || '',
      });
      
      console.log('Usando datos de fallback del user_metadata');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await loadUserData(data.user);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: string,
    additionalData?: any
  ) => {
    const { fetchFromServer } = await import('../../utils/supabase/client');
    
    await fetchFromServer('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        name, 
        phone, 
        role,
        ...additionalData
      }),
    });

    // Después de registrar, iniciar sesión automáticamente
    await signIn(email, password);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    if (data.user) {
      await loadUserData(data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}