#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 *
 * This script tests your Supabase configuration and verifies that:
 * 1. Environment variables are set
 * 2. Supabase client can connect
 * 3. Required tables exist
 * 4. Basic CRUD operations work
 *
 * Usage:
 * 1. Set your environment variables in .env.local
 * 2. Run: node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`);
}

async function testEnvironmentVariables() {
  logHeader('Testing Environment Variables');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allSet = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.includes('your-') || value.includes('placeholder')) {
      log(`❌ ${varName}: Not set or using placeholder`, 'red');
      allSet = false;
    } else {
      log(`✅ ${varName}: Set`, 'green');
    }
  }

  return allSet;
}

async function testSupabaseConnection() {
  logHeader('Testing Supabase Connection');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      log('❌ Missing Supabase URL or anon key', 'red');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test basic connectivity
    const { data, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });

    if (error) {
      log(`❌ Connection failed: ${error.message}`, 'red');
      return false;
    }

    log(`✅ Connected successfully`, 'green');
    log(`   Found ${data ? 'some' : 'no'} projects in database`, 'blue');
    return true;

  } catch (error) {
    log(`❌ Connection test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testServiceRoleConnection() {
  logHeader('Testing Service Role Connection');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log('❌ Missing Supabase URL or service role key', 'red');
      return false;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Test service role connectivity with a simple query
    const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

    if (error) {
      log(`❌ Service role connection failed: ${error.message}`, 'red');
      return false;
    }

    log(`✅ Service role connection successful`, 'green');
    return true;

  } catch (error) {
    log(`❌ Service role test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testTableExistence() {
  logHeader('Testing Required Tables');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      log('❌ Cannot test tables without valid connection', 'red');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const requiredTables = [
      'projects',
      'tmf_reference_domains',
      'tmf_reference_capabilities',
      'user_domains',
      'user_capabilities',
      'specsync_items',
      'blue_dolphin_objects',
      'cetv22_data',
      'work_packages',
      'bill_of_materials',
      'integration_configs',
      'user_preferences',
      'filter_categories',
      'filter_options'
    ];

    let allExist = true;

    for (const tableName of requiredTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          log(`❌ ${tableName}: ${error.message}`, 'red');
          allExist = false;
        } else {
          log(`✅ ${tableName}: Exists (${count || 0} records)`, 'green');
        }
      } catch (error) {
        log(`❌ ${tableName}: Error - ${error.message}`, 'red');
        allExist = false;
      }
    }

    return allExist;

  } catch (error) {
    log(`❌ Table test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBasicOperations() {
  logHeader('Testing Basic CRUD Operations');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      log('❌ Cannot test operations without valid connection', 'red');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test CREATE
    const testProject = {
      name: 'Test Project - Connection Test',
      customer: 'Test Customer',
      status: 'Planning',
      metadata: { test: true, created_by_test: true }
    };

    const { data: created, error: createError } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single();

    if (createError) {
      log(`❌ CREATE failed: ${createError.message}`, 'red');
      return false;
    }

    log(`✅ CREATE: Project created with ID ${created.id}`, 'green');

    // Test READ
    const { data: read, error: readError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', created.id)
      .single();

    if (readError) {
      log(`❌ READ failed: ${readError.message}`, 'red');
      return false;
    }

    log(`✅ READ: Project retrieved successfully`, 'green');

    // Test UPDATE
    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ status: 'In Progress' })
      .eq('id', created.id)
      .select()
      .single();

    if (updateError) {
      log(`❌ UPDATE failed: ${updateError.message}`, 'red');
      return false;
    }

    log(`✅ UPDATE: Project status updated`, 'green');

    // Test DELETE
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', created.id);

    if (deleteError) {
      log(`❌ DELETE failed: ${deleteError.message}`, 'red');
      return false;
    }

    log(`✅ DELETE: Test project cleaned up`, 'green');

    return true;

  } catch (error) {
    log(`❌ CRUD test failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log(`${colors.bold}🚀 Supabase Connection Test${colors.reset}`);
  log(`Testing your Supabase configuration...\n`);

  const results = {
    envVars: await testEnvironmentVariables(),
    connection: await testSupabaseConnection(),
    serviceRole: await testServiceRoleConnection(),
    tables: await testTableExistence(),
    operations: await testBasicOperations()
  };

  logHeader('Test Results Summary');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });

  log(`\n${colors.bold}Overall: ${passedTests}/${totalTests} tests passed${colors.reset}`);

  if (passedTests === totalTests) {
    log(`\n🎉 ${colors.green}All tests passed! Your Supabase setup is working correctly.${colors.reset}`);
    log(`\nYou can now:`);
    log(`1. Start your development server: npm run dev`);
    log(`2. Use the Supabase Configuration section in your app`);
    log(`3. Test the "Export SpecSync Now" feature`);
  } else {
    log(`\n⚠️  ${colors.yellow}Some tests failed. Please check the errors above and fix them.${colors.reset}`);
    log(`\nCommon issues:`);
    log(`1. Environment variables not set in .env.local`);
    log(`2. Invalid Supabase URL or keys`);
    log(`3. Database tables not created (run supabase-schema.sql)`);
    log(`4. Network connectivity issues`);

    if (!results.envVars) {
      log(`\n${colors.blue}💡 Start by setting up your .env.local file (see SUPABASE-ENV-SETUP.md)${colors.reset}`);
    }
    if (!results.tables) {
      log(`\n${colors.blue}💡 Run the SQL schema in your Supabase dashboard (see supabase-schema.sql)${colors.reset}`);
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the test
main().catch((error) => {
  log(`\n❌ Test failed with error: ${error.message}`, 'red');
  process.exit(1);
});
