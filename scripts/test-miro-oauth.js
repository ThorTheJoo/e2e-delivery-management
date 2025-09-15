#!/usr/bin/env node

/**
 * Miro OAuth Test Script
 * 
 * This script tests the complete Miro OAuth flow step by step.
 * Run with: node scripts/test-miro-oauth.js
 */

const http = require('http');

console.log('🧪 Miro OAuth Test Script');
console.log('========================\n');

// Test 1: Check server configuration
async function testServerConfig() {
  console.log('1. Testing server configuration...');
  
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
          if (config.serverConfig) {
            console.log('   ✅ Server configuration found');
            console.log('   - Client ID:', config.serverConfig.clientId);
            console.log('   - Client Secret:', config.serverConfig.clientSecret);
            console.log('   - Redirect URI:', config.serverConfig.redirectUri);
            resolve({ success: true, config: config.serverConfig });
          } else {
            console.log('   ❌ No server configuration found');
            resolve({ success: false, error: 'No server config' });
          }
        } catch (e) {
          console.log('   ❌ Failed to parse configuration');
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', (err) => {
      console.log('   ❌ Request failed:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log('   ❌ Request timeout');
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Test 2: Test OAuth initiation
async function testOAuthInitiation() {
  console.log('\n2. Testing OAuth initiation...');
  
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
          if (response.authUrl) {
            console.log('   ✅ OAuth URL generated successfully');
            console.log('   - URL:', response.authUrl);
            resolve({ success: true, authUrl: response.authUrl });
          } else {
            console.log('   ❌ No OAuth URL generated');
            console.log('   - Response:', response);
            resolve({ success: false, error: 'No auth URL' });
          }
        } catch (e) {
          console.log('   ❌ Failed to parse OAuth response');
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', (err) => {
      console.log('   ❌ OAuth request failed:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log('   ❌ OAuth request timeout');
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Test 3: Simulate token exchange (with fake code)
async function testTokenExchange() {
  console.log('\n3. Testing token exchange (simulation)...');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      code: 'test_authorization_code_12345'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/miro',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
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
          if (response.error) {
            console.log('   ⚠️  Token exchange failed (expected with test code)');
            console.log('   - Error:', response.error);
            
            // Check if it's a client secret error
            if (response.error.includes('ClientSecret') || response.error.includes('secret')) {
              console.log('   🔍 This confirms the client secret issue!');
              resolve({ success: false, error: 'Client secret issue confirmed', details: response.error });
            } else {
              console.log('   ℹ️  Different error (not client secret related)');
              resolve({ success: false, error: 'Other error', details: response.error });
            }
          } else {
            console.log('   ✅ Token exchange successful (unexpected with test code)');
            resolve({ success: true, response });
          }
        } catch (e) {
          console.log('   ❌ Failed to parse token exchange response');
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', (err) => {
      console.log('   ❌ Token exchange request failed:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log('   ❌ Token exchange request timeout');
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Starting Miro OAuth flow tests...\n');

  // Test 1: Server configuration
  const configResult = await testServerConfig();
  if (!configResult.success) {
    console.log('\n❌ Server configuration test failed. Please check your Miro configuration.');
    return;
  }

  // Test 2: OAuth initiation
  const oauthResult = await testOAuthInitiation();
  if (!oauthResult.success) {
    console.log('\n❌ OAuth initiation test failed. Please check your Miro configuration.');
    return;
  }

  // Test 3: Token exchange simulation
  const tokenResult = await testTokenExchange();
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log('✅ Server configuration: OK');
  console.log('✅ OAuth initiation: OK');
  
  if (tokenResult.error === 'Client secret issue confirmed') {
    console.log('🔍 Token exchange: Client secret issue confirmed');
    console.log('\n💡 Next Steps:');
    console.log('1. Go to Miro Developer Platform (https://developers.miro.com/)');
    console.log('2. Find your app (Client ID: 3458764638511169275)');
    console.log('3. Copy the Client Secret');
    console.log('4. Go to your application\'s Miro Configuration tab');
    console.log('5. Paste the Client Secret and save');
    console.log('6. Try the OAuth flow again');
  } else if (tokenResult.success) {
    console.log('✅ Token exchange: OK (unexpected with test code)');
  } else {
    console.log('⚠️  Token exchange: Other issue -', tokenResult.details);
  }

  console.log('\n🔗 OAuth URL for manual testing:');
  console.log(oauthResult.authUrl);
  console.log('\n📝 Note: Use this URL in your browser to test the complete OAuth flow.');
}

main().catch(console.error);
