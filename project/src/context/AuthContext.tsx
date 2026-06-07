import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAdmin, isDealerUser, getDealerIdFromUser, clearPersistedSupabaseAuth } from '../lib/supabase';
import {
  DEALER_DEFAULT_PASSWORD,
  dealerEmailFromPhone,
  isValidDealerPassword,
  normalizePhone,
} from '../lib/dealerAuth';
import {
  dealerLoginNotConfiguredError,
  isDealerRpcMissing,
} from '../lib/dealerLoginMessages';

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
    let subscription: { unsubscribe: () => void } | null = null;
    let timeout = 0;

    const finishLoading = (sess: Session | null) => {
      if (!mounted) return;
      window.clearTimeout(timeout);
      applySession(sess, setSession, setUser, setIsAdminUser, setIsDealerUserFlag, setDealerId, setDealerName);
      setLoading(false);
    };

    timeout = window.setTimeout(() => {
      finishLoading(null);
    }, 2500);

    try {
      supabase.auth
        .getSession()
        .then(({ data: { session: sess } }) => finishLoading(sess))
        .catch((err) => {
          console.error('Auth session error:', err);
          finishLoading(null);
        });

      const authState = supabase.auth.onAuthStateChange((_event, sess) => {
        finishLoading(sess);
      });
      subscription = authState.data.subscription;
    } catch (err) {
      console.error('Auth startup error:', err);
      finishLoading(null);
    }

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription?.unsubscribe();
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
      return { error: new Error('Enter a valid 10-digit phone number registered in Dealers Directory.') };
    }

    const dealerPassword = password.trim() || DEALER_DEFAULT_PASSWORD;
    if (!isValidDealerPassword(dealerPassword)) {
      return {
        error: new Error(`Invalid dealer password. Use password: ${DEALER_DEFAULT_PASSWORD}`),
      };
    }

    try {
      let portalEmail = dealerEmailFromPhone(phone);
      let dealerId: string | null = null;
      let dealerDisplayName = '';

      const { data: loginInfo, error: rpcError } = await supabase.rpc('get_dealer_login_info', {
        p_phone: digits,
      });

      if (rpcError && isDealerRpcMissing(rpcError.message)) {
        return { error: dealerLoginNotConfiguredError() };
      }

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

      if (result.error.message?.toLowerCase().includes('database error querying schema')) {
        return {
          error: new Error(
            `Dealer login account needs repair. Admin: open Dealers Directory → Setup dealer login → select this dealer → Setup selected (password ${DEALER_DEFAULT_PASSWORD}).`
          ),
        };
      }

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
            error: dealerLoginNotConfiguredError(),
          };
        }

        result = await finishSignIn();
        if (!result.error) return { error: null };
      }

      if (!loginInfo?.length) {
        if (rpcError) {
          return { error: dealerLoginNotConfiguredError() };
        }
        return {
          error: new Error(
            'Phone not found in Dealers Directory. Add the dealer with this phone number first.'
          ),
        };
      }

      return {
        error: new Error(
          result.error?.message ||
            `Dealer login failed. Confirm phone is in Dealers Directory and password is ${DEALER_DEFAULT_PASSWORD}.`
        ),
      };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    clearPersistedSupabaseAuth();
    setSession(null);
    setUser(null);
    setIsAdminUser(false);
    setIsDealerUserFlag(false);
    setDealerId(null);
    setDealerName(null);

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      clearPersistedSupabaseAuth();
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

// Context modules intentionally export both the provider and hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
