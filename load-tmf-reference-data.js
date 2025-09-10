const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadTMFReferenceData() {
  try {
    console.log('Starting TMF reference data load...');

    // First, clear existing data
    console.log('Clearing existing data...');
    await supabase.from('specsync_tmf_mappings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tmf_functions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tmf_domains').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Read and parse CSV file
    const csvData = [];
    const csvPath = path.join(__dirname, 'TMF_Domains_Functions.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log('Reading CSV file...');
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean up the data
          const cleanRow = {
            domain: row.Domain?.trim(),
            vertical: row.Vertical?.trim(),
            afLevel1: row['AF Lev.1']?.trim(),
            afLevel2: row['AF Lev.2']?.trim(),
            functionName: row['Rephrased Function Name']?.trim(),
            functionId: row['Function ID'] ? parseInt(row['Function ID']) : null,
            uid: row.UID ? parseInt(row.UID) : null
          };
          
          // Only add rows with valid domain and function name
          if (cleanRow.domain && cleanRow.functionName) {
            csvData.push(cleanRow);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Parsed ${csvData.length} rows from CSV`);

    // Get unique domains
    const uniqueDomains = [...new Set(csvData.map(row => row.domain))];
    console.log(`Found ${uniqueDomains.length} unique domains:`, uniqueDomains);

    // Insert domains
    console.log('Inserting domains...');
    const domainInserts = uniqueDomains.map(domain => ({ name: domain }));
    const { data: insertedDomains, error: domainError } = await supabase
      .from('tmf_domains')
      .insert(domainInserts)
      .select();

    if (domainError) {
      throw new Error(`Error inserting domains: ${domainError.message}`);
    }

    console.log(`Inserted ${insertedDomains.length} domains`);

    // Create domain name to ID mapping
    const domainMap = new Map();
    insertedDomains.forEach(domain => {
      domainMap.set(domain.name, domain.id);
    });

    // Insert functions
    console.log('Inserting functions...');
    const functionInserts = csvData.map(row => ({
      domain_id: domainMap.get(row.domain),
      function_name: row.functionName,
      vertical: row.vertical || null,
      af_level_1: row.afLevel1 || null,
      af_level_2: row.afLevel2 || null,
      function_id: row.functionId,
      uid: row.uid
    }));

    // Insert in batches to avoid payload size limits
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < functionInserts.length; i += batchSize) {
      const batch = functionInserts.slice(i, i + batchSize);
      const { error: functionError } = await supabase
        .from('tmf_functions')
        .insert(batch);

      if (functionError) {
        throw new Error(`Error inserting functions batch ${Math.floor(i/batchSize) + 1}: ${functionError.message}`);
      }
      
      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount}/${functionInserts.length} functions`);
    }

    console.log('TMF reference data load completed successfully!');
    console.log(`Summary:`);
    console.log(`- Domains: ${insertedDomains.length}`);
    console.log(`- Functions: ${insertedCount}`);

    // Verify the data
    const { data: domainCount } = await supabase
      .from('tmf_domains')
      .select('id', { count: 'exact' });
    
    const { data: functionCount } = await supabase
      .from('tmf_functions')
      .select('id', { count: 'exact' });

    console.log(`Verification:`);
    console.log(`- Domains in database: ${domainCount?.length || 0}`);
    console.log(`- Functions in database: ${functionCount?.length || 0}`);

  } catch (error) {
    console.error('Error loading TMF reference data:', error);
    process.exit(1);
  }
}

// Run the load function
loadTMFReferenceData();

