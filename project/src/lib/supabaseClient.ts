import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://fnectdrqwimetlgjbjtr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZWN0ZHJxd2ltZXRsZ2pianRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg4ODIsImV4cCI6MjA5NTIwNDg4Mn0.wQbha1ErJyXEXPqsoE8UwT3ElsAd_[...]';

/**
 * Clean and validate Supabase environment values
 */
const cleanEnvValue = (value: unknown): string => {
  return String(value ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');
};

const isValidSupabaseUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
};

const isValidAnonKey = (value: string): boolean => {
  return value.split('.').length === 3 && value.startsWith('eyJ');
};

// Initialize Supabase client with validation
const envSupabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, '');
const envSupabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = isValidSupabaseUrl(envSupabaseUrl) ? envSupabaseUrl : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = isValidAnonKey(envSupabaseAnonKey)
  ? envSupabaseAnonKey
  : FALLBACK_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin email verification
 */
export const ADMIN_EMAIL = 'k.vinayreddy166@gmail.com';

export const isAdmin = (email: string | undefined): boolean => {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
};

/**
 * Check Supabase connection and permissions
 */
export const checkSupabaseHealth = async (): Promise<{
  status: 'healthy' | 'error';
  message: string;
}> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { status: 'error', message: `Auth error: ${error.message}` };
    }
    return { status: 'healthy', message: 'Connected to Supabase' };
  } catch (error) {
    return {
      status: 'error',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
