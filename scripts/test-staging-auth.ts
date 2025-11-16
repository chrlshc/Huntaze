#!/usr/bin/env ts-node

/**
 * Staging Authentication Verification Script
 * 
 * Tests NextAuth v4 endpoints on staging.huntaze.com
 * Part of subtask 8.3: Test staging authentication
 */

const STAGING_URL = 'https://staging.huntaze.com';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  url: string,
  expectedStatus: number = 200
): Promise<TestResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Huntaze-Staging-Test/1.0'
      }
    });

    const passed = response.status === expectedStatus;
    
    return {
      name,
      passed,
      message: passed 
        ? `✅ ${name} - Status ${response.status}` 
        : `❌ ${name} - Expected ${expectedStatus}, got ${response.status}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      }
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `❌ ${name} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: String(error) }
    };
  }
}

async function testJsonEndpoint(
  name: string,
  url: string,
  validator?: (data: any) => boolean
): Promise<TestResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Huntaze-Staging-Test/1.0'
      }
    });

    if (response.status !== 200) {
      return {
        name,
        passed: false,
        message: `❌ ${name} - Status ${response.status}`,
        details: { status: response.status }
      };
    }

    const data = await response.json();
    const isValid = validator ? validator(data) : true;

    return {
      name,
      passed: isValid,
      message: isValid 
        ? `✅ ${name} - Valid response` 
        : `❌ ${name} - Invalid response structure`,
      details: { data }
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `❌ ${name} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: String(error) }
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Staging Authentication Tests\n');
  console.log(`Target: ${STAGING_URL}`);
  console.log(`Commit: 2eb261e41`);
  console.log(`Spec: nextauth-v4-rollback\n`);
  console.log('─'.repeat(60));

  // Test 1: Sign-in page
  console.log('\n📋 Test 1: Sign-in Page Access');
  const test1 = await testEndpoint(
    'Sign-in page loads',
    `${STAGING_URL}/auth`
  );
  results.push(test1);
  console.log(test1.message);

  // Test 2: NextAuth session endpoint
  console.log('\n📋 Test 2: NextAuth Session Endpoint');
  const test2 = await testJsonEndpoint(
    'Session endpoint responds',
    `${STAGING_URL}/api/auth/session`
  );
  results.push(test2);
  console.log(test2.message);

  // Test 3: NextAuth providers endpoint
  console.log('\n📋 Test 3: NextAuth Providers Endpoint');
  const test3 = await testJsonEndpoint(
    'Providers endpoint responds',
    `${STAGING_URL}/api/auth/providers`,
    (data) => {
      // Should have google and credentials providers
      return typeof data === 'object' && data !== null;
    }
  );
  results.push(test3);
  console.log(test3.message);
  if (test3.details?.data) {
    console.log('   Providers:', Object.keys(test3.details.data).join(', '));
  }

  // Test 4: NextAuth CSRF endpoint
  console.log('\n📋 Test 4: NextAuth CSRF Endpoint');
  const test4 = await testJsonEndpoint(
    'CSRF endpoint responds',
    `${STAGING_URL}/api/auth/csrf`,
    (data) => {
      return data && typeof data.csrfToken === 'string';
    }
  );
  results.push(test4);
  console.log(test4.message);

  // Test 5: Protected route (should redirect to auth)
  console.log('\n📋 Test 5: Protected Route Redirect');
  const test5 = await testEndpoint(
    'Dashboard redirects when unauthenticated',
    `${STAGING_URL}/dashboard`,
    307 // Redirect status
  );
  results.push(test5);
  console.log(test5.message);

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${percentage}%\n`);

  if (passed === total) {
    console.log('✅ All automated tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Manually test credential sign-in');
    console.log('   2. Manually test Google OAuth sign-in');
    console.log('   3. Verify session persistence');
    console.log('   4. Check cookie security settings');
    console.log('\n   See: .kiro/specs/nextauth-v4-rollback/STAGING_TESTING_GUIDE.md');
  } else {
    console.log('❌ Some tests failed. Review the results above.');
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check Amplify build logs');
    console.log('   2. Verify environment variables');
    console.log('   3. Check deployment status');
  }

  console.log('\n' + '─'.repeat(60));

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
