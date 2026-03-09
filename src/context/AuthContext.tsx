import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { saveSessionCache, loadSessionCache, clearSessionCache } from '../lib/idb';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Minimal User-Objekt für Offline-Fallback (Supabase User hat mehr Felder). */
function makeOfflineUser(id: string, email: string): User {
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let nextUser = session?.user ?? null;
        if (nextUser) {
          await saveSessionCache(nextUser.id, nextUser.email ?? '');
        } else if (!navigator.onLine) {
          const cached = await loadSessionCache();
          if (cached) {
            nextUser = makeOfflineUser(cached.userId, cached.email);
          }
        }
        const nextId = nextUser?.id ?? null;
        if (lastUserIdRef.current !== nextId) {
          lastUserIdRef.current = nextId;
          setSession(session);
          setUser(nextUser);
        }
      } catch {
        if (!navigator.onLine) {
          const cached = await loadSessionCache();
          if (cached) {
            const offlineUser = makeOfflineUser(cached.userId, cached.email);
            if (lastUserIdRef.current !== cached.userId) {
              lastUserIdRef.current = cached.userId;
              setSession(null);
              setUser(offlineUser);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      const nextId = nextUser?.id ?? null;
      if (nextUser) {
        void saveSessionCache(nextUser.id, nextUser.email ?? '');
        if (lastUserIdRef.current !== nextId) {
          lastUserIdRef.current = nextId;
          setSession(session);
          setUser(nextUser);
        }
      } else if (navigator.onLine) {
        void clearSessionCache();
        lastUserIdRef.current = null;
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* offline: trotzdem lokale Session löschen */
    }
    await clearSessionCache();
    lastUserIdRef.current = null;
    setSession(null);
    setUser(null);
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
