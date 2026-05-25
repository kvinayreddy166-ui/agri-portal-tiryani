import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://fnectdrqwimetlgjbjtr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZWN0ZHJxd2ltZXRsZ2pianRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg4ODIsImV4cCI6MjA5NTIwNDg4Mn0.wQbha1ErJyXEXPqsoE8UwT3ElsAd_a6qJp1VH4Tns2I';

const cleanEnvValue = (value: unknown) => {
  return String(value ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');
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

const envSupabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, '');
const envSupabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = isValidSupabaseUrl(envSupabaseUrl) ? envSupabaseUrl : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = isValidAnonKey(envSupabaseAnonKey)
  ? envSupabaseAnonKey
  : FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isAdmin = (email: string | undefined) => {
  return email?.trim().toLowerCase() === 'k.vinayreddy166@gmail.com';
};
