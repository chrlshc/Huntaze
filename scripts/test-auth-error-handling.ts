#!/usr/bin/env tsx
/**
 * Authentication Error Handling Test
 * Tests invalid credentials and error responses
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

console.log('🧪 Authentication Error Handling Tests\n');
console.log('=' .repeat(60));
console.log(`Testing against: ${BASE_URL}\n`);

// ============================================================================
// Test 1: Invalid Credentials
// ============================================================================

async function testInvalidCredentials() {
  console.log('📋 Test 1: Invalid Credentials\n');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'invalid@example.com',
        password: 'wrongpassword',
        csrfToken: 'test-token',
        callbackUrl: `${BASE_URL}/dashboard`,
        json: 'true'
      }),
      redirect: 'manual'
    });

    // Check response status
    if (response.status === 401 || response.status === 403 || response.status === 302) {
      results.push({
        test: 'Invalid Credentials - Status Code',
        status: 'PASS',
        message: `Returned appropriate status: ${response.status}`,
        details: { status: response.status }
      });
    } else {
      results.push({
        test: 'Invalid Credentials - Status Code',
        status: 'FAIL',
        message: `Unexpected status: ${response.status}`,
        details: { status: response.status }
      });
    }

    // Check for error message
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      
      if (data.error) {
        results.push({
          test: 'Invalid Credentials - Error Message',
          status: 'PASS',
          message: 'Error message is present',
          details: { error: data.error }
        });

        // Check for sensitive data leaks
        const errorString = JSON.stringify(data).toLowerCase();
        const hasSensitiveData = 
          errorString.includes('password') ||
          errorString.includes('secret') ||
          errorString.includes('token') ||
          errorString.includes('hash');

        if (!hasSensitiveData) {
          results.push({
            test: 'Invalid Credentials - No Sensitive Data',
            status: 'PASS',
            message: 'Error response does not leak sensitive data',
            details: { error: data.error }
          });
        } else {
          results.push({
            test: 'Invalid Credentials - No Sensitive Data',
            status: 'FAIL',
            message: 'Error response may contain sensitive data',
            details: { error: data.error }
          });
        }
      } else {
        results.push({
          test: 'Invalid Credentials - Error Message',
          status: 'WARN',
          message: 'No error field in response',
          details: data
        });
      }
    } else {
      // For redirects, check the URL
      const location = response.headers.get('location');
      if (location?.includes('error=')) {
        results.push({
          test: 'Invalid Credentials - Error in Redirect',
          status: 'PASS',
          message: 'Error parameter present in redirect URL',
          details: { location }
        });
      } else {
        results.push({
          test: 'Invalid Credentials - Error Handling',
          status: 'WARN',
          message: 'Could not verify error message format',
          details: { contentType, location }
        });
      }
    }

  } catch (error) {
    results.push({
      test: 'Invalid Credentials Test',
      status: 'FAIL',
      message: 'Test failed with exception',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================================================
// Test 2: Missing Credentials
// ============================================================================

async function testMissingCredentials() {
  console.log('\n📋 Test 2: Missing Credentials\n');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: 'test-token',
        callbackUrl: `${BASE_URL}/dashboard`,
        json: 'true'
      }),
      redirect: 'manual'
    });

    if (response.status === 400 || response.status === 401 || response.status === 302) {
      results.push({
        test: 'Missing Credentials - Status Code',
        status: 'PASS',
        message: `Returned appropriate status: ${response.status}`,
        details: { status: response.status }
      });
    } else {
      results.push({
        test: 'Missing Credentials - Status Code',
        status: 'FAIL',
        message: `Unexpected status: ${response.status}`,
        details: { status: response.status }
      });
    }

  } catch (error) {
    results.push({
      test: 'Missing Credentials Test',
      status: 'FAIL',
      message: 'Test failed with exception',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================================================
// Test 3: Session Endpoint Error Handling
// ============================================================================

async function testSessionEndpoint() {
  console.log('\n📋 Test 3: Session Endpoint\n');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      results.push({
        test: 'Session Endpoint - Response',
        status: 'PASS',
        message: 'Session endpoint is accessible',
        details: { hasUser: !!data.user }
      });

      // Check response structure
      if (data.user === undefined || data.user === null || typeof data.user === 'object') {
        results.push({
          test: 'Session Endpoint - Structure',
          status: 'PASS',
          message: 'Session response has correct structure',
          details: { structure: Object.keys(data) }
        });
      } else {
        results.push({
          test: 'Session Endpoint - Structure',
          status: 'FAIL',
          message: 'Session response structure is invalid',
          details: data
        });
      }
    } else {
      results.push({
        test: 'Session Endpoint',
        status: 'FAIL',
        message: `Session endpoint returned error: ${response.status}`,
        details: { status: response.status }
      });
    }

  } catch (error) {
    results.push({
      test: 'Session Endpoint Test',
      status: 'FAIL',
      message: 'Test failed with exception',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================================================
// Test 4: CSRF Protection
// ============================================================================

async function testCSRFProtection() {
  console.log('\n📋 Test 4: CSRF Protection\n');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.csrfToken) {
        results.push({
          test: 'CSRF Protection',
          status: 'PASS',
          message: 'CSRF token endpoint is working',
          details: { hasToken: true, tokenLength: data.csrfToken.length }
        });
      } else {
        results.push({
          test: 'CSRF Protection',
          status: 'FAIL',
          message: 'CSRF token not found in response',
          details: data
        });
      }
    } else {
      results.push({
        test: 'CSRF Protection',
        status: 'FAIL',
        message: `CSRF endpoint returned error: ${response.status}`,
        details: { status: response.status }
      });
    }

  } catch (error) {
    results.push({
      test: 'CSRF Protection Test',
      status: 'FAIL',
      message: 'Test failed with exception',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runTests() {
  await testInvalidCredentials();
  await testMissingCredentials();
  await testSessionEndpoint();
  await testCSRFProtection();

  // Display Results
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results\n');

  let passCount = 0;
  let failCount = 0;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log();

    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
  });

  console.log('='.repeat(60));
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    console.log('❌ Some tests failed. Please review the results above.\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  }
}

// Check if server is running
console.log('⏳ Checking if server is running...\n');

fetch(`${BASE_URL}/api/auth/session`)
  .then(() => {
    console.log('✅ Server is running. Starting tests...\n');
    runTests();
  })
  .catch(() => {
    console.log('❌ Server is not running. Please start the development server first:\n');
    console.log('   npm run dev\n');
    console.log('Then run this script again.\n');
    process.exit(1);
  });
