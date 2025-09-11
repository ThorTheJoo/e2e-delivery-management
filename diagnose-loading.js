#!/usr/bin/env node

/**
 * Loading Diagnostics Script
 *
 * This script helps diagnose loading issues with the E2E Delivery Management System.
 * Run this to check configuration and suggest fixes.
 */

console.log('🔍 E2E Delivery Management - Loading Diagnostics');
console.log('================================================\n');

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

const checkFile = (filePath, description) => {
  try {
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
    return exists;
  } catch (error) {
    console.log(`❌ ${description}: ${filePath} (error: ${error.message})`);
    return false;
  }
};

const checkEnvVar = (varName, description) => {
  const value = process.env[varName];
  const exists = value && value.trim() && !value.includes('your-') && !value.includes('placeholder');
  console.log(`${exists ? '✅' : '❌'} ${description}: ${varName}`);
  if (exists && varName.includes('KEY')) {
    console.log(`   Value: ${value.substring(0, 20)}...`);
  }
  return exists;
};

console.log('📁 File System Check:');
checkFile('package.json', 'Project configuration');
checkFile('src/app/page.tsx', 'Main application file');
checkFile('src/lib/data-service.ts', 'Data service');
checkFile('src/lib/supabase.ts', 'Supabase configuration');
checkFile('src/lib/data-source.ts', 'Data source configuration');
checkFile('.env.local', 'Environment variables (optional)');

console.log('\n🌐 Environment Variables Check:');
checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL');
checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key');
checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'Service Role Key');

console.log('\n💡 Recommendations:');

if (!fs.existsSync('.env.local')) {
  console.log('• Consider creating .env.local with Supabase credentials (see SUPABASE-ENV-SETUP.md)');
  console.log('• Or use the UI configuration in Settings → Supabase Configuration');
}

const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-');

const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-');

if (!hasSupabaseUrl || !hasSupabaseKey) {
  console.log('• Supabase not configured - app will use demo data');
  console.log('• To enable Supabase: Run setup-supabase-ui.js or configure manually');
}

console.log('• If app is stuck loading: Click "Skip Loading" button');
console.log('• Check browser console for detailed error messages');
console.log('• Try refreshing the page or clearing browser cache');

console.log('\n🚀 Quick Start Commands:');
console.log('npm run dev                    # Start development server');
console.log('npm install dotenv --save-dev  # For environment variable testing');
console.log('node test-supabase-connection.js  # Test Supabase connection');
console.log('node setup-supabase-ui.js      # Interactive Supabase setup');

console.log('\n📞 If issues persist:');
console.log('1. Open browser developer tools (F12)');
console.log('2. Check Console tab for error messages');
console.log('3. Click "Show Diagnostics" on loading screen');
console.log('4. Configure Supabase in Settings → Supabase Configuration');

console.log('\n✨ The app should load within 10-15 seconds, or you can click "Skip Loading" immediately.');
