import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://szxtfeiswxugxukztnst.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eHRmZWlzd3h1Z3h1a3p0bnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTM0MDcsImV4cCI6MjA5NTM4OTQwN30.tWylZO0WSSLmfWJ8o0R5Rmw16Dh5KRlrWKcshomhL7c';

const cleanEnvValue = (value: unknown) => {
  return String(value ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');
};

const normalizeSupabaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return value.replace(/\/$/, '');
  }
};

const isValidSupabaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
};

const isValidAnonKey = (value: string) => {
  return value.split('.').length === 3 && value.startsWith('eyJ');
};

const envSupabaseUrl = normalizeSupabaseUrl(cleanEnvValue(import.meta.env.VITE_SUPABASE_URL));
const envSupabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseUrl = isValidSupabaseUrl(envSupabaseUrl) ? envSupabaseUrl : FALLBACK_SUPABASE_URL;
export const supabaseAnonKey = isValidAnonKey(envSupabaseAnonKey)
  ? envSupabaseAnonKey
  : FALLBACK_SUPABASE_ANON_KEY;

export const clearPersistedSupabaseAuth = () => {
  if (typeof window === 'undefined') return;

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
      window.localStorage.removeItem(key);
    }
  }
};

clearPersistedSupabaseAuth();

console.log('Supabase: Initializing client with URL:', supabaseUrl);
console.log('Supabase: Anon key valid:', isValidAnonKey(supabaseAnonKey));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
    flowType: 'pkce',
  },
});

console.log('Supabase: Client initialized successfully');

export const isAdmin = (email: string | undefined) => {
  return email?.trim().toLowerCase() === 'k.vinayreddy166@gmail.com';
};

export const isTestUser = (email: string | undefined) => {
  return email?.trim().toLowerCase() === 'test@gmail.com';
};

export const isDealerUser = (user: { user_metadata?: Record<string, unknown> } | null | undefined) => {
  return user?.user_metadata?.role === 'dealer';
};

export const getDealerIdFromUser = (user: { user_metadata?: Record<string, unknown> } | null | undefined) => {
  const id = user?.user_metadata?.dealer_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
};
