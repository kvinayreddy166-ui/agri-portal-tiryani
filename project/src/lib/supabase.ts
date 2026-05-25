import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://fnectdrqwimetlgjbjtr.supabase.co';
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZWN0ZHJxd2ltZXRsZ2pianRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg4ODIsImV4cCI6MjA5NTIwNDg4Mn0.wQbha1ErJyXEXPqsoE8UwT3ElsAd_a6qJp1VH4Tns2I';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isAdmin = (email: string | undefined) => {
  return email?.trim().toLowerCase() === 'k.vinayreddy166@gmail.com';
};
