#!/usr/bin/env node

/**
 * Miro Configuration Verification Script
 * 
 * This script helps verify and debug Miro OAuth configuration issues.
 * Run with: node scripts/verify-miro-config.js
 */

const https = require('https');
const http = require('http');

console.log('🔍 Miro Configuration Verification Script');
console.log('==========================================\n');

// Check if the application is running
function checkApplicationStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/debug/env',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const envData = JSON.parse(data);
          resolve({ success: true, data: envData });
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

// Test Miro OAuth endpoint
function testMiroOAuth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/miro',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ success: true, data: response });
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse OAuth response' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('1. Checking application status...');
  const appStatus = await checkApplicationStatus();
  
  if (!appStatus.success) {
    console.log('❌ Application is not running on port 3002');
    console.log('   Error:', appStatus.error);
    console.log('\n💡 Solution: Start the application with "npm run dev"');
    return;
  }
  
  console.log('✅ Application is running on port 3002');
  
  if (appStatus.data) {
    console.log('   Environment data:', appStatus.data);
  }

  console.log('\n2. Testing Miro OAuth endpoint...');
  const oauthStatus = await testMiroOAuth();
  
  if (!oauthStatus.success) {
    console.log('❌ Miro OAuth endpoint failed');
    console.log('   Error:', oauthStatus.error);
    return;
  }
  
  console.log('✅ Miro OAuth endpoint is accessible');
  
  if (oauthStatus.data && oauthStatus.data.authUrl) {
    console.log('   Generated OAuth URL:', oauthStatus.data.authUrl);
    
    // Extract redirect URI from the OAuth URL
    try {
      const url = new URL(oauthStatus.data.authUrl);
      const redirectUri = url.searchParams.get('redirect_uri');
      console.log('   Redirect URI being used:', redirectUri);
      
      if (redirectUri === 'http://localhost:3002/api/auth/miro/callback') {
        console.log('✅ Redirect URI is correct');
      } else {
        console.log('❌ Redirect URI mismatch!');
        console.log('   Expected: http://localhost:3002/api/auth/miro/callback');
        console.log('   Actual:  ', redirectUri);
      }
    } catch (e) {
      console.log('❌ Failed to parse OAuth URL');
    }
  }

  console.log('\n3. Configuration Summary:');
  console.log('   Application Port: 3002');
  console.log('   Expected Redirect URI: http://localhost:3002/api/auth/miro/callback');
  console.log('   Client ID: 3458764638511169275');
  console.log('   Team ID: 3458764638509871660');
  
  console.log('\n4. Next Steps:');
  console.log('   1. Go to https://developers.miro.com/');
  console.log('   2. Find your app (Client ID: 3458764638511169275)');
  console.log('   3. Go to OAuth settings');
  console.log('   4. Add redirect URI: http://localhost:3002/api/auth/miro/callback');
  console.log('   5. Save the configuration');
  console.log('   6. Wait 1-2 minutes for changes to propagate');
  console.log('   7. Test the OAuth flow again');
  
  console.log('\n5. Troubleshooting:');
  console.log('   - If you still get "Invalid redirect_uri" error, wait a few minutes');
  console.log('   - Clear your browser cache and cookies');
  console.log('   - Make sure there are no extra spaces in the redirect URI');
  console.log('   - Ensure the redirect URI is the first one in the list');
}

main().catch(console.error);
