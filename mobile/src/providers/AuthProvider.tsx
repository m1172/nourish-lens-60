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
    type: 'phone' | 'email';
    phone?: string;
    email?: string;
    aliasEmail?: string;
    password: string;
  } => {
    const trimmed = identifier.trim();
    const phoneRegex = /^\+?\d{6,15}$/;
    if (phoneRegex.test(trimmed)) {
      const digits = trimmed.replace(/\D/g, '');
      const withPlus = trimmed.startsWith('+') ? trimmed : `+${digits}`;
      return {
        type: 'phone',
        phone: withPlus,
        aliasEmail: `${digits}@phone.welmi`, // fallback when phone signups are disabled
        password,
      };
    }
    return { type: 'email', email: trimmed.toLowerCase(), password };
  };

  const signUp = async (
    identifier: string,
    password: string,
    options: { skipRedirect?: boolean } = {}
  ) => {
    const credentials = buildCredentials(identifier, password);

    const attemptSignUp = (payload: {
      email?: string;
      phone?: string;
      password: string;
    }) => supabase.auth.signUp(payload);

    let data:
      | {
          user: User | null;
        }
      | null = null;
    let error: any = null;

    if (credentials.type === 'phone' && credentials.phone) {
      const phonePayload = { phone: credentials.phone, password };
      ({ data, error } = await attemptSignUp(phonePayload));

      // Fallback to email alias when phone signups are disabled
      const phoneDisabled =
        error &&
        typeof error.message === 'string' &&
        /phone.*disabled/i.test(error.message);
      if (phoneDisabled && credentials.aliasEmail) {
        ({ data, error } = await attemptSignUp({
          email: credentials.aliasEmail,
          password,
        }));
      }

      // If account already exists (via alias), try signing in
      if (
        error &&
        typeof error.message === 'string' &&
        /already registered/i.test(error.message) &&
        credentials.aliasEmail
      ) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: credentials.aliasEmail,
            password,
          });
        if (!signInError) {
          data = signInData as any;
          error = null;
        }
      }
    } else {
      ({ data, error } = await attemptSignUp({
        email: credentials.email,
        password,
      }));
    }

    if (!error) {
      if (!options.skipRedirect) {
        resetTo('Onboarding');
      }
      return { error, user: data?.user ?? null };
    }

    return { error, user: null };
  };

  const signIn = async (
    identifier: string,
    password: string,
    options: { skipRedirect?: boolean } = {}
  ) => {
    const credentials = buildCredentials(identifier, password);
    const attemptSignIn = (payload: {
      email?: string;
      phone?: string;
      password: string;
    }) => supabase.auth.signInWithPassword(payload);

    let data: { user: User | null } | null = null;
    let error: any = null;

    if (credentials.type === 'phone' && credentials.phone) {
      const attempts: Array<() => Promise<void>> = [];

      // Try alias email first (covers fallback signups when phone auth is disabled)
      if (credentials.aliasEmail) {
        attempts.push(async () => {
          const res = await attemptSignIn({
            email: credentials.aliasEmail,
            password,
          });
          data = res.data as any;
          error = res.error;
          if (!error) {
            return;
          }
        });
      }

      // Then try phone login
      attempts.push(async () => {
        const res = await attemptSignIn({
          phone: credentials.phone,
          password,
        });
        data = res.data as any;
        error = res.error;
      });

      for (const attempt of attempts) {
        await attempt();
        if (!error && data?.user) break;
      }
    } else {
      ({ data, error } = await attemptSignIn({
        email: credentials.email,
        password,
      }));
    }

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
    } else if (error) {
      console.error('Sign-in failed', {
        type: credentials.type,
        aliasTried: !!credentials.aliasEmail,
        message: error?.message,
        status: error?.status,
      });
    }

    return { error, user: data?.user ?? null };
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
