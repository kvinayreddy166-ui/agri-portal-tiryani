import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAdmin, isTestUser, isDealerUser, isOfficerUser, getDealerIdFromUser, clearPersistedSupabaseAuth } from '../lib/supabase';
import {
  DEALER_DEFAULT_PASSWORD,
  dealerEmailFromPhone,
  isValidDealerPassword,
  normalizePhone,
} from '../../features/auth/lib/dealerAuth';
import {
  dealerLoginNotConfiguredError,
  isDealerRpcMissing,
} from '../../features/auth/lib/dealerLoginMessages';
import type { OfficerProfile, OfficerRegistrationData } from '../../features/auth/types/officerAuth';

const AUTH_STARTUP_TIMEOUT_MS = 5000;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authChecked: boolean;
  appReady: boolean;
  isAdminUser: boolean;
  isTestUser: boolean;
  isDealerUser: boolean;
  isOfficerUser: boolean;
  officerProfile: OfficerProfile | null;
  dealerId: string | null;
  dealerName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInOfficerOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOfficerOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  registerOfficer: (data: OfficerRegistrationData) => Promise<{ error: Error | null }>;
  refreshOfficerProfile: () => Promise<void>;
  signInDealer: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applySession(
  session: Session | null,
  setSession: (s: Session | null) => void,
  setUser: (u: User | null) => void,
  setIsAdminUser: (v: boolean) => void,
  setIsTestUser: (v: boolean) => void,
  setIsDealer: (v: boolean) => void,
  setDealerId: (v: string | null) => void,
  setDealerName: (v: string | null) => void
) {
  const newSession = session;
  const newUser = newSession?.user ?? null;
  setSession(newSession);
  setUser(newUser);
  setIsAdminUser(isAdmin(newUser?.email));
  setIsTestUser(isTestUser(newUser?.email));
  const dealer = isDealerUser(newUser);
  setIsDealer(dealer);
  setDealerId(dealer ? getDealerIdFromUser(newUser) : null);
  setDealerName(dealer ? (newUser?.user_metadata?.dealer_name as string) || null : null);
}

async function recordDealerLogin(dealerId: string | null) {
  if (!dealerId) return;
  const { error } = await supabase.rpc('record_dealer_login', { p_dealer_id: dealerId });
  if (error && !error.message?.toLowerCase().includes('function')) {
    console.warn('Dealer login timestamp was not recorded:', error.message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isTestUserFlag, setIsTestUserFlag] = useState(false);
  const [isDealerUserFlag, setIsDealerUserFlag] = useState(false);
  const [isOfficerUserFlag, setIsOfficerUserFlag] = useState(false);
  const [officerProfile, setOfficerProfile] = useState<OfficerProfile | null>(null);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [dealerName, setDealerName] = useState<string | null>(null);
  const authCheckedRef = useRef(false);

  const fetchOfficerProfile = useCallback(async (targetUser: User | null) => {
    if (!targetUser) {
      setOfficerProfile(null);
      setIsOfficerUserFlag(false);
      return;
    }

    const isCurrentAdmin = isAdmin(targetUser.email);
    const isExplicitOfficer = isOfficerUser(targetUser);

    try {
      const { data, error } = await supabase
        .from('officer_profiles')
        .select('*')
        .eq('id', targetUser.id)
        .maybeSingle();

      if (data && !error) {
        setOfficerProfile(data as OfficerProfile);
        setIsOfficerUserFlag(true);
        return;
      }
    } catch (err) {
      console.warn('Could not query officer_profiles table:', err);
    }

    // Fallback: If officer metadata exists or is portal admin, synthesize profile
    if (isExplicitOfficer || isCurrentAdmin) {
      const fallbackProfile: OfficerProfile = {
        id: targetUser.id,
        full_name: (targetUser.user_metadata?.full_name as string) || (isCurrentAdmin ? 'K. Vinay Reddy' : 'Agricultural Officer'),
        designation: (targetUser.user_metadata?.designation as string) || (isCurrentAdmin ? 'MAO' : 'AEO'),
        hrms_id: (targetUser.user_metadata?.hrms_id as string) || '',
        district: (targetUser.user_metadata?.district as string) || 'Kumuram Bheem Asifabad',
        mandal: (targetUser.user_metadata?.mandal as string) || 'Tiryani',
        phone: (targetUser.user_metadata?.phone as string) || '',
        email: targetUser.email || '',
        role: isCurrentAdmin ? 'admin' : 'officer',
        status: 'active',
      };
      setOfficerProfile(fallbackProfile);
      setIsOfficerUserFlag(true);
    } else {
      setOfficerProfile(null);
      setIsOfficerUserFlag(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let completed = false;
    let startupTimer = 0;

    const finishLoading = (sess: Session | null) => {
      if (!mounted || completed) return;
      completed = true;
      window.clearTimeout(startupTimer);
      applySession(sess, setSession, setUser, setIsAdminUser, setIsTestUserFlag, setIsDealerUserFlag, setDealerId, setDealerName);
      void fetchOfficerProfile(sess?.user ?? null);
      setLoading(false);
      setAuthChecked(true);
      authCheckedRef.current = true;
      setAppReady(true);
    };

    try {
      startupTimer = window.setTimeout(() => {
        console.warn('Auth session check timed out. Continuing to app shell.');
        finishLoading(null);
      }, AUTH_STARTUP_TIMEOUT_MS);

      supabase.auth
        .getSession()
        .then(({ data: { session: sess } }) => {
          finishLoading(sess);
        })
        .catch((err) => {
          console.error('Auth session error:', err);
          if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('Failed to fetch')) {
            console.warn('Network connectivity issue detected. App will continue in offline mode.');
          }
          finishLoading(null);
        });

      const authState = supabase.auth.onAuthStateChange((_event, sess) => {
        applySession(sess, setSession, setUser, setIsAdminUser, setIsTestUserFlag, setIsDealerUserFlag, setDealerId, setDealerName);
        void fetchOfficerProfile(sess?.user ?? null);
        if (!authCheckedRef.current) {
          finishLoading(sess);
          return;
        }
        setLoading(false);
      });
      subscription = authState.data.subscription;
    } catch (err) {
      console.error('Auth startup error:', err);
      finishLoading(null);
    }

    return () => {
      mounted = false;
      window.clearTimeout(startupTimer);
      subscription?.unsubscribe();
    };
  }, [fetchOfficerProfile]);

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
          return { error: new Error('Email not confirmed. Please check your email or contact the administrator.') };
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
        setIsTestUserFlag,
        setIsDealerUserFlag,
        setDealerId,
        setDealerName
      );
      void fetchOfficerProfile(data.session?.user ?? null);

      return { error: null };
    } catch (error) {
      console.error('Auth signIn exception:', error);
      return { error: error as Error };
    }
  };

  const signInOfficerOtp = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { error: new Error('Please enter a valid official email address.') };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          // Allow creating a new user if the email does not exist
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('signups not allowed') || error.message.toLowerCase().includes('user not found')) {
          return { error: new Error('Officer email not registered. Please register first using the Register tab.') };
        }
        return { error };
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const verifyOfficerOtp = async (email: string, token: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedToken = token.trim();
    if (!normalizedEmail || !cleanedToken) {
      return { error: new Error('Email and OTP code are required.') };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanedToken,
        type: 'email',
      });

      if (error) {
        return { error: new Error('Invalid or expired OTP code. Please try again.') };
      }

      if (data.session) {
        applySession(
          data.session,
          setSession,
          setUser,
          setIsAdminUser,
          setIsTestUserFlag,
          setIsDealerUserFlag,
          setDealerId,
          setDealerName
        );
        void fetchOfficerProfile(data.session.user);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const registerOfficer = async (data: OfficerRegistrationData) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!normalizedEmail || !data.full_name || !data.designation || !data.district || !data.mandal || !data.phone) {
      return { error: new Error('Please fill in all mandatory officer registration fields.') };
    }

    try {
      // Use Edge Function to create user with email already confirmed (OTP verified via Resend)
      const { data: fnData, error: fnError } = await supabase.functions.invoke('register-officer', {
        body: {
          email: normalizedEmail,
          password: data.password?.trim() || `Agri@${data.phone.slice(-4)}#2026`,
          full_name: data.full_name.trim(),
          designation: data.designation.trim(),
          hrms_id: data.hrms_id?.trim() || '',
          district: data.district.trim(),
          mandal: data.mandal.trim(),
          phone: data.phone.trim(),
        },
      });

      if (fnError) {
        let serverErrorMsg = fnError.message;
        try {
          if ('context' in fnError && (fnError as any).context) {
            const errJson = await (fnError as any).context.json();
            if (errJson?.error) serverErrorMsg = errJson.error;
          }
        } catch {
          // ignore
        }
        return { error: new Error(serverErrorMsg || 'Failed to create officer account.') };
      }

      if (!fnData?.success) {
        return { error: new Error(fnData?.error || 'Failed to create officer account.') };
      }

      // Officer profile was created by Edge Function
      // User can now sign in with email + password
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const refreshOfficerProfile = async () => {
    if (user) {
      await fetchOfficerProfile(user);
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
      let targetDealerId: string | null = null;
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
        targetDealerId = row.dealer_id;
        dealerDisplayName = row.dealer_name || '';
      }

      const finishSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: portalEmail.toLowerCase(),
          password: dealerPassword,
        });
        if (error) return { error };
        const signedDealerId = targetDealerId || getDealerIdFromUser(data.session?.user);
        applySession(
          data.session ?? null,
          setSession,
          setUser,
          setIsAdminUser,
          setIsTestUserFlag,
          setIsDealerUserFlag,
          setDealerId,
          setDealerName
        );
        void recordDealerLogin(signedDealerId);
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
              dealer_id: targetDealerId || '',
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
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('agronix:officer_user_logout'));
      } catch {
        // ignore
      }
    }
    setSession(null);
    setUser(null);
    setIsAdminUser(false);
    setIsDealerUserFlag(false);
    setIsOfficerUserFlag(false);
    setOfficerProfile(null);
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
        authChecked,
        appReady,
        isAdminUser,
        isTestUser: isTestUserFlag,
        isDealerUser: isDealerUserFlag,
        isOfficerUser: isOfficerUserFlag,
        officerProfile,
        dealerId,
        dealerName,
        signIn,
        signInOfficerOtp,
        verifyOfficerOtp,
        registerOfficer,
        refreshOfficerProfile,
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
