-- Optimize indexes for officer_contacts based on actual query patterns
-- These indexes support the common filter combinations used in the UI

-- Composite index for officer_type + active (most common filter)
CREATE INDEX IF NOT EXISTS idx_officer_contacts_type_active 
  ON officer_contacts (officer_type, active);

-- Composite index for officer_type + district + active (district filtering)
CREATE INDEX IF NOT EXISTS idx_officer_contacts_type_district_active 
  ON officer_contacts (officer_type, district, active);

-- Composite index for officer_type + district + mandal + active (mandal filtering)
CREATE INDEX IF NOT EXISTS idx_officer_contacts_type_district_mandal_active 
  ON officer_contacts (officer_type, district, mandal, active);

-- Composite index for officer_type + mandal + cluster + active (cluster filtering)
CREATE INDEX IF NOT EXISTS idx_officer_contacts_type_mandal_cluster_active 
  ON officer_contacts (officer_type, mandal, cluster, active);

-- GIN index for full-text search on name and phone
CREATE INDEX IF NOT EXISTS idx_officer_contacts_name_gin 
  ON officer_contacts USING gin (to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_officer_contacts_phone_gin 
  ON officer_contacts USING gin (to_tsvector('english', phone));

-- Partial index for active records only (reduces index size)
CREATE INDEX IF NOT EXISTS idx_officer_contacts_active_type 
  ON officer_contacts (officer_type, district, mandal, cluster) 
  WHERE active = true;

-- Index for district dropdown population (unique districts per officer type)
CREATE INDEX IF NOT EXISTS idx_officer_contacts_district_unique 
  ON officer_contacts (officer_type, district) 
  WHERE active = true;
