import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAdmin, isDealerUser, getDealerIdFromUser } from '../lib/supabase';
import { DEALER_DEFAULT_PASSWORD, dealerEmailFromPhone, normalizePhone } from '../lib/dealerAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdminUser: boolean;
  isDealerUser: boolean;
  dealerId: string | null;
  dealerName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInDealer: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applySession(
  session: Session | null,
  setSession: (s: Session | null) => void,
  setUser: (u: User | null) => void,
  setIsAdminUser: (v: boolean) => void,
  setIsDealer: (v: boolean) => void,
  setDealerId: (v: string | null) => void,
  setDealerName: (v: string | null) => void
) {
  const newSession = session;
  const newUser = newSession?.user ?? null;
  setSession(newSession);
  setUser(newUser);
  setIsAdminUser(isAdmin(newUser?.email));
  const dealer = isDealerUser(newUser);
  setIsDealer(dealer);
  setDealerId(dealer ? getDealerIdFromUser(newUser) : null);
  setDealerName(dealer ? (newUser?.user_metadata?.dealer_name as string) || null : null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isDealerUserFlag, setIsDealerUserFlag] = useState(false);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [dealerName, setDealerName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const finishLoading = (sess: Session | null) => {
      if (!mounted) return;
      applySession(sess, setSession, setUser, setIsAdminUser, setIsDealerUserFlag, setDealerId, setDealerName);
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data: { session: sess } }) => finishLoading(sess))
      .catch((err) => {
        console.error('Auth session error:', err);
        finishLoading(null);
      });

    const timeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      finishLoading(sess);
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

      applySession(
        data.session ?? null,
        setSession,
        setUser,
        setIsAdminUser,
        setIsDealerUserFlag,
        setDealerId,
        setDealerName
      );

      return { error: null };
    } catch (error) {
      console.error('Auth signIn exception:', error);
      return { error: error as Error };
    }
  };

  const signInDealer = async (phone: string, password: string) => {
    const digits = normalizePhone(phone);
    if (!digits || digits.length < 10) {
      return { error: new Error('Enter a valid 10-digit phone number registered in Dealer Management.') };
    }

    const dealerPassword = password.trim() || DEALER_DEFAULT_PASSWORD;
    if (dealerPassword !== DEALER_DEFAULT_PASSWORD) {
      return { error: new Error('Invalid dealer password. Use password: guest') };
    }

    try {
      let portalEmail = dealerEmailFromPhone(phone);
      let dealerId: string | null = null;
      let dealerDisplayName = '';

      const { data: loginInfo, error: rpcError } = await supabase.rpc('get_dealer_login_info', {
        p_phone: digits,
      });

      if (!rpcError && loginInfo?.[0]) {
        const row = loginInfo[0] as { dealer_id: string; portal_email: string; dealer_name: string };
        portalEmail = row.portal_email || portalEmail;
        dealerId = row.dealer_id;
        dealerDisplayName = row.dealer_name || '';
      }

      const finishSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: portalEmail.toLowerCase(),
          password: dealerPassword,
        });
        if (error) return { error };
        applySession(
          data.session ?? null,
          setSession,
          setUser,
          setIsAdminUser,
          setIsDealerUserFlag,
          setDealerId,
          setDealerName
        );
        return { error: null };
      };

      let result = await finishSignIn();
      if (!result.error) return { error: null };

      const invalidCreds =
        result.error.message?.toLowerCase().includes('invalid login') ||
        result.error.message?.toLowerCase().includes('invalid credentials');

      if (invalidCreds) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: portalEmail.toLowerCase(),
          password: dealerPassword,
          options: {
            data: {
              role: 'dealer',
              dealer_id: dealerId || '',
              dealer_name: dealerDisplayName,
              phone: digits,
            },
          },
        });

        if (
          signUpError &&
          !signUpError.message.toLowerCase().includes('already registered') &&
          !signUpError.message.toLowerCase().includes('already been registered')
        ) {
          return {
            error: new Error(
              `Could not create dealer login (${signUpError.message}). Admin: run SQL migration 20260530140000_dealer_login_rpc.sql in Supabase, or enable email sign-ups.`
            ),
          };
        }

        result = await finishSignIn();
        if (!result.error) return { error: null };
      }

      if (!loginInfo?.length && rpcError) {
        return {
          error: new Error(
            'Phone not found in dealer records, or database helper is missing. Admin: run migration 20260530140000_dealer_login_rpc.sql in Supabase SQL Editor.'
          ),
        };
      }

      return {
        error: new Error(
          result.error?.message ||
            'Dealer login failed. Confirm phone is in Dealer Management and password is guest.'
        ),
      };
    } catch (err) {
      return { error: err as Error };
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
      setIsDealerUserFlag(false);
      setDealerId(null);
      setDealerName(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdminUser,
        isDealerUser: isDealerUserFlag,
        dealerId,
        dealerName,
        signIn,
        signInDealer,
        signOut,
      }}
    >
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
