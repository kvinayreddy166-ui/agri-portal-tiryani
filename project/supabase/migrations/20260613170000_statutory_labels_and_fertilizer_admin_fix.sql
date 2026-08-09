alter table public.forms_downloads
  add column if not exists label text;

alter table public.fertilizer_grades enable row level security;
alter table public.crop_fertilizer_recommendations enable row level security;

drop policy if exists "fertilizer grades admin write" on public.fertilizer_grades;
create policy "fertilizer grades admin write"
  on public.fertilizer_grades for all
  to authenticated
  using (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  )
  with check (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  );

drop policy if exists "crop fertilizer recommendations admin write" on public.crop_fertilizer_recommendations;
create policy "crop fertilizer recommendations admin write"
  on public.crop_fertilizer_recommendations for all
  to authenticated
  using (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  )
  with check (
    lower(coalesce(auth.email(), auth.jwt() ->> 'email', '')) = 'k.vinayreddy166@gmail.com'
  );
