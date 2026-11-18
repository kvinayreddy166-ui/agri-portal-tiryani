-- Web Push subscriptions for officers (one row per device/browser endpoint).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Users manage only their own subscriptions (insert/update/delete).
create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Read-only access for the portal admin (send fan-out lookups).
create policy "Portal admin can read push subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (public.is_portal_admin());

-- Service role bypasses RLS, so the push-notify Edge Function can read
-- subscriptions and delete stale endpoints (404/410) directly.

comment on table public.push_subscriptions is
  'Web Push (VAPID) subscriptions per user device; endpoint is unique so client upserts are idempotent.';
comment on column public.push_subscriptions.endpoint is
  'Push service endpoint URL (unique per browser/device).';
comment on column public.push_subscriptions.p256dh is
  'Client public key (base64url) for payload encryption.';
comment on column public.push_subscriptions.auth is
  'Client auth secret (base64url) for payload encryption.';
comment on column public.push_subscriptions.last_seen_at is
  'Updated whenever the client re-subscribes or syncs the subscription.';

grant select, insert, update, delete on public.push_subscriptions to authenticated;
revoke all on public.push_subscriptions from anon;

-- Cleanup: drop subscriptions whose endpoints have been dead for a while.
-- The Edge Function also deletes 404/410 endpoints immediately; this is a
-- backstop for endpoints that silently stop delivering.
create or replace function public.cleanup_stale_push_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.push_subscriptions
  where last_seen_at < now() - interval '90 days';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.cleanup_stale_push_subscriptions() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('cleanup-stale-push-subscriptions')
    where exists (select 1 from cron.job where jobname = 'cleanup-stale-push-subscriptions');
    perform cron.schedule(
      'cleanup-stale-push-subscriptions',
      '15 3 * * 0',
      'select public.cleanup_stale_push_subscriptions()'
    );
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
