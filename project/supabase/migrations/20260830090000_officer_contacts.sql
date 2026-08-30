/*
  # AGRONIX - Officer Contacts Module
  
  This migration creates the officer_contacts table to store:
  - AEO (Agriculture Extension Officer)
  - MAO (Mandal Agriculture Officer)
  - ADA (Assistant Director of Agriculture)
  - DAO (District Agriculture Officer)
  
  Table Structure:
  - officer_type: AEO, MAO, ADA, DAO
  - name: Officer name (nullable for ADA which only has designation)
  - district: District name
  - division: Division name (nullable for AEO and DAO)
  - mandal: Mandal name (nullable for ADA and DAO)
  - cluster: Cluster name (only for AEO)
  - phone: Mobile number (TEXT, not numeric)
  - email: Email address (optional)
  - active: Boolean to mark inactive contacts
*/

-- Officer Contacts Table
CREATE TABLE IF NOT EXISTS officer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_type text NOT NULL CHECK (officer_type IN ('AEO', 'MAO', 'ADA', 'DAO')),
  name text,
  district text NOT NULL,
  division text,
  mandal text,
  cluster text,
  phone text NOT NULL,
  email text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE officer_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view officer contacts"
  ON officer_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert officer contacts"
  ON officer_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can update officer contacts"
  ON officer_contacts FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

CREATE POLICY "Admin can delete officer contacts"
  ON officer_contacts FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'k.vinayreddy166@gmail.com');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_contacts_type ON officer_contacts(officer_type);
CREATE INDEX IF NOT EXISTS idx_officer_contacts_district ON officer_contacts(district);
CREATE INDEX IF NOT EXISTS idx_officer_contacts_division ON officer_contacts(division);
CREATE INDEX IF NOT EXISTS idx_officer_contacts_mandal ON officer_contacts(mandal);
CREATE INDEX IF NOT EXISTS idx_officer_contacts_active ON officer_contacts(active);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_officer_contacts_updated_at
  BEFORE UPDATE ON officer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
