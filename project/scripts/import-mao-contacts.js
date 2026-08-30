// Script to import MAO contacts from CSV into Supabase
// Run with: node scripts/import-mao-contacts.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Use the same credentials from the project
const supabaseUrl = 'https://szxtfeiswxugxukztnst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eHRmZWlzd3h1Z3h1a3p0bnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTM0MDcsImV4cCI6MjA5NTM4OTQwN30.tWylZO0WSSLmfWJ8o0R5Rmw16Dh5KRlrWKcshomhL7c';

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const record = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] ? values[index].trim() : '';
    });
    
    records.push(record);
  }
  
  return records;
}

async function importMAOContacts() {
  console.log('Importing MAO contacts from CSV...');
  
  try {
    // Read CSV file
    const csvContent = fs.readFileSync('./mao_contacts.csv', 'utf-8');
    
    // Parse CSV
    const records = parseCSV(csvContent);
    
    console.log(`Found ${records.length} records in CSV`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        // Skip if phone is empty
        if (!record.phone || record.phone.trim() === '') {
          console.log(`Skipping ${record.district} - ${record.mandal} (no phone)`);
          continue;
        }
        
        // Delete existing record if it exists
        await supabase
          .from('officer_contacts')
          .delete()
          .eq('officer_type', 'MAO')
          .eq('district', record.district)
          .eq('division', record.division)
          .eq('mandal', record.mandal);
        
        // Insert new record
        const { error } = await supabase
          .from('officer_contacts')
          .insert({
            officer_type: record.officer_type || 'MAO',
            district: record.district,
            division: record.division,
            mandal: record.mandal,
            phone: record.phone,
            active: true,
          });
        
        if (error) {
          console.error(`Error inserting ${record.district} - ${record.mandal}:`, error.message);
          errorCount++;
        } else {
          successCount++;
          console.log(`✓ ${successCount}/${records.length}: ${record.district} - ${record.mandal}`);
        }
      } catch (error) {
        console.error(`Error processing ${record.district} - ${record.mandal}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\nImport complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error reading or parsing CSV:', error.message);
  }
}

importMAOContacts().catch(console.error);
