// Shared helpers for AGRONIX Knowledge Base Edge Functions (Deno)
// ---------------------------------------------------------------------

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return json({ error: message }, status);
}

// Create a Supabase admin client using the service role key (server-side only).
// These env vars are set via `supabase secrets set`.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !serviceKey) {
    throw new Error('Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secrets.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Verify the caller's JWT and return the user id + email.
export async function verifyUser(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return { user: null, isAdmin: false };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { user: null, isAdmin: false };
  const email = (data.user.email ?? '').toLowerCase();
  const isAdmin = email === 'k.vinayreddy166@gmail.com';
  return { user: data.user, isAdmin };
}

export function requireAdmin(req: Request, supabase: SupabaseClient) {
  return verifyUser(req, supabase).then(({ isAdmin }) => isAdmin);
}

// Ollama configuration (free-first default AI provider).
export const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL') ?? '';
export const OLLAMA_CHAT_MODEL = Deno.env.get('OLLAMA_CHAT_MODEL') ?? 'llama3.2';
export const OLLAMA_EMBEDDING_MODEL = Deno.env.get('OLLAMA_EMBEDDING_MODEL') ?? 'bge-m3';
export const RAG_ENABLED = (Deno.env.get('RAG_ENABLED') ?? 'true').toLowerCase() !== 'false';

export const RAG_VECTOR_RESULTS = Number(Deno.env.get('RAG_VECTOR_RESULTS') ?? 10);
export const RAG_KEYWORD_RESULTS = Number(Deno.env.get('RAG_KEYWORD_RESULTS') ?? 10);
export const RAG_FINAL_RESULTS = Number(Deno.env.get('RAG_FINAL_RESULTS') ?? 6);
export const EMBEDDING_DIM = Number(Deno.env.get('RAG_EMBEDDING_DIM') ?? 1024);
export const EMBEDDING_BATCH_SIZE = Number(Deno.env.get('RAG_EMBEDDING_BATCH_SIZE') ?? 16);

export function ollamaAvailable(): boolean {
  return OLLAMA_BASE_URL.length > 0;
}
