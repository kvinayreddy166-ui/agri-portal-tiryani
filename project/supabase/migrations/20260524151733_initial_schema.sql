/*
  # Tiryani Agriculture Portal - Initial Schema

  1. New Tables
    - `dealers` - Dealer information with license details
    - `fertilizer_stock` - Fertilizer inventory management
    - `crops` - Crop types (Paddy, Maize, Cotton, Pulses, Oilseeds)
    - `crop_data` - Detailed crop information and files
    - `schemes` - Government scheme information
    - `forms_downloads` - Downloadable forms and documents
    - `excel_uploads` - Excel file uploads for data import
    - `settings` - Portal configuration settings

  2. Security
    - RLS enabled on all tables
    - Admin can perform all operations
    - Public/Guest users can only read data

  3. Notes
    - Uses auth.users for authentication
    - Admin email: k.vinayreddy166@gmail.com
    - Guest credentials: test/test
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dealers Table
CREATE TABLE IF NOT EXISTS dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_name text NOT NULL,
  ifms_id text NOT NULL,
  phone_number text NOT NULL,
  license_number text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fertilizer Stock Table
CREATE TABLE IF NOT EXISTS fertilizer_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fertilizer_type text NOT NULL,
  quantity_available integer DEFAULT 0,
  unit text DEFAULT 'kg',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Crops Table (Categories)
CREATE TABLE IF NOT EXISTS crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL UNIQUE,
  acreage integer DEFAULT 0,
  description text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Crop Data Table (Files and documents per crop)
CREATE TABLE IF NOT EXISTS crop_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid REFERENCES crops(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  file_url text,
  file_type text DEFAULT 'document',
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT ''
);

-- Government Schemes Table
CREATE TABLE IF NOT EXISTS schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name text NOT NULL,
  description text NOT NULL,
  beneficiary_details text DEFAULT '',
  eligibility text DEFAULT '',
  benefits text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forms & Downloads Table
CREATE TABLE IF NOT EXISTS forms_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_url text,
  file_type text DEFAULT 'pdf',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Excel Uploads Table
CREATE TABLE IF NOT EXISTS excel_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  upload_type text DEFAULT 'data',
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT ''
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Site Content Table (for editable sections)
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name text UNIQUE NOT NULL,
  content jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fertilizer_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Dealers
CREATE POLICY "Anyone can view dealers"
  ON dealers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert dealers"
  ON dealers FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update dealers"
  ON dealers FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete dealers"
  ON dealers FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Fertilizer Stock
CREATE POLICY "Anyone can view fertilizer stock"
  ON fertilizer_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert fertilizer stock"
  ON fertilizer_stock FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update fertilizer stock"
  ON fertilizer_stock FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete fertilizer stock"
  ON fertilizer_stock FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Crops
CREATE POLICY "Anyone can view crops"
  ON crops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert crops"
  ON crops FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update crops"
  ON crops FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete crops"
  ON crops FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Crop Data
CREATE POLICY "Anyone can view crop data"
  ON crop_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert crop data"
  ON crop_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update crop data"
  ON crop_data FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete crop data"
  ON crop_data FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Schemes
CREATE POLICY "Anyone can view schemes"
  ON schemes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert schemes"
  ON schemes FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update schemes"
  ON schemes FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete schemes"
  ON schemes FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Forms & Downloads
CREATE POLICY "Anyone can view forms_downloads"
  ON forms_downloads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert forms_downloads"
  ON forms_downloads FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update forms_downloads"
  ON forms_downloads FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete forms_downloads"
  ON forms_downloads FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Excel Uploads
CREATE POLICY "Anyone can view excel_uploads"
  ON excel_uploads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert excel_uploads"
  ON excel_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete excel_uploads"
  ON excel_uploads FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Settings
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage settings"
  ON settings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- RLS Policies for Site Content
CREATE POLICY "Anyone can view site_content"
  ON site_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage site_content"
  ON site_content FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- Insert initial data for crops
INSERT INTO crops (crop_name, acreage, description) VALUES
  ('Cotton', 24500, 'Major cash crop grown in Tiryani Mandal'),
  ('Paddy', 1500, 'Rice cultivation in irrigated areas'),
  ('Maize', 200, 'Cereal crop for food and fodder'),
  ('Pulses', 1500, 'Redgram and other pulse varieties'),
  ('Oilseeds', 300, 'Oil-bearing crops')
ON CONFLICT (crop_name) DO NOTHING;

-- Insert initial fertilizer stock
INSERT INTO fertilizer_stock (fertilizer_type, quantity_available, unit) VALUES
  ('Urea', 50000, 'kg'),
  ('DAP', 35000, 'kg'),
  ('Potash', 25000, 'kg'),
  ('SSP', 20000, 'kg'),
  ('Complex', 40000, 'kg')
ON CONFLICT DO NOTHING;

-- Insert initial schemes
INSERT INTO schemes (scheme_name, description, beneficiary_details, eligibility, benefits) VALUES
  ('Rythu Bharosa', 'Financial support scheme for farmers', 'Small and marginal farmers', 'Landholding farmers with valid documents', 'Rs. 10,000 per acre per year'),
  ('Rythu Bhima', 'Life insurance scheme for farmers', 'All registered farmers', 'Age between 18-59 years', 'Rs. 5 lakh coverage'),
  ('Crop Booking System', 'Online system for crop registration', 'All farmers', 'Valid land documents required', 'Access to MSP and procurement'),
  ('PM Kisan', 'Central government farmer support scheme', 'All farmer families', 'Landholding farmers', 'Rs. 6000 per year in 3 installments')
ON CONFLICT DO NOTHING;

-- Insert initial site content
INSERT INTO site_content (section_name, content) VALUES
  ('mandal_overview', '{"total_gram_panchayats": 29, "total_revenue_villages": 36, "geographical_area": 127782.3, "total_farmers": 8563, "cultivable_area": 28000, "area_unit": "acres", "normal_rainfall": 1377, "rainfall_unit": "mm", "soil_types": ["Black Cotton Soil", "Red Soil"]}')
ON CONFLICT (section_name) DO NOTHING;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
  ('site_name', 'Tiryani Agriculture Portal'),
  ('district', 'Kumram Bheem Asifabad District'),
  ('division', 'Asifabad Division'),
  ('mandal', 'Tiryani Mandal'),
  ('language', 'en')
ON CONFLICT (setting_key) DO NOTHING;
