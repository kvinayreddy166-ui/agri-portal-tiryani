/*
  Create tables for Fertilizer Calculator admin panel
  - fertilizer_grades: Stores fertilizer grade information (N, P, K, S, bag weight)
  - crop_fertilizer_recommendations: Stores crop-specific fertilizer recommendations
*/

-- Create fertilizer_grades table
CREATE TABLE IF NOT EXISTS fertilizer_grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  n NUMERIC NOT NULL DEFAULT 0,
  p NUMERIC NOT NULL DEFAULT 0,
  k NUMERIC NOT NULL DEFAULT 0,
  s NUMERIC NOT NULL DEFAULT 0,
  bag_kg NUMERIC NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on fertilizer_grades
CREATE INDEX IF NOT EXISTS idx_fertilizer_grades_name ON fertilizer_grades(name);
CREATE INDEX IF NOT EXISTS idx_fertilizer_grades_is_active ON fertilizer_grades(is_active);

-- Enable RLS
ALTER TABLE fertilizer_grades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage fertilizer_grades" ON fertilizer_grades;
DROP POLICY IF EXISTS "Anyone can view fertilizer_grades" ON fertilizer_grades;

-- Create RLS policies
CREATE POLICY "Admin can manage fertilizer_grades"
  ON fertilizer_grades FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Anyone can view fertilizer_grades"
  ON fertilizer_grades FOR SELECT
  TO authenticated
  USING (true);

-- Create crop_fertilizer_recommendations table
CREATE TABLE IF NOT EXISTS crop_fertilizer_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  crop TEXT,
  zone TEXT DEFAULT 'All Zones',
  season TEXT DEFAULT 'Vanakalam',
  variety TEXT DEFAULT 'Normal',
  n NUMERIC NOT NULL DEFAULT 0,
  p NUMERIC NOT NULL DEFAULT 0,
  k NUMERIC NOT NULL DEFAULT 0,
  area_unit TEXT DEFAULT 'acre',
  split_plan JSONB DEFAULT '[
    {"stage": "Basal", "nPct": 30, "pPct": 100, "kPct": 50},
    {"stage": "20 DAS", "nPct": 25, "pPct": 0, "kPct": 20},
    {"stage": "40 DAS", "nPct": 25, "pPct": 0, "kPct": 20},
    {"stage": "60 DAS", "nPct": 20, "pPct": 0, "kPct": 10},
    {"stage": "80 DAS", "nPct": 0, "pPct": 0, "kPct": 0}
  ]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on crop_fertilizer_recommendations
CREATE INDEX IF NOT EXISTS idx_crop_fertilizer_recommendations_crop_name ON crop_fertilizer_recommendations(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_fertilizer_recommendations_is_active ON crop_fertilizer_recommendations(is_active);
CREATE INDEX IF NOT EXISTS idx_crop_fertilizer_recommendations_zone ON crop_fertilizer_recommendations(zone);
CREATE INDEX IF NOT EXISTS idx_crop_fertilizer_recommendations_season ON crop_fertilizer_recommendations(season);

-- Enable RLS
ALTER TABLE crop_fertilizer_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage crop_fertilizer_recommendations" ON crop_fertilizer_recommendations;
DROP POLICY IF EXISTS "Anyone can view crop_fertilizer_recommendations" ON crop_fertilizer_recommendations;

-- Create RLS policies
CREATE POLICY "Admin can manage crop_fertilizer_recommendations"
  ON crop_fertilizer_recommendations FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Anyone can view crop_fertilizer_recommendations"
  ON crop_fertilizer_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- Insert default fertilizer grades
INSERT INTO fertilizer_grades (name, n, p, k, s, bag_kg) VALUES
  ('Urea', 46, 0, 0, 0, 45),
  ('Ammonium Sulphate', 21, 0, 0, 24, 50),
  ('DAP', 18, 46, 0, 0, 50),
  ('MOP', 0, 0, 60, 0, 50),
  ('SSP', 0, 16, 0, 0, 50),
  ('TSP', 0, 46, 0, 0, 50),
  ('10:26:26', 10, 26, 26, 0, 50),
  ('12:32:16', 12, 32, 16, 0, 50),
  ('14:35:14', 14, 35, 14, 0, 50),
  ('15:15:15', 15, 15, 15, 0, 50),
  ('17:17:17', 17, 17, 17, 0, 50),
  ('19:19:19', 19, 19, 19, 0, 50),
  ('20:20:20', 20, 20, 20, 0, 50),
  ('Complex', 12, 32, 16, 0, 50)
ON CONFLICT DO NOTHING;

-- Insert default crop recommendations
INSERT INTO crop_fertilizer_recommendations (crop_name, crop, zone, season, variety, n, p, k, area_unit) VALUES
  ('Cotton', 'Cotton', 'All Zones', 'Vanakalam', 'Hybrid', 48, 24, 24, 'acre'),
  ('Paddy', 'Paddy', 'All Zones', 'Vanakalam', 'Hybrid', 60, 30, 30, 'acre'),
  ('Maize', 'Maize', 'All Zones', 'Vanakalam', 'Hybrid', 80, 40, 40, 'acre'),
  ('Pulses', 'Pulses', 'All Zones', 'Vanakalam', 'Normal', 20, 40, 20, 'acre'),
  ('Oilseeds', 'Oilseeds', 'All Zones', 'Vanakalam', 'Normal', 30, 30, 30, 'acre')
ON CONFLICT DO NOTHING;
