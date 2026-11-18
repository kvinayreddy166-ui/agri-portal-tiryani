-- =====================================================================
-- AGRONIX — Web Push delivery for notifications
-- =====================================================================
-- Every INSERT into public.notifications now fans out a Web Push via the
-- push-notify Edge Function (pg_net -> HTTPS POST). This covers the
-- DB-trigger notifications (feedback status/response/new submission) as
-- well as admin broadcasts — adminSendNotifications no longer calls the
-- function from the browser.
--
-- One-time setup after `supabase db push`:
--   1. supabase secrets set PUSH_NOTIFY_SECRET=<random long string>
--   2. supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:admin@example.com
--   3. supabase functions deploy push-notify
--   4. In the SQL editor, point the bridge at this project:
--        insert into private.push_notify_config (endpoint, secret)
--        values ('https://<project-ref>.supabase.co/functions/v1/push-notify', '<PUSH_NOTIFY_SECRET>')
--      (singleton row — UPDATE it if the URL or secret ever changes)
-- =====================================================================

-- pg_net for async HTTP calls from triggers.
create extension if not exists pg_net;

-- Config lives outside the exposed schemas; only SECURITY DEFINER code
-- (the trigger function below) can read it.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.push_notify_config (
  id boolean primary key default true check (id),
  endpoint text not null,
  secret text not null,
  updated_at timestamptz not null default now()
);

revoke all on private.push_notify_config from public, anon, authenticated;

comment on table private.push_notify_config is
  'Singleton config for the notifications -> Web Push bridge (endpoint + shared secret). Not exposed via PostgREST.';

create or replace function private.notifications_dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = private, public, net, extensions
as $$
declare
  cfg private.push_notify_config%rowtype;
begin
  select * into cfg from private.push_notify_config limit 1;
  if not found then
    -- Push bridge not configured yet; the in-app notification still works.
    return NEW;
  end if;

  perform net.http_post(
    url := cfg.endpoint,
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'link', NEW.link,
      'tag', NEW.type
    ),
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-notify-secret', cfg.secret
    ),
    timeout_milliseconds := 5000
  );
  return NEW;
end;
$$;

revoke all on function private.notifications_dispatch_push() from public, anon, authenticated;

drop trigger if exists notifications_dispatch_push_trigger on public.notifications;
create trigger notifications_dispatch_push_trigger
  after insert on public.notifications
  for each row execute function private.notifications_dispatch_push();

notify pgrst, 'reload schema';

commit;
