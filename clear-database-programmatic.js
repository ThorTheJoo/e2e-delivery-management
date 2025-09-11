#!/usr/bin/env node

/**
 * Database Data Clearing Script
 *
 * This script safely clears all data from your Supabase database
 * while preserving table structures and relationships.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - replace with your actual credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (SUPABASE_URL.includes('your-project') || SUPABASE_SERVICE_KEY.includes('your-service-role-key')) {
  console.log('❌ Please set your actual Supabase credentials first!');
  console.log('');
  console.log('Set these environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('');
  console.log('Or edit the constants at the top of this file.');
  process.exit(1);
}

// Tables to clear (in dependency order)
const TABLES_TO_CLEAR = [
  'filter_options',
  'filter_categories',
  'user_preferences',
  'integration_configs',
  'bill_of_materials',
  'work_packages',
  'cetv22_data',
  'blue_dolphin_objects',
  'specsync_items',
  'user_capabilities',
  'user_domains',
  'tmf_reference_capabilities',
  'tmf_reference_domains',
  'projects'
];

async function clearDatabase() {
  console.log('🗑️  Database Clearing Script');
  console.log('============================\n');

  console.log('⚠️  WARNING: This will delete ALL data from your database!');
  console.log('   Tables will remain intact, but all records will be lost.\n');

  // Create readline interface for user confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = () => {
    return new Promise((resolve) => {
      rl.question('Are you sure you want to clear ALL database data? (type "yes" to confirm): ', (answer) => {
        resolve(answer.toLowerCase() === 'yes');
      });
    });
  };

  const confirmed = await confirm();

  if (!confirmed) {
    console.log('❌ Operation cancelled by user.');
    rl.close();
    return;
  }

  console.log('\n🔄 Connecting to Supabase...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Test connection
  try {
    const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Connected successfully');
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    rl.close();
    return;
  }

  // Get initial counts
  console.log('\n📊 Getting initial data counts...');
  const initialCounts = {};
  for (const table of TABLES_TO_CLEAR) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) throw error;
      initialCounts[table] = count || 0;
    } catch (error) {
      console.log(`⚠️  Could not count records in ${table}:`, error.message);
      initialCounts[table] = 'unknown';
    }
  }

  console.log('\n📈 Initial Data Counts:');
  Object.entries(initialCounts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} records`);
  });

  // Clear tables
  console.log('\n🗑️  Clearing data...');
  let totalCleared = 0;

  for (const table of TABLES_TO_CLEAR) {
    try {
      console.log(`   Clearing ${table}...`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      const clearedCount = typeof initialCounts[table] === 'number' ? initialCounts[table] : 0;
      totalCleared += clearedCount;
      console.log(`   ✅ Cleared ${clearedCount} records from ${table}`);
    } catch (error) {
      console.log(`   ❌ Failed to clear ${table}:`, error.message);
    }
  }

  // Verify clearing
  console.log('\n🔍 Verifying data was cleared...');
  const finalCounts = {};
  for (const table of TABLES_TO_CLEAR) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) throw error;
      finalCounts[table] = count || 0;
    } catch (error) {
      console.log(`⚠️  Could not verify ${table}:`, error.message);
      finalCounts[table] = 'unknown';
    }
  }

  console.log('\n📊 Final Data Counts:');
  Object.entries(finalCounts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} records`);
  });

  // Summary
  console.log('\n🎉 Database Clearing Complete!');
  console.log(`   Total records cleared: ${totalCleared}`);
  console.log('   All table structures preserved ✅');

  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.log('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the script
clearDatabase().catch((error) => {
  console.log('❌ Script failed:', error.message);
  process.exit(1);
});
