-- Fix site hits RLS policy to allow both admin and test users to view site hits
-- This ensures site hits data is the same for all authenticated users

drop policy if exists "Admin can view site hits" on public.site_hits;

create policy "Authenticated users can view site hits"
  on public.site_hits
  for select
  to authenticated
  using (true);
