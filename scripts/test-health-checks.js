#!/usr/bin/env node

/**
 * Script to test health check endpoints and diagnose login issues
 */

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testHealthEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Testing ${endpoint}...`);
    
    const response = await fetch(`${baseUrl}/api/health/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Service: ${data.service}`);
    console.log(`Health: ${data.status}`);
    console.log(`Response Time: ${data.responseTime || 'N/A'}`);
    
    if (data.error) {
      console.log(`❌ Error: ${data.error}`);
    }
    
    if (data.details) {
      console.log('📋 Details:');
      console.log(JSON.stringify(data.details, null, 2));
    }

    return { endpoint, status: response.status, data };
    
  } catch (error) {
    console.log(`❌ Failed to test ${endpoint}: ${error.message}`);
    return { endpoint, status: 'error', error: error.message };
  }
}

async function testLoginEndpoint() {
  try {
    console.log(`\n🔍 Testing login endpoint...`);
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { endpoint: 'login', status: response.status, data };
    
  } catch (error) {
    console.log(`❌ Failed to test login: ${error.message}`);
    return { endpoint: 'login', status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Health Check Diagnostics');
  console.log(`Base URL: ${baseUrl}`);
  console.log('=' .repeat(50));

  // Test all health endpoints
  const healthResults = await Promise.all([
    testHealthEndpoint('database'),
    testHealthEndpoint('auth'),
    testHealthEndpoint('config'),
    testHealthEndpoint('overall')
  ]);

  // Test login endpoint
  const loginResult = await testLoginEndpoint();

  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));

  // Analyze results
  const criticalIssues = [];
  
  healthResults.forEach(result => {
    if (result.status >= 500) {
      criticalIssues.push(`${result.endpoint} service is unhealthy`);
    }
  });

  if (loginResult.status >= 500) {
    criticalIssues.push('Login endpoint is returning 500 errors');
  }

  if (criticalIssues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES FOUND:');
    criticalIssues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ No critical issues detected');
  }

  // Recommendations
  console.log('\n💡 NEXT STEPS:');
  if (criticalIssues.length > 0) {
    console.log('  1. Review the detailed error messages above');
    console.log('  2. Check database connectivity and configuration');
    console.log('  3. Verify environment variables are properly set');
    console.log('  4. Check for Smart Onboarding integration conflicts');
  } else {
    console.log('  1. All health checks passed - investigate other potential causes');
    console.log('  2. Check application logs for runtime errors');
    console.log('  3. Verify staging environment configuration');
  }

  console.log('\n🏁 Diagnostic complete');
}

// Run the diagnostic
main().catch(error => {
  console.error('Diagnostic script failed:', error);
  process.exit(1);
});