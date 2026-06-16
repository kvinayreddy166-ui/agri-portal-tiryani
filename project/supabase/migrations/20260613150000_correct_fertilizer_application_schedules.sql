insert into public.crop_fertilizer_recommendations
  (crop_name, crop, zone, season, variety, n, p, k, area_unit, split_plan, is_active)
values
  ('Paddy', 'Paddy', 'All Zones', 'All Seasons', 'Normal', 48, 20, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":34,"pPct":100,"kPct":100},{"stage":"Active tillering stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":33,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Paddy Vanakalam - Northern Telangana', 'Paddy', 'Northern Telangana', 'Vanakalam', 'Normal', 48, 20, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":34,"pPct":100,"kPct":100},{"stage":"Active tillering stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":33,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Paddy Vanakalam - Central Telangana', 'Paddy', 'Central Telangana', 'Vanakalam', 'Normal', 48, 20, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":34,"pPct":100,"kPct":100},{"stage":"Active tillering stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":33,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Paddy Vanakalam - Southern Telangana', 'Paddy', 'Southern Telangana', 'Vanakalam', 'Normal', 48, 24, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":34,"pPct":100,"kPct":100},{"stage":"Active tillering stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":33,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Paddy Yasangi - All Zones', 'Paddy', 'All Zones', 'Yasangi', 'Normal', 60, 24, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":34,"pPct":100,"kPct":100},{"stage":"Active tillering stage","nPct":33,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":33,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Paddy Long Duration - All Zones', 'Paddy', 'All Zones', 'All Seasons', 'Long Duration', 60, 24, 16, 'acre', '[{"stage":"Before transplanting / final puddling","nPct":25,"pPct":100,"kPct":100},{"stage":"15-20 days after first split","nPct":25,"pPct":0,"kPct":0},{"stage":"15-20 days after second split","nPct":25,"pPct":0,"kPct":0},{"stage":"Panicle initiation stage","nPct":25,"pPct":0,"kPct":0}]'::jsonb, true),
  ('Maize', 'Maize', 'All Zones', 'All Seasons', 'Normal', 80, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Kharif - Normal', 'Maize', 'All Zones', 'Vanakalam', 'Normal', 80, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Kharif - Sweet Corn', 'Maize', 'All Zones', 'Vanakalam', 'Sweet Corn', 72, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Kharif - Pop Corn', 'Maize', 'All Zones', 'Vanakalam', 'Pop Corn', 32, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Kharif - Baby Corn', 'Maize', 'All Zones', 'Vanakalam', 'Baby Corn', 48, 20, 16, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Yasangi - Normal', 'Maize', 'All Zones', 'Yasangi', 'Normal', 90, 32, 32, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Yasangi - Sweet Corn', 'Maize', 'All Zones', 'Yasangi', 'Sweet Corn', 80, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Yasangi - Pop Corn', 'Maize', 'All Zones', 'Yasangi', 'Pop Corn', 40, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true),
  ('Maize Yasangi - Baby Corn', 'Maize', 'All Zones', 'Yasangi', 'Baby Corn', 70, 24, 20, 'acre', '[{"stage":"Sowing/Basal application","nPct":33.33,"pPct":100,"kPct":50},{"stage":"Knee-high stage","nPct":33.33,"pPct":0,"kPct":0},{"stage":"Tasseling/Flowering stage","nPct":33.34,"pPct":0,"kPct":50}]'::jsonb, true)
on conflict (crop_name) do update set
  crop = excluded.crop,
  zone = excluded.zone,
  season = excluded.season,
  variety = excluded.variety,
  n = excluded.n,
  p = excluded.p,
  k = excluded.k,
  area_unit = excluded.area_unit,
  split_plan = excluded.split_plan,
  is_active = excluded.is_active,
  updated_at = now();
