import fs from 'fs';
import path from 'path';

// Read the JSON file
const jsonPath = path.resolve('public/AEO CONTACTS.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Generate SQL INSERT statements
let sql = '-- Insert AEO contacts into officer_contacts table\n';
sql += '-- Data provided: AEO contacts with district, mandal, cluster, and mobile\n';
sql += '-- Run this SQL in Supabase Dashboard SQL Editor to bypass RLS\n\n';

sql += 'INSERT INTO officer_contacts (officer_type, district, division, mandal, cluster, phone, active, created_at, updated_at) VALUES\n';

const values = jsonData.map((item, index) => {
  const district = item.District || '';
  const mandal = item.Mandal || '';
  const cluster = item.Cluster || '';
  const phone = item.Mobile || '';
  
  return `  ('AEO', '${district}', NULL, '${mandal}', '${cluster}', '${phone}', true, now(), now())${index === jsonData.length - 1 ? ';' : ','}`;
});

sql += values.join('\n');

// Write to SQL file
const outputPath = path.resolve('supabase/migrations/20260830130000_aeo_contacts.sql');
fs.writeFileSync(outputPath, sql);

console.log(`Generated SQL file with ${jsonData.length} AEO contacts at ${outputPath}`);
