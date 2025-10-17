const fetch = require('node-fetch');

async function testAuth() {
  try {
    // Test login
    console.log('Testing login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testlogin@huntaze.com',
        password: 'TestPassword123!@#'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginResponse.ok) {
      console.error('Login failed');
      return;
    }

    // Extract cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies set:', cookies);

    // Test JWT verification
    console.log('\nTesting JWT verification...');
    const testResponse = await fetch('http://localhost:3000/api/auth/test-jwt', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        token: 'test-token' // This would be extracted from cookies in a real test
      })
    });

    const testData = await testResponse.json();
    console.log('JWT test response:', testData);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();