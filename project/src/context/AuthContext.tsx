import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAdmin } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdminUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    let mounted = true;

    const finishLoading = (session: Session | null) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdminUser(isAdmin(session?.user?.email));
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => finishLoading(session))
      .catch((err) => {
        console.error('Auth session error:', err);
        finishLoading(null);
      });

    const timeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      finishLoading(session);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return { error: new Error('Email and password are required') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error('Supabase signIn error:', error.message);
        if (error.message === 'Email not confirmed') {
          return { error: new Error('Email not confirmed. Please contact the administrator.') };
        }
        if (error.message === 'Invalid login credentials') {
          return { error: new Error('Invalid email or password.') };
        }
        return { error };
      }

      const newSession = data.session ?? null;
      const newUser = newSession?.user ?? null;
      setSession(newSession);
      setUser(newUser);
      setIsAdminUser(isAdmin(newUser?.email));

      return { error: null };
    } catch (error) {
      console.error('Auth signIn exception:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSession(null);
      setUser(null);
      setIsAdminUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdminUser, signIn, signOut }}>
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