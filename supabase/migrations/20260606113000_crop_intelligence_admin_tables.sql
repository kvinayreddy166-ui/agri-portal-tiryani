/*
  Crop intelligence admin tables
  - Creates the normalized crop tables used by the admin editor.
  - Creates crop_intelligence for JSON-card edits.
  - Notifies PostgREST to reload the schema cache after DDL.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL UNIQUE,
  acreage integer DEFAULT 0,
  description text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS name_te text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS scientific_name text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS source_pdf_name text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS source_pdf_url text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS profile jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

INSERT INTO public.crops (crop_name, acreage, description, image_url, slug, name_en, name_te, scientific_name, profile, updated_at)
VALUES
  ('Paddy', 1500, 'Rice cultivation in irrigated areas', '/images/paddy.webp', 'paddy', 'Paddy / Rice', 'Paddy / Rice', 'Oryza sativa', '{"category":"food crop"}'::jsonb, now()),
  ('Maize', 200, 'Cereal crop for food and fodder', '/images/maize.webp', 'maize', 'Maize', 'Maize', 'Zea mays', '{"category":"cereal"}'::jsonb, now()),
  ('Cotton', 24500, 'Major cash crop grown in Tiryani Mandal', '/images/cotton.webp', 'cotton', 'Cotton', 'Cotton', 'Gossypium hirsutum', '{"category":"cash crop"}'::jsonb, now()),
  ('Redgram', 750, 'Pulse crop grown under rainfed conditions', '/images/pulses.webp', 'redgram', 'Redgram / Pigeonpea', 'Redgram / Pigeonpea', 'Cajanus cajan', '{"category":"pulse"}'::jsonb, now()),
  ('Greengram', 750, 'Short-duration pulse crop', '/images/greengram.webp', 'greengram', 'Greengram / Mungbean', 'Greengram / Mungbean', 'Vigna radiata', '{"category":"pulse"}'::jsonb, now())
ON CONFLICT (crop_name) DO UPDATE SET
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  slug = EXCLUDED.slug,
  name_en = EXCLUDED.name_en,
  name_te = EXCLUDED.name_te,
  scientific_name = EXCLUDED.scientific_name,
  profile = COALESCE(crops.profile, '{}'::jsonb) || EXCLUDED.profile,
  updated_at = now();

CREATE UNIQUE INDEX IF NOT EXISTS crops_slug_idx ON public.crops(slug);

CREATE TABLE IF NOT EXISTS public.crop_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  variety text NOT NULL,
  duration text DEFAULT '',
  expected_yield text DEFAULT '',
  special_features text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  category text NOT NULL,
  description_en text NOT NULL,
  description_te text DEFAULT '',
  season text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  stage text NOT NULL,
  fertilizer text NOT NULL,
  quantity text DEFAULT '',
  method text DEFAULT '',
  description_te text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_irrigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  stage text NOT NULL,
  recommendation_en text NOT NULL,
  recommendation_te text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_weeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  weed_name text NOT NULL,
  scientific_name text DEFAULT '',
  control_measure text DEFAULT '',
  herbicide text DEFAULT '',
  dose text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_pests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  pest_name text NOT NULL,
  scientific_name text DEFAULT '',
  symptoms text DEFAULT '',
  management text DEFAULT '',
  chemical_control text DEFAULT '',
  image_url text DEFAULT '',
  image_source_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_diseases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  disease_name text NOT NULL,
  causal_organism text DEFAULT '',
  symptoms text DEFAULT '',
  management text DEFAULT '',
  fungicide text DEFAULT '',
  image_url text DEFAULT '',
  image_source_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_deficiencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  deficiency_name text NOT NULL,
  nutrient text DEFAULT '',
  symptoms text DEFAULT '',
  correction text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  category text NOT NULL,
  advisory_en text NOT NULL,
  advisory_te text DEFAULT '',
  priority text DEFAULT 'normal',
  keywords text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  answer_te text DEFAULT '',
  category text DEFAULT '',
  keywords text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid REFERENCES public.crops(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  image_url text NOT NULL,
  source_name text DEFAULT '',
  source_url text DEFAULT '',
  alt_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crop_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_te text NOT NULL,
  scientific_name text DEFAULT '',
  crop_image_url text DEFAULT '',
  source_pdf_name text DEFAULT '',
  source_pdf_url text DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crop_varieties_crop_id_idx ON public.crop_varieties(crop_id);
CREATE INDEX IF NOT EXISTS crop_production_crop_id_idx ON public.crop_production(crop_id);
CREATE INDEX IF NOT EXISTS crop_fertilizers_crop_id_idx ON public.crop_fertilizers(crop_id);
CREATE INDEX IF NOT EXISTS crop_irrigation_crop_id_idx ON public.crop_irrigation(crop_id);
CREATE INDEX IF NOT EXISTS crop_weeds_crop_id_idx ON public.crop_weeds(crop_id);
CREATE INDEX IF NOT EXISTS crop_pests_crop_id_idx ON public.crop_pests(crop_id);
CREATE INDEX IF NOT EXISTS crop_diseases_crop_id_idx ON public.crop_diseases(crop_id);
CREATE INDEX IF NOT EXISTS crop_deficiencies_crop_id_idx ON public.crop_deficiencies(crop_id);
CREATE INDEX IF NOT EXISTS crop_advisories_crop_id_idx ON public.crop_advisories(crop_id);
CREATE INDEX IF NOT EXISTS crop_faqs_crop_id_idx ON public.crop_faqs(crop_id);
CREATE INDEX IF NOT EXISTS crop_images_crop_id_idx ON public.crop_images(crop_id);
CREATE INDEX IF NOT EXISTS crop_intelligence_slug_idx ON public.crop_intelligence(slug);

DO $$
DECLARE
  table_name text;
  admin_email constant text := 'k.vinayreddy166@gmail.com';
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crop_varieties',
    'crop_production',
    'crop_fertilizers',
    'crop_irrigation',
    'crop_weeds',
    'crop_pests',
    'crop_diseases',
    'crop_deficiencies',
    'crop_advisories',
    'crop_faqs',
    'crop_images',
    'crop_intelligence'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Authenticated users can view ' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      'Authenticated users can view ' || table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admin can manage ' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((auth.jwt() ->> %L) = %L) WITH CHECK ((auth.jwt() ->> %L) = %L)',
      'Admin can manage ' || table_name,
      table_name,
      'email',
      admin_email,
      'email',
      admin_email
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
