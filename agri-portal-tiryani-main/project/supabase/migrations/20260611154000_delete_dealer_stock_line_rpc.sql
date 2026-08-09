/*
  Reliable dealer stock delete helper.
  A logged-in dealer can delete only rows belonging to their dealer account.
*/

create or replace function public.delete_dealer_stock_line(p_line_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dealer_id uuid;
  v_email text;
begin
  select dealer_id
  into v_dealer_id
  from public.stock_inventory_lines
  where id = p_line_id;

  if v_dealer_id is null then
    raise exception 'Saved entry not found.';
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if not (
    public.is_portal_admin()
    or public.current_dealer_id() = v_dealer_id
    or exists (
      select 1
      from public.dealers d
      where d.id = v_dealer_id
        and lower(coalesce(d.portal_email, public.dealer_portal_email(d.phone_number))) = v_email
    )
  ) then
    raise exception 'Not allowed to delete this saved entry.';
  end if;

  delete from public.stock_inventory_lines
  where id = p_line_id;
end;
$$;

grant execute on function public.delete_dealer_stock_line(uuid) to authenticated;
