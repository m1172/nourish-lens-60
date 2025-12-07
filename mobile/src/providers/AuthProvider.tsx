// AuthContextNative.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { resetRoot } from '../navigation/navigationRef';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (
    identifier: string,
    password: string,
    options?: { skipRedirect?: boolean }
  ) => Promise<{ error: any; user: User | null }>;
  signIn: (
    identifier: string,
    password: string,
    options?: { skipRedirect?: boolean }
  ) => Promise<{ error: any; user: User | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const resetTo = (routeName: 'Auth' | 'Main' | 'Onboarding') => {
    resetRoot(routeName);
  };

  const buildCredentials = (
    identifier: string,
    password: string
  ): {
    email: string;
    password: string;
  } => {
    // Now we only support email-based auth
    return { email: identifier.trim().toLowerCase(), password };
  };

  const signUp = async (
    identifier: string,
    password: string,
    options: { skipRedirect?: boolean } = {}
  ) => {
    const credentials = buildCredentials(identifier, password);

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (!error && data?.user) {
      if (!options.skipRedirect) {
        resetTo('Onboarding');
      }
      return { error: null, user: data.user };
    }

    return { error, user: null };
  };

  const signIn = async (
    identifier: string,
    password: string,
    options: { skipRedirect?: boolean } = {}
  ) => {
    const credentials = buildCredentials(identifier, password);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (!error && data?.user) {
      if (!options.skipRedirect) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile) {
          resetTo('Main');
        } else {
          resetTo('Onboarding');
        }
      }
      return { error: null, user: data.user };
    }

    if (error) {
      console.error('Sign-in failed', {
        message: error?.message,
        status: error?.status,
      });
    }

    return { error, user: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setSession(null);
      resetTo('Auth'); // equivalent to navigate('/auth')
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, signUp, signIn, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
