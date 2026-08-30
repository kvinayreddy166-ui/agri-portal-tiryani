import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://szxtfeiswxugxukztnst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eHRmZWlzd3h1Z3h1a3p0bnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxNDY1NDYsImV4cCI6MjA0MDcyMjU0Nn0.8JZ9lL2XqK7Xq7Xq7Xq7Xq7Xq7Xq7Xq7Xq7Xq7Xq7Xq';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the JSON file
const jsonPath = path.resolve('public/AEO CONTACTS.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Loaded ${jsonData.length} AEO contacts from JSON file`);

// Function to insert AEO contacts in batches
async function insertAEOContacts() {
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < jsonData.length; i += batchSize) {
    const batch = jsonData.slice(i, i + batchSize);
    
    const records = batch.map(item => ({
      officer_type: 'AEO',
      district: item.District || null,
      division: null, // AEO contacts don't have division
      mandal: item.Mandal || null,
      cluster: item.Cluster || null,
      phone: item.Mobile || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    try {
      const { data, error } = await supabase
        .from('officer_contacts')
        .insert(records)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        console.log(`Successfully inserted batch ${i / batchSize + 1} (${records.length} records)`);
        successCount += records.length;
      }
    } catch (err) {
      console.error(`Exception in batch ${i / batchSize + 1}:`, err.message);
      errorCount += batch.length;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nInsertion complete:`);
  console.log(`- Success: ${successCount} records`);
  console.log(`- Errors: ${errorCount} records`);
  console.log(`- Total: ${jsonData.length} records`);
}

insertAEOContacts().catch(console.error);
