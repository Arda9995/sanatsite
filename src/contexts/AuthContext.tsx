import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted admin session
    const persistedAdmin = localStorage.getItem('sanatsite_admin_session');
    if (persistedAdmin) {
      try {
        const { user: adminUser, timestamp } = JSON.parse(persistedAdmin);
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (now - timestamp < TWENTY_FOUR_HOURS) {
          setUser(adminUser);
          setSession({ user: adminUser } as any);
          setLoading(false);
          return;
        } else {
          localStorage.removeItem('sanatsite_admin_session');
        }
      } catch (e) {
        console.error('Failed to parse admin session', e);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Special admin login
    if (email === 'ardaonuk9995@gmail.com' && password === '123456') {
      const mockUser = {
        id: 'da3db02a-6096-4876-857e-000000000000',
        email: 'ardaonuk9995@gmail.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;

      setUser(mockUser);
      setSession({ user: mockUser } as any);

      // Persist for 24h
      localStorage.setItem('sanatsite_admin_session', JSON.stringify({
        user: mockUser,
        timestamp: Date.now()
      }));

      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('sanatsite_admin_session');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
