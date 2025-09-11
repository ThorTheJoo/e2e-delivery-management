#!/usr/bin/env node

/**
 * Supabase UI Setup Helper
 *
 * This script helps you set up Supabase using the UI configuration approach
 * instead of dealing with .env.local files.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Supabase UI Configuration Setup');
console.log('====================================\n');

console.log('This script will guide you through setting up Supabase using the UI approach.');
console.log('This method stores your credentials in your browser, so you don\'t need to create .env.local files.\n');

console.log('What you\'ll need:');
console.log('1. A Supabase project (create one at https://supabase.com if you haven\'t)');
console.log('2. Your project URL and API keys from the Supabase dashboard\n');

rl.question('Do you have a Supabase project ready? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\n📋 To create a Supabase project:');
    console.log('1. Go to https://supabase.com');
    console.log('2. Sign up or log in');
    console.log('3. Click "New Project"');
    console.log('4. Choose your organization and project name');
    console.log('5. Select a database password');
    console.log('6. Choose your region');
    console.log('7. Wait for project creation (2-3 minutes)\n');
    console.log('Then run this script again!');
    rl.close();
    return;
  }

  console.log('\nGreat! Let\'s get your credentials.');
  console.log('You can find these in your Supabase dashboard under Settings > API\n');

  rl.question('Enter your Supabase Project URL (https://xxxxx.supabase.co): ', (url) => {
    if (!url || !url.includes('supabase.co')) {
      console.log('❌ Invalid URL. Please make sure it\'s in the format: https://xxxxx.supabase.co');
      rl.close();
      return;
    }

    rl.question('Enter your Anon/Public Key: ', (anonKey) => {
      if (!anonKey || anonKey.length < 100) {
        console.log('❌ Invalid anon key. Please check your Supabase dashboard.');
        rl.close();
        return;
      }

      rl.question('Enter your Service Role Key (keep this secret!): ', (serviceKey) => {
        if (!serviceKey || serviceKey.length < 100) {
          console.log('❌ Invalid service role key. Please check your Supabase dashboard.');
          rl.close();
          return;
        }

        console.log('\n✅ Configuration collected successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Start your application: npm run dev');
        console.log('2. Navigate to the Supabase Configuration section');
        console.log('3. Paste these credentials in the UI fields:');
        console.log(`   - URL: ${url}`);
        console.log(`   - Anon Key: ${anonKey.substring(0, 20)}...`);
        console.log(`   - Service Key: ${serviceKey.substring(0, 20)}...`);
        console.log('4. Click "Save Configuration (UI)"');
        console.log('5. Switch to "Database (Supabase)" mode');
        console.log('6. Test with "Export SpecSync Now"');

        console.log('\n💡 Remember: This approach stores credentials in your browser\'s localStorage.');
        console.log('   - Works immediately without server restarts');
        console.log('   - Perfect for development and testing');
        console.log('   - For production, consider using .env.local files');

        rl.close();
      });
    });
  });
});
