/*
  Track dealer portal logins for command-center monitoring.
  Dealers can mark only their own login timestamp through this RPC.
*/

alter table if exists public.dealers
  add column if not exists last_login_at timestamptz;

create index if not exists idx_dealers_last_login_at
  on public.dealers (last_login_at desc);

create or replace function public.record_dealer_login(p_dealer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if p_dealer_id is null then
    return;
  end if;

  update public.dealers d
  set
    last_login_at = now(),
    updated_at = now()
  where d.id = p_dealer_id
    and lower(coalesce(nullif(trim(d.portal_email), ''), public.dealer_portal_email(d.phone_number))) = v_email;
end;
$$;

revoke all on function public.record_dealer_login(uuid) from public;
grant execute on function public.record_dealer_login(uuid) to authenticated;
