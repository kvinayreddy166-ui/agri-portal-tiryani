-- Add indexes to optimize officer_contacts queries
-- Index on officer_type and active for faster filtering
CREATE INDEX IF NOT EXISTS idx_officer_contacts_type_active 
  ON officer_contacts (officer_type, active);

-- Index on district for faster district filtering
CREATE INDEX IF NOT EXISTS idx_officer_contacts_district 
  ON officer_contacts (district);

-- Index on mandal for faster mandal filtering
CREATE INDEX IF NOT EXISTS idx_officer_contacts_mandal 
  ON officer_contacts (mandal);

-- Index on cluster for faster cluster filtering
CREATE INDEX IF NOT EXISTS idx_officer_contacts_cluster 
  ON officer_contacts (cluster);
