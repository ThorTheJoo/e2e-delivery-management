const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Configuration - you can set these as environment variables or modify here
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

console.log('TMF Reference Data Setup');
console.log('========================');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Service Key:', SUPABASE_SERVICE_KEY ? '***configured***' : 'NOT SET');

if (SUPABASE_URL === 'https://your-project.supabase.co' || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'your-service-role-key') {
  console.log('\n❌ Please configure your Supabase credentials:');
  console.log('1. Set NEXT_PUBLIC_SUPABASE_URL environment variable');
  console.log('2. Set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('3. Or modify the script with your credentials');
  console.log('\nYou can also run this script with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-url SUPABASE_SERVICE_ROLE_KEY=your-key node setup-tmf-reference-data.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createSchema() {
  console.log('\n📋 Creating database schema...');
  
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'supabase-tmf-reference-schema.sql'), 'utf8');
  
  try {
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.warn('Schema statement warning:', error.message);
        }
      }
    }
    
    console.log('✅ Schema creation completed');
  } catch (error) {
    console.log('⚠️  Schema creation had some issues (this is normal if tables already exist):', error.message);
  }
}

async function loadReferenceData() {
  console.log('\n📊 Loading TMF reference data...');
  
  try {
    // Clear existing data
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

    console.log('✅ TMF reference data load completed successfully!');
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
    console.error('❌ Error loading TMF reference data:', error);
    throw error;
  }
}

async function main() {
  try {
    await createSchema();
    await loadReferenceData();
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application to use the new TMF reference data');
    console.log('2. Test the Domain & TMF Function Overview component');
    console.log('3. Test SpecSync import mapping');
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main();

