#!/usr/bin/env node

/**
 * Miro Client Secret Diagnostic Script
 * 
 * This script helps diagnose Miro client secret issues.
 * Run with: node scripts/diagnose-miro-secret.js
 */

const http = require('http');

console.log('🔍 Miro Client Secret Diagnostic Script');
console.log('=====================================\n');

// Check server configuration
function checkServerConfig() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/miro/config',
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
          const config = JSON.parse(data);
          resolve({ success: true, data: config });
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

// Test OAuth endpoint to see what error we get
function testOAuthEndpoint() {
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
  console.log('1. Checking server configuration...');
  const configStatus = await checkServerConfig();
  
  if (!configStatus.success) {
    console.log('❌ Failed to get server configuration');
    console.log('   Error:', configStatus.error);
    return;
  }
  
  console.log('✅ Server configuration retrieved');
  
  if (configStatus.data && configStatus.data.serverConfig) {
    const config = configStatus.data.serverConfig;
    console.log('   Configuration details:');
    console.log('   - Client ID:', config.clientId);
    console.log('   - Client Secret:', config.clientSecret);
    console.log('   - Redirect URI:', config.redirectUri);
    console.log('   - Scopes:', config.scopes);
    
    // Check for common issues
    if (config.clientSecret === '***SET***') {
      console.log('   ✅ Client secret appears to be set (masked for security)');
    } else if (config.clientSecret === 'NOT SET') {
      console.log('   ❌ Client secret is not set');
    } else if (config.clientSecret === 'YOUR_MIRO_CLIENT_SECRET_HERE') {
      console.log('   ❌ Client secret is still a placeholder value');
    } else {
      console.log('   ⚠️  Client secret status unclear:', config.clientSecret);
    }
  }

  console.log('\n2. Testing OAuth endpoint...');
  const oauthStatus = await testOAuthEndpoint();
  
  if (!oauthStatus.success) {
    console.log('❌ OAuth endpoint failed');
    console.log('   Error:', oauthStatus.error);
    return;
  }
  
  console.log('✅ OAuth endpoint is accessible');
  
  if (oauthStatus.data && oauthStatus.data.authUrl) {
    console.log('   Generated OAuth URL:', oauthStatus.data.authUrl);
  }

  console.log('\n3. Common Issues and Solutions:');
  console.log('   📋 Check these potential problems:');
  console.log('   1. Client Secret is placeholder value "YOUR_MIRO_CLIENT_SECRET_HERE"');
  console.log('   2. Client Secret doesn\'t match Miro Developer Platform');
  console.log('   3. Client Secret has extra spaces or characters');
  console.log('   4. Miro app configuration is incorrect');
  
  console.log('\n4. Next Steps:');
  console.log('   1. Go to Miro Configuration tab in the application');
  console.log('   2. Check if Client Secret field has a real value');
  console.log('   3. If it\'s empty or placeholder, enter your real Client Secret');
  console.log('   4. Click "Save Configuration"');
  console.log('   5. Try the OAuth flow again');
  
  console.log('\n5. Miro Developer Platform:');
  console.log('   - Go to https://developers.miro.com/');
  console.log('   - Find your app (Client ID: 3458764638511169275)');
  console.log('   - Copy the Client Secret from there');
  console.log('   - Make sure it matches what you enter in the app');
}

main().catch(console.error);
