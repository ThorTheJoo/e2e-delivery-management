const fetch = require('node-fetch');

async function testConfluenceAPI() {
  try {
    const payload = {
      action: 'test',
      config: {
        baseUrl: 'https://confluence.csgicorp.com',
        apiBase: 'auto',
        defaultFormat: 'storage'
      },
      credentials: {
        pat: 'test-token'
      }
    };

    const response = await fetch('http://localhost:3000/api/confluence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error testing Confluence API:', error.message);
  }
}

testConfluenceAPI();
