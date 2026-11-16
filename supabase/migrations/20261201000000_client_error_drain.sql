-- Lightweight client-side error drain.
-- The SPA reports uncaught errors / ErrorBoundary crashes here so admins can
-- review them in Supabase without a third-party monitoring service.

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  level text not null default 'error',
  message text not null,
  stack text,
  component_stack text,
  url text,
  user_agent text,
  user_id uuid,
  app_version text,
  extra jsonb
);

create index if not exists idx_client_errors_created_at
  on public.client_errors (created_at desc);

create index if not exists idx_client_errors_source
  on public.client_errors (source);

alter table public.client_errors enable row level security;

-- Any visitor (including logged-out public pages) may report an error,
-- but payload sizes are capped to keep the table clean.
drop policy if exists "Anyone can report client errors" on public.client_errors;
create policy "Anyone can report client errors"
  on public.client_errors for insert
  to anon, authenticated
  with check (
    char_length(message) <= 4000
    and char_length(coalesce(stack, '')) <= 8000
    and char_length(coalesce(component_stack, '')) <= 4000
    and char_length(coalesce(url, '')) <= 1000
    and char_length(coalesce(user_agent, '')) <= 500
  );

-- Only the portal admin may read the drain.
drop policy if exists "Admin can view client errors" on public.client_errors;
create policy "Admin can view client errors"
  on public.client_errors for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');
