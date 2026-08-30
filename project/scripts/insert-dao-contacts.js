// Script to create officer_contacts table and insert DAO contacts into Supabase
// Run with: node scripts/insert-dao-contacts.js

import { createClient } from '@supabase/supabase-js';

// Use the same credentials from the project
const supabaseUrl = 'https://szxtfeiswxugxukztnst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eHRmZWlzd3h1Z3h1a3p0bnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTM0MDcsImV4cCI6MjA5NTM4OTQwN30.tWylZO0WSSLmfWJ8o0R5Rmw16Dh5KRlrWKcshomhL7c';

const supabase = createClient(supabaseUrl, supabaseKey);

const daoContacts = [
  { district: 'ADILABAD', phone: '8977742697' },
  { district: 'BHADRADRI KOTHAGUDEM', phone: '8977743066' },
  { district: 'HANMAKONDA', phone: '8977756346' },
  { district: 'JAGTIAL', phone: '8977745435' },
  { district: 'JANGOAN', phone: '8977745480' },
  { district: 'JAYASHANKAR BHUPALPALLY', phone: '8977745518' },
  { district: 'JOGULAMBA GADWAL', phone: '8977745995' },
  { district: 'KAMAREDDY', phone: '8977746046' },
  { district: 'KARIMNAGAR', phone: '8977746334' },
  { district: 'KHAMMAM', phone: '8977747500' },
  { district: 'KUMURAM BHEEM ASIFABAD', phone: '8977748730' },
  { district: 'MAHABUBABAD', phone: '8977749210' },
  { district: 'MAHABUBNAGAR', phone: '8977749229' },
  { district: 'MANCHERIAL', phone: '8977750735' },
  { district: 'MEDAK', phone: '8977750785' },
  { district: 'MEDCHAL-MALKAJIGIRI', phone: '8977751031' },
  { district: 'MULUG', phone: '8977751139' },
  { district: 'NAGARKURNOOL', phone: '8977751163' },
  { district: 'NALGONDA', phone: '8977751294' },
  { district: 'NARAYANPET', phone: '8977751549' },
  { district: 'NIRMAL', phone: '8977751748' },
  { district: 'NIZAMABAD', phone: '8977751940' },
  { district: 'PEDDAPALLI', phone: '8977752780' },
  { district: 'RAJANNA SIRCILLA', phone: '8977755264' },
  { district: 'RANGAREDDY', phone: '8977753329' },
  { district: 'SANGAREDDY', phone: '8977754689' },
  { district: 'SIDDIPET', phone: '8977754775' },
  { district: 'SURYAPET', phone: '8977755833' },
  { district: 'VIKARABAD', phone: '8977755890' },
  { district: 'WANAPARTHY', phone: '8977756108' },
  { district: 'WARANGAL', phone: '8977756214' },
  { district: 'YADADRI BHUVANAGIRI', phone: '8977756419' },
];

async function createTableIfNotExists() {
  console.log('Creating officer_contacts table if it does not exist...');
  
  const createTableSQL = `
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
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "officer_contacts_select_policy" ON officer_contacts;
    DROP POLICY IF EXISTS "officer_contacts_insert_policy" ON officer_contacts;
    DROP POLICY IF EXISTS "officer_contacts_update_policy" ON officer_contacts;
    DROP POLICY IF EXISTS "officer_contacts_delete_policy" ON officer_contacts;
    
    -- Create policies
    CREATE POLICY "officer_contacts_select_policy" ON officer_contacts
      FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "officer_contacts_insert_policy" ON officer_contacts
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.email() = 'k.vinayreddy166@gmail.com'
      );
    
    CREATE POLICY "officer_contacts_update_policy" ON officer_contacts
      FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        auth.email() = 'k.vinayreddy166@gmail.com'
      );
    
    CREATE POLICY "officer_contacts_delete_policy" ON officer_contacts
      FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        auth.email() = 'k.vinayreddy166@gmail.com'
      );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_officer_contacts_type ON officer_contacts(officer_type);
    CREATE INDEX IF NOT EXISTS idx_officer_contacts_district ON officer_contacts(district);
    CREATE INDEX IF NOT EXISTS idx_officer_contacts_active ON officer_contacts(active);
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (error) {
      // Try using direct SQL via REST API
      console.log('Trying direct table creation...');
      // Since we can't execute arbitrary SQL via anon key, we'll proceed with insert
      // and let the user know they need to create the table manually
      console.log('Note: Table creation requires admin privileges. Please ensure the table exists.');
    } else {
      console.log('Table created successfully');
    }
  } catch (error) {
    console.log('Note: Could not create table automatically. Please ensure officer_contacts table exists.');
  }
}

async function insertDAOContacts() {
  console.log('Inserting DAO contacts...');
  
  // First try to create table
  await createTableIfNotExists();
  
  for (const contact of daoContacts) {
    try {
      // First try to delete existing record for this district
      await supabase
        .from('officer_contacts')
        .delete()
        .eq('officer_type', 'DAO')
        .eq('district', contact.district);
      
      // Insert new record
      const { error } = await supabase
        .from('officer_contacts')
        .insert({
          officer_type: 'DAO',
          district: contact.district,
          phone: contact.phone,
          active: true,
        });
      
      if (error) {
        console.error(`Error inserting ${contact.district}:`, error.message);
      } else {
        console.log(`✓ Inserted ${contact.district}: ${contact.phone}`);
      }
    } catch (error) {
      console.error(`Error processing ${contact.district}:`, error.message);
    }
  }
  
  console.log('Done!');
}

insertDAOContacts().catch(console.error);
