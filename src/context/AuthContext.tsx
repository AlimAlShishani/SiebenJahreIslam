import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const DEBUG_REMOUNT =
  typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).get('debugRemount') === '1' ||
    window.sessionStorage.getItem('debugRemount') === '1');

const logDebug = (...args: unknown[]) => {
  if (!DEBUG_REMOUNT) return;
  console.log('[debug-remount][Auth]', ...args);
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    logDebug('provider mounted');
    supabase.auth.getSession().then(({ data: { session } }) => {
      logDebug('getSession resolved', {
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        expiresAt: session?.expires_at ?? null,
      });
      const nextUser = session?.user ?? null;
      const nextId = nextUser?.id ?? null;
      if (lastUserIdRef.current !== nextId) {
        lastUserIdRef.current = nextId;
        setSession(session);
        setUser(nextUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logDebug('onAuthStateChange', {
        event,
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        expiresAt: session?.expires_at ?? null,
      });
      const nextUser = session?.user ?? null;
      const nextId = nextUser?.id ?? null;
      if (lastUserIdRef.current !== nextId) {
        lastUserIdRef.current = nextId;
        setSession(session);
        setUser(nextUser);
      }
      setLoading(false);
    });

    return () => {
      logDebug('provider unmounted');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    lastUserIdRef.current = null;
  };

  const value = useMemo(
    () => ({ session, user, loading, signOut }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
