#!/usr/bin/env node

/**
 * Test API Endpoint Script
 *
 * This script tests the SpecSync export API endpoint directly
 * to verify it's working correctly.
 */

const http = require('http');

const testApiEndpoint = () => {
  const postData = JSON.stringify({
    items: [
      {
        requirementId: 'TEST-001',
        functionName: 'Test Function',
        capability: 'Test Capability',
        description: 'Test item for API validation'
      }
    ],
    serviceRoleKey: 'test-key',
    supabaseUrl: 'https://test.supabase.co'
  });

  const options = {
    hostname: 'localhost',
    port: 3002, // Based on the terminal output showing port 3002
    path: '/api/specsync/export',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Testing SpecSync export API endpoint...');
  console.log(`📡 Making request to http://${options.hostname}:${options.port}${options.path}`);

  const req = http.request(options, (res) => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    console.log(`📄 Response Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📦 Response Body:');
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ Valid JSON response:', JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('❌ Invalid JSON response:', data.substring(0, 200));
        if (data.includes('<!DOCTYPE')) {
          console.log('🚨 Response is HTML, not JSON - this indicates a routing/server error');
        }
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running: npm run dev');
      console.log('💡 Check that it\'s running on port 3002');
    }
  });

  req.write(postData);
  req.end();
};

// Test if the server is running first
const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('✅ Development server is running');
    testApiEndpoint();
  });

  req.on('error', (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Development server is not running on port 3002');
      console.log('💡 Start it with: npm run dev');
      process.exit(1);
    } else {
      console.log('❌ Server check failed:', error.message);
      process.exit(1);
    }
  });

  req.end();
};

console.log('🔍 Checking if development server is running...\n');
checkServer();
