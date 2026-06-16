-- Urea Dashboard Sync & Analytics Module
-- Create tables for external urea dashboard integration

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Drop existing tables if they exist (for clean migration)
drop table if exists public.urea_farmer_match_results cascade;
drop table if exists public.external_urea_report_files cascade;
drop table if exists public.external_urea_bookings cascade;
drop table if exists public.external_urea_sync_logs cascade;

-- Sync logs table to track all sync operations
create table public.external_urea_sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null default 'auto', -- 'auto' or 'manual_upload'
  status text not null default 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_imported integer default 0,
  records_matched integer default 0,
  records_unmatched integer default 0,
  records_duplicate integer default 0,
  error_message text,
  sync_metadata jsonb default '{}',
  created_by text,
  created_at timestamptz not null default now()
);

-- External urea bookings table
create table if not exists public.external_urea_bookings (
  id uuid primary key default gen_random_uuid(),
  sync_id uuid references public.external_urea_sync_logs(id) on delete set null,
  farmer_name text not null default '',
  father_name text not null default '',
  aadhaar_no text not null default '',
  ppb_no text not null default '',
  mobile_no text not null default '',
  village text not null default '',
  survey_no text not null default '',
  extent numeric(12, 4) not null default 0,
  crop text not null default '',
  dealer_name text not null default '',
  booking_id text not null default '',
  booking_date date,
  urea_qty numeric(12, 2) not null default 0,
  status text not null default 'pending', -- 'pending', 'matched', 'unmatched', 'duplicate', 'mismatch'
  raw_data jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- External urea report files table (for storing uploaded/downloaded files)
create table if not exists public.external_urea_report_files (
  id uuid primary key default gen_random_uuid(),
  sync_id uuid references public.external_urea_sync_logs(id) on delete set null,
  file_name text not null,
  file_type text not null, -- 'excel', 'csv', 'pdf', 'html'
  file_size bigint,
  storage_path text,
  upload_metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Urea farmer match results table
create table if not exists public.urea_farmer_match_results (
  id uuid primary key default gen_random_uuid(),
  urea_booking_id uuid references public.external_urea_bookings(id) on delete cascade,
  farmer_database_id uuid references public.farmer_database(id) on delete set null,
  match_status text not null, -- 'matched', 'probable_match', 'not_matched', 'duplicate', 'data_mismatch'
  match_confidence numeric(5, 2), -- 0.00 to 100.00
  match_type text, -- 'aadhaar_exact', 'ppb_exact', 'mobile_exact', 'name_fuzzy', 'survey_village'
  match_details jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_external_urea_sync_logs_status on public.external_urea_sync_logs(status);
create index if not exists idx_external_urea_sync_logs_started_at on public.external_urea_sync_logs(started_at desc);
create index if not exists idx_external_urea_sync_logs_sync_type on public.external_urea_sync_logs(sync_type);

create index if not exists idx_external_urea_bookings_sync_id on public.external_urea_bookings(sync_id);
create index if not exists idx_external_urea_bookings_aadhaar on public.external_urea_bookings(aadhaar_no);
create index if not exists idx_external_urea_bookings_ppb on public.external_urea_bookings(ppb_no);
create index if not exists idx_external_urea_bookings_mobile on public.external_urea_bookings(mobile_no);
create index if not exists idx_external_urea_bookings_village on public.external_urea_bookings using gin (village gin_trgm_ops);
create index if not exists idx_external_urea_bookings_crop on public.external_urea_bookings(crop);
create index if not exists idx_external_urea_bookings_dealer on public.external_urea_bookings using gin (dealer_name gin_trgm_ops);
create index if not exists idx_external_urea_bookings_booking_date on public.external_urea_bookings(booking_date);
create index if not exists idx_external_urea_bookings_status on public.external_urea_bookings(status);
create index if not exists idx_external_urea_bookings_booking_id on public.external_urea_bookings(booking_id);

create index if not exists idx_urea_farmer_match_results_urea_booking_id on public.urea_farmer_match_results(urea_booking_id);
create index if not exists idx_urea_farmer_match_results_farmer_database_id on public.urea_farmer_match_results(farmer_database_id);
create index if not exists idx_urea_farmer_match_results_match_status on public.urea_farmer_match_results(match_status);
create index if not exists idx_urea_farmer_match_results_match_confidence on public.urea_farmer_match_results(match_confidence desc);

-- Enable Row Level Security
alter table public.external_urea_sync_logs enable row level security;
alter table public.external_urea_bookings enable row level security;
alter table public.external_urea_report_files enable row level security;
alter table public.urea_farmer_match_results enable row level security;

-- RLS Policies

-- Sync logs: Authenticated can read, Admin can manage
create policy "Authenticated can read urea sync logs"
  on public.external_urea_sync_logs for select
  to authenticated
  using (true);

create policy "Admin can manage urea sync logs"
  on public.external_urea_sync_logs for all
  to authenticated
  using (public.is_portal_admin())
  with check (public.is_portal_admin());

-- Urea bookings: Authenticated can read, Admin can manage
create policy "Authenticated can read urea bookings"
  on public.external_urea_bookings for select
  to authenticated
  using (true);

create policy "Admin can manage urea bookings"
  on public.external_urea_bookings for all
  to authenticated
  using (public.is_portal_admin())
  with check (public.is_portal_admin());

-- Report files: Authenticated can read, Admin can manage
create policy "Authenticated can read urea report files"
  on public.external_urea_report_files for select
  to authenticated
  using (true);

create policy "Admin can manage urea report files"
  on public.external_urea_report_files for all
  to authenticated
  using (public.is_portal_admin())
  with check (public.is_portal_admin());

-- Match results: Authenticated can read, Admin can manage
create policy "Authenticated can read urea match results"
  on public.urea_farmer_match_results for select
  to authenticated
  using (true);

create policy "Admin can manage urea match results"
  on public.urea_farmer_match_results for all
  to authenticated
  using (public.is_portal_admin())
  with check (public.is_portal_admin());

-- Function to update updated_at timestamp
create or replace function update_urea_bookings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_urea_bookings_updated_at
  before update on public.external_urea_bookings
  for each row
  execute function update_urea_bookings_updated_at();

-- Function to match urea bookings with farmer database
create or replace function match_urea_booking_with_farmer(p_booking_id uuid)
returns void as $$
declare
  v_booking record;
  v_farmer record;
  v_match_count integer;
  v_match_status text;
  v_match_confidence numeric(5, 2);
  v_match_type text;
  v_match_details jsonb;
begin
  -- Get the booking details
  select * into v_booking
  from public.external_urea_bookings
  where id = p_booking_id;
  
  if not found then
    return;
  end if;
  
  -- Delete existing match results for this booking
  delete from public.urea_farmer_match_results
  where urea_booking_id = p_booking_id;
  
  -- Try exact Aadhaar match
  select count(*) into v_match_count
  from public.farmer_database
  where aadhaar_no = v_booking.aadhaar_no
    and aadhaar_no != '';
  
  if v_match_count = 1 then
    select * into v_farmer
    from public.farmer_database
    where aadhaar_no = v_booking.aadhaar_no
      and aadhaar_no != ''
    limit 1;
    
    v_match_status := 'matched';
    v_match_confidence := 100.00;
    v_match_type := 'aadhaar_exact';
    v_match_details := jsonb_build_object(
      'matched_field', 'aadhaar_no',
      'booking_value', v_booking.aadhaar_no,
      'farmer_value', v_farmer.aadhaar_no
    );
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, farmer_database_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_farmer.id, v_match_status, v_match_confidence, v_match_type, v_match_details
    );
    
    -- Update booking status
    update public.external_urea_bookings
    set status = 'matched'
    where id = p_booking_id;
    
    return;
  elsif v_match_count > 1 then
    v_match_status := 'duplicate';
    v_match_confidence := 100.00;
    v_match_type := 'aadhaar_exact';
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_match_status, v_match_confidence, v_match_type, 
      jsonb_build_object('reason', 'Multiple farmers with same Aadhaar')
    );
    
    update public.external_urea_bookings
    set status = 'duplicate'
    where id = p_booking_id;
    
    return;
  end if;
  
  -- Try exact PPB match
  select count(*) into v_match_count
  from public.farmer_database
  where ppb_no = v_booking.ppb_no
    and ppb_no != '';
  
  if v_match_count = 1 then
    select * into v_farmer
    from public.farmer_database
    where ppb_no = v_booking.ppb_no
      and ppb_no != ''
    limit 1;
    
    v_match_status := 'matched';
    v_match_confidence := 95.00;
    v_match_type := 'ppb_exact';
    v_match_details := jsonb_build_object(
      'matched_field', 'ppb_no',
      'booking_value', v_booking.ppb_no,
      'farmer_value', v_farmer.ppb_no
    );
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, farmer_database_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_farmer.id, v_match_status, v_match_confidence, v_match_type, v_match_details
    );
    
    update public.external_urea_bookings
    set status = 'matched'
    where id = p_booking_id;
    
    return;
  elsif v_match_count > 1 then
    v_match_status := 'duplicate';
    v_match_confidence := 95.00;
    v_match_type := 'ppb_exact';
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_match_status, v_match_confidence, v_match_type,
      jsonb_build_object('reason', 'Multiple farmers with same PPB')
    );
    
    update public.external_urea_bookings
    set status = 'duplicate'
    where id = p_booking_id;
    
    return;
  end if;
  
  -- Try exact mobile match
  select count(*) into v_match_count
  from public.farmer_database
  where phone_number = v_booking.mobile_no
    and phone_number != '';
  
  if v_match_count = 1 then
    select * into v_farmer
    from public.farmer_database
    where phone_number = v_booking.mobile_no
      and phone_number != ''
    limit 1;
    
    v_match_status := 'matched';
    v_match_confidence := 85.00;
    v_match_type := 'mobile_exact';
    v_match_details := jsonb_build_object(
      'matched_field', 'phone_number',
      'booking_value', v_booking.mobile_no,
      'farmer_value', v_farmer.phone_number
    );
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, farmer_database_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_farmer.id, v_match_status, v_match_confidence, v_match_type, v_match_details
    );
    
    update public.external_urea_bookings
    set status = 'matched'
    where id = p_booking_id;
    
    return;
  elsif v_match_count > 1 then
    v_match_status := 'duplicate';
    v_match_confidence := 85.00;
    v_match_type := 'mobile_exact';
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_match_status, v_match_confidence, v_match_type,
      jsonb_build_object('reason', 'Multiple farmers with same mobile')
    );
    
    update public.external_urea_bookings
    set status = 'duplicate'
    where id = p_booking_id;
    
    return;
  end if;
  
  -- Try fuzzy name + father name + village match
  select count(*) into v_match_count
  from public.farmer_database
  where similarity(farmer_name_english, v_booking.farmer_name) > 0.6
    and similarity(father_or_husband_name_english, v_booking.father_name) > 0.6
    and village_english = v_booking.village;
  
  if v_match_count = 1 then
    select * into v_farmer
    from public.farmer_database
    where similarity(farmer_name_english, v_booking.farmer_name) > 0.6
      and similarity(father_or_husband_name_english, v_booking.father_name) > 0.6
      and village_english = v_booking.village
    limit 1;
    
    v_match_status := 'probable_match';
    v_match_confidence := 70.00;
    v_match_type := 'name_fuzzy';
    v_match_details := jsonb_build_object(
      'matched_fields', jsonb_build_array('farmer_name', 'father_name', 'village'),
      'booking_name', v_booking.farmer_name,
      'farmer_name', v_farmer.farmer_name_english,
      'booking_father', v_booking.father_name,
      'farmer_father', v_farmer.father_or_husband_name_english,
      'village', v_booking.village
    );
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, farmer_database_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_farmer.id, v_match_status, v_match_confidence, v_match_type, v_match_details
    );
    
    update public.external_urea_bookings
    set status = 'matched'
    where id = p_booking_id;
    
    return;
  elsif v_match_count > 1 then
    v_match_status := 'duplicate';
    v_match_confidence := 70.00;
    v_match_type := 'name_fuzzy';
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_match_status, v_match_confidence, v_match_type,
      jsonb_build_object('reason', 'Multiple farmers with similar name and village')
    );
    
    update public.external_urea_bookings
    set status = 'duplicate'
    where id = p_booking_id;
    
    return;
  end if;
  
  -- Try survey + village match
  select count(*) into v_match_count
  from public.farmer_database
  where survey_no = v_booking.survey_no
    and survey_no != ''
    and village_english = v_booking.village;
  
  if v_match_count = 1 then
    select * into v_farmer
    from public.farmer_database
    where survey_no = v_booking.survey_no
      and survey_no != ''
      and village_english = v_booking.village
    limit 1;
    
    v_match_status := 'probable_match';
    v_match_confidence := 60.00;
    v_match_type := 'survey_village';
    v_match_details := jsonb_build_object(
      'matched_fields', jsonb_build_array('survey_no', 'village'),
      'booking_survey', v_booking.survey_no,
      'farmer_survey', v_farmer.survey_no,
      'village', v_booking.village
    );
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, farmer_database_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_farmer.id, v_match_status, v_match_confidence, v_match_type, v_match_details
    );
    
    update public.external_urea_bookings
    set status = 'matched'
    where id = p_booking_id;
    
    return;
  elsif v_match_count > 1 then
    v_match_status := 'duplicate';
    v_match_confidence := 60.00;
    v_match_type := 'survey_village';
    
    insert into public.urea_farmer_match_results (
      urea_booking_id, match_status, match_confidence, match_type, match_details
    ) values (
      p_booking_id, v_match_status, v_match_confidence, v_match_type,
      jsonb_build_object('reason', 'Multiple farmers with same survey and village')
    );
    
    update public.external_urea_bookings
    set status = 'duplicate'
    where id = p_booking_id;
    
    return;
  end if;
  
  -- No match found
  v_match_status := 'not_matched';
  v_match_confidence := 0.00;
  v_match_type := null;
  v_match_details := jsonb_build_object(
    'reason', 'No matching farmer found in database'
  );
  
  insert into public.urea_farmer_match_results (
    urea_booking_id, match_status, match_confidence, match_type, match_details
  ) values (
    p_booking_id, v_match_status, v_match_confidence, v_match_type, v_match_details
  );
  
  update public.external_urea_bookings
  set status = 'unmatched'
  where id = p_booking_id;
  
end;
$$ language plpgsql;

-- Function to match all urea bookings for a sync
create or replace function match_urea_bookings_for_sync(p_sync_id uuid)
returns void as $$
declare
  v_booking_id uuid;
  v_cursor cursor for select id from public.external_urea_bookings where sync_id = p_sync_id;
begin
  for v_booking_id in v_cursor loop
    perform match_urea_booking_with_farmer(v_booking_id);
  end loop;
end;
$$ language plpgsql;

-- Function to get urea analytics
create or replace function get_urea_analytics()
returns jsonb as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'total_farmers', (select count(*) from public.farmer_database),
    'total_urea_booked_farmers', (select count(distinct aadhaar_no) from public.external_urea_bookings where aadhaar_no != ''),
    'not_booked_farmers', (select count(*) from public.farmer_database) - (select count(distinct aadhaar_no) from public.external_urea_bookings where aadhaar_no != ''),
    'booking_percentage', case 
      when (select count(*) from public.farmer_database) > 0 
      then round((select count(distinct aadhaar_no)::numeric / (select count(*)::numeric from public.farmer_database) * 100 from public.external_urea_bookings where aadhaar_no != ''), 2)
      else 0 
    end,
    'total_booked_urea_qty', (select coalesce(sum(urea_qty), 0) from public.external_urea_bookings),
    'matched_count', (select count(*) from public.external_urea_bookings where status = 'matched'),
    'unmatched_count', (select count(*) from public.external_urea_bookings where status = 'unmatched'),
    'duplicate_count', (select count(*) from public.external_urea_bookings where status = 'duplicate'),
    'last_sync', (select max(started_at) from public.external_urea_sync_logs where status = 'completed')
  ) into v_result;
  
  return v_result;
end;
$$ language plpgsql;
