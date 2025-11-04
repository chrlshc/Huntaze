#!/usr/bin/env node

/**
 * Validation script to confirm staging login fix is working
 */

const stagingUrl = process.env.STAGING_URL || 'https://staging.huntaze.com';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    
    const status = response.status;
    const isHealthy = data.status === 'healthy';
    const hasError = !!data.error;
    
    console.log(`   Status Code: ${status}`);
    console.log(`   Service Status: ${data.status || 'N/A'}`);
    
    if (hasError) {
      console.log(`   ❌ Error: ${data.error}`);
    }
    
    if (data.details && data.details.criticalIssues && data.details.criticalIssues.length > 0) {
      console.log(`   🚨 Critical Issues: ${data.details.criticalIssues.join(', ')}`);
    }
    
    return {
      name,
      status,
      isHealthy,
      hasError,
      data,
      success: status < 500 && !hasError
    };
    
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return {
      name,
      status: 'error',
      isHealthy: false,
      hasError: true,
      error: error.message,
      success: false
    };
  }
}

async function runValidationSuite() {
  console.log('🧪 STAGING LOGIN FIX - VALIDATION SUITE');
  console.log(`Target: ${stagingUrl}`);
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test 1: Overall Health Check
  const overallHealth = await testEndpoint(
    'Overall System Health',
    `${stagingUrl}/api/health/overall`
  );
  results.push(overallHealth);
  
  // Test 2: Database Health Check
  const dbHealth = await testEndpoint(
    'Database Health',
    `${stagingUrl}/api/health/database`
  );
  results.push(dbHealth);
  
  // Test 3: Auth Health Check
  const authHealth = await testEndpoint(
    'Authentication Health',
    `${stagingUrl}/api/health/auth`
  );
  results.push(authHealth);
  
  // Test 4: Config Health Check
  const configHealth = await testEndpoint(
    'Configuration Health',
    `${stagingUrl}/api/health/config`
  );
  results.push(configHealth);
  
  // Test 5: Login Endpoint (should return 401, not 500)
  const loginTest = await testEndpoint(
    'Login Endpoint',
    `${stagingUrl}/api/auth/login`,
    {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    }
  );
  results.push(loginTest);
  
  return results;
}

function analyzeResults(results) {
  console.log('\n📊 VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  const criticalTests = ['Overall System Health', 'Database Health', 'Authentication Health'];
  const criticalFailures = results.filter(r => 
    criticalTests.includes(r.name) && !r.success
  );
  
  const loginTest = results.find(r => r.name === 'Login Endpoint');
  const loginFixed = loginTest && loginTest.status !== 500;
  
  console.log('\n✅ CRITICAL SYSTEMS:');
  criticalTests.forEach(testName => {
    const result = results.find(r => r.name === testName);
    const status = result?.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${testName}`);
  });
  
  console.log('\n🔐 LOGIN FUNCTIONALITY:');
  if (loginFixed) {
    console.log('   ✅ FIXED - Login no longer returns 500 error');
    if (loginTest.status === 401) {
      console.log('   ✅ EXPECTED - Returns 401 for invalid credentials');
    }
  } else {
    console.log('   ❌ NOT FIXED - Login still returns 500 error');
  }
  
  const overallSuccess = criticalFailures.length === 0 && loginFixed;
  
  console.log('\n🎯 OVERALL RESULT:');
  if (overallSuccess) {
    console.log('   ✅ SUCCESS - Staging login error has been RESOLVED!');
    console.log('   🚀 Smart Onboarding testing can proceed');
  } else {
    console.log('   ❌ FAILURE - Issues still exist');
    console.log('   🔄 Rollback or additional fixes may be needed');
  }
  
  return {
    overallSuccess,
    criticalFailures,
    loginFixed,
    results
  };
}

function generateReport(analysis) {
  console.log('\n📋 DETAILED REPORT');
  console.log('='.repeat(60));
  
  if (analysis.overallSuccess) {
    console.log('\n🎉 STAGING LOGIN ERROR - RESOLVED');
    console.log('-'.repeat(40));
    console.log('✅ All critical health checks passing');
    console.log('✅ Login endpoint no longer returns 500 errors');
    console.log('✅ Authentication system operational');
    console.log('✅ Database connectivity restored');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Test Smart Onboarding functionality');
    console.log('2. Perform end-to-end user journey testing');
    console.log('3. Monitor for any additional issues');
    console.log('4. Document the fix for future reference');
    
  } else {
    console.log('\n🚨 STAGING LOGIN ERROR - NOT FULLY RESOLVED');
    console.log('-'.repeat(40));
    
    if (analysis.criticalFailures.length > 0) {
      console.log('\n❌ Critical System Failures:');
      analysis.criticalFailures.forEach(failure => {
        console.log(`   - ${failure.name}: ${failure.error || 'Health check failed'}`);
      });
    }
    
    if (!analysis.loginFixed) {
      console.log('\n❌ Login Still Broken:');
      const loginResult = analysis.results.find(r => r.name === 'Login Endpoint');
      console.log(`   - Status: ${loginResult?.status || 'Unknown'}`);
      console.log(`   - Error: ${loginResult?.data?.error || 'Internal server error'}`);
    }
    
    console.log('\n🔄 RECOMMENDED ACTIONS:');
    console.log('1. Review environment variables configuration');
    console.log('2. Check AWS Amplify deployment logs');
    console.log('3. Consider rollback if issues persist');
    console.log('4. Escalate to DevOps team if needed');
  }
  
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${analysis.results.length}`);
  console.log(`   Passed: ${analysis.results.filter(r => r.success).length}`);
  console.log(`   Failed: ${analysis.results.filter(r => !r.success).length}`);
  console.log(`   Critical Failures: ${analysis.criticalFailures.length}`);
}

async function main() {
  try {
    const results = await runValidationSuite();
    const analysis = analyzeResults(results);
    generateReport(analysis);
    
    // Exit with appropriate code
    process.exit(analysis.overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Validation suite failed:', error);
    console.log('\n💡 This might indicate network issues or staging unavailability');
    console.log('   Try running the validation manually with curl commands');
    process.exit(1);
  }
}

main();